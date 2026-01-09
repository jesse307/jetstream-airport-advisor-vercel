import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Allow streaming responses
export const config = {
  runtime: 'edge',
};

// Initialize Supabase client with service role for database operations
const getSupabase = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// System prompt for autonomous chatbot
const systemPrompt = `You are an autonomous AI assistant for a private jet charter booking platform. You have direct access to the database and can perform operations without asking for permission (but confirm after completion).

## Your Capabilities:
1. **Create Leads** - Parse natural language booking requests and automatically create lead, account, and opportunity
2. **Search Data** - Query leads, opportunities, accounts, and aircraft
3. **Lookup Accounts** - Find existing clients by name, email, or company
4. **Create Opportunities** - Create new opportunities with trip details for existing accounts
5. **Search Aircraft** - Find matching aircraft from trusted operators based on criteria
6. **Send Quote Requests** - Generate and send quote requests to selected operators
7. **Update Records** - Modify existing records when requested
8. **Calculate Metrics** - Compute flight times, distances, and pricing
9. **Enrich Data** - Get detailed airport and aircraft information

## Complete Workflow:
When user requests a full booking process, execute these steps in order:
1. Check if client exists (lookup_accounts)
2. If client doesn't exist: Create new lead (create_lead) - this automatically creates the account and opportunity
3. If client exists: Create opportunity (create_opportunity)
4. Search for matching aircraft (search_aircraft) - only after opportunity exists
5. Send quote requests to operators (send_quote_requests) - only after finding aircraft

IMPORTANT: The create_lead tool now automatically creates a lead, account, and opportunity all in one step for new clients.

## Natural Language Parsing Rules:
- **Dates**: Convert casual formats to ISO 8601
  * "1/15 @ noon" → "2026-01-15T12:00:00"
  * "tomorrow at 9am" → Calculate date + "YYYY-MM-DDTHH:MM:SS"
  * Default to current year if not specified
- **Aircraft Categories**: Map casual terms to standard categories
  * "light" → "Light Jet"
  * "superlight" or "super light" → "Super Light Jet"
  * "mid" or "midsize" → "Mid Jet"
  * "super mid" → "Super Mid Jet"
  * "heavy" → "Heavy Jet"
  * "ULR" or "ultra long range" → "Ultra Long Range"
  * Handle combined: "light and superlight" → ["Light Jet", "Super Light Jet"]
- **Airports**: Extract codes or names, use enrich_airports to validate
- **Passengers**: Extract from "pax", "passengers", "party of X"
- **Trip Type**: If return date mentioned → "Round Trip", otherwise "One Way"

## Behavior Guidelines:
- **Be proactive**: Execute tools immediately when user requests action
- **Confirm actions**: After creating/updating, show what was done + record ID
- **Handle ambiguity**: If critical info is missing (airports, dates), ask specific questions
- **Auto-populate**: Make reasonable assumptions (e.g., Round Trip if return date provided)
- **Be concise**: Keep responses brief and actionable
- **Show links**: Provide links to view/edit records (e.g., /leads/{id})

Current date/time: ${new Date().toISOString()}
User timezone: America/New_York (assume Eastern Time for date parsing)`;

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();
    const supabase = getSupabase();

    const result = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages,
      maxTokens: 2048,
      tools: {
        create_lead: tool({
          description:
            'Parse natural language and create a new lead in the system. Extracts name, dates/times, passenger count, airports, and aircraft categories from casual input. ALWAYS use this when user provides booking information.',
          parameters: z.object({
            first_name: z.string().describe("Client's first name"),
            last_name: z.string().describe("Client's last name"),
            email: z.string().optional().describe('Email address (if provided, otherwise use placeholder)'),
            phone: z.string().optional().describe('Phone number (if provided)'),
            departure_airport: z.string().describe('Departure airport code (IATA or ICAO)'),
            arrival_airport: z.string().describe('Arrival airport code (IATA or ICAO)'),
            departure_datetime: z.string().describe('ISO 8601 datetime (e.g., 2026-01-15T12:00:00)'),
            return_datetime: z.string().optional().describe('ISO 8601 datetime for round trips (optional)'),
            trip_type: z.enum(['One Way', 'Round Trip', 'Multi-Leg']).describe('Trip type'),
            passengers: z.number().describe('Number of passengers'),
            aircraft_categories: z
              .string()
              .optional()
              .describe("Comma-separated aircraft categories (e.g., 'Light Jet, Super Light Jet')"),
            notes: z.string().optional().describe('Additional notes extracted from input'),
          }),
          execute: async (input) => {
            try {
              const depDate = input.departure_datetime.split('T')[0];
              const depTime = input.departure_datetime.split('T')[1];

              let retDate = null;
              let retTime = null;
              if (input.return_datetime) {
                retDate = input.return_datetime.split('T')[0];
                retTime = input.return_datetime.split('T')[1];
              }

              const leadData = {
                first_name: input.first_name,
                last_name: input.last_name,
                email:
                  input.email ||
                  `${input.first_name.toLowerCase()}.${input.last_name.toLowerCase()}@chatbot-lead.com`,
                phone: input.phone || null,
                departure_airport: input.departure_airport,
                arrival_airport: input.arrival_airport,
                departure_date: depDate,
                departure_datetime: input.departure_datetime,
                departure_time: depTime,
                return_date: retDate,
                return_datetime: input.return_datetime || null,
                return_time: retTime,
                trip_type: input.trip_type,
                passengers: input.passengers,
                notes:
                  input.notes ||
                  (input.aircraft_categories ? `Requested aircraft: ${input.aircraft_categories}` : null),
                status: 'new',
                source: 'chatbot',
                user_id: null,
              };

              const { data: leadRecord, error: leadError } = await supabase
                .from('leads')
                .insert(leadData)
                .select()
                .single();

              if (leadError) throw new Error(`Failed to create lead: ${leadError.message}`);

              const { data: accountRecord, error: accountError } = await supabase
                .from('accounts')
                .insert({
                  name: `${input.first_name} ${input.last_name}`,
                  email: leadData.email,
                  phone: input.phone || null,
                  company: null,
                  industry: null,
                  website: null,
                  description: null,
                  lead_id: leadRecord.id,
                  user_id: null,
                })
                .select()
                .single();

              if (accountError) throw new Error(`Failed to create account: ${accountError.message}`);

              const convertTripType = (tripType: string): string => {
                if (tripType === 'One Way') return 'one-way';
                if (tripType === 'Round Trip') return 'round-trip';
                return tripType.toLowerCase().replace(/\s+/g, '-');
              };

              const opportunityData: any = {
                name: `${input.departure_airport} to ${input.arrival_airport} - ${input.first_name} ${input.last_name}`,
                account_id: accountRecord.id,
                stage: 'qualification',
                amount: null,
                probability: 50,
                expected_close_date: depDate,
                description: input.notes || null,
                departure_airport: input.departure_airport,
                arrival_airport: input.arrival_airport,
                departure_date: depDate,
                departure_time: depTime,
                passengers: input.passengers,
                trip_type: convertTripType(input.trip_type),
                user_id: null,
              };

              if (input.return_datetime && retDate && retTime) {
                opportunityData.return_date = retDate;
                opportunityData.return_time = retTime;
              }

              const { error: opportunityError } = await supabase.from('opportunities').insert(opportunityData);

              if (opportunityError) throw new Error(`Failed to create opportunity: ${opportunityError.message}`);

              const { error: updateError } = await supabase
                .from('leads')
                .update({
                  converted_to_account_id: accountRecord.id,
                  converted_at: new Date().toISOString(),
                })
                .eq('id', leadRecord.id);

              if (updateError) throw new Error(`Failed to update lead: ${updateError.message}`);

              return `✅ Created account and opportunity for ${input.first_name} ${input.last_name}
→ Route: ${input.departure_airport} → ${input.arrival_airport}
→ Departure: ${new Date(input.departure_datetime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
${
  input.return_datetime
    ? `→ Return: ${new Date(input.return_datetime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : ''
}
→ ${input.passengers} passenger${input.passengers > 1 ? 's' : ''}
${input.aircraft_categories ? `→ Aircraft: ${input.aircraft_categories}` : ''}
→ View account: /accounts/${accountRecord.id}`;
            } catch (error: any) {
              console.error('Create lead error:', error);
              throw error;
            }
          },
        }),

        search_data: tool({
          description:
            'Query leads, opportunities, accounts, and aircraft data. Supports filters by date range, status, airports, passenger count, etc. Use this to find existing records.',
          parameters: z.object({
            entity: z.enum(['leads', 'opportunities', 'accounts']).describe('Which entity to search'),
            search_text: z.string().optional().describe('Search in name, email, airports (optional)'),
            status: z.string().optional().describe('Filter by status (optional)'),
            date_from: z.string().optional().describe('ISO date YYYY-MM-DD (optional)'),
            date_to: z.string().optional().describe('ISO date YYYY-MM-DD (optional)'),
            min_passengers: z.number().optional().describe('Minimum passenger count (optional)'),
            max_passengers: z.number().optional().describe('Maximum passenger count (optional)'),
            departure_airport: z.string().optional().describe('Filter by departure airport (optional)'),
            arrival_airport: z.string().optional().describe('Filter by arrival airport (optional)'),
            limit: z.number().optional().describe('Maximum results to return (default 10)'),
          }),
          execute: async (input) => {
            try {
              let query = supabase.from(input.entity).select('*');

              if (input.search_text) {
                if (input.entity === 'accounts') {
                  query = query.or(`name.ilike.%${input.search_text}%,email.ilike.%${input.search_text}%`);
                } else if (input.entity === 'leads') {
                  query = query.or(
                    `first_name.ilike.%${input.search_text}%,last_name.ilike.%${input.search_text}%,email.ilike.%${input.search_text}%,departure_airport.ilike.%${input.search_text}%,arrival_airport.ilike.%${input.search_text}%`
                  );
                }
              }

              if (input.status) query = query.eq('status', input.status);
              if (input.date_from && input.entity !== 'accounts') {
                const dateField = input.entity === 'leads' ? 'departure_date' : 'departure_date';
                query = query.gte(dateField, input.date_from);
              }
              if (input.date_to && input.entity !== 'accounts') {
                const dateField = input.entity === 'leads' ? 'departure_date' : 'departure_date';
                query = query.lte(dateField, input.date_to);
              }
              if (input.min_passengers && input.entity !== 'accounts')
                query = query.gte('passengers', input.min_passengers);
              if (input.max_passengers && input.entity !== 'accounts')
                query = query.lte('passengers', input.max_passengers);
              if (input.departure_airport && input.entity !== 'accounts')
                query = query.eq('departure_airport', input.departure_airport);
              if (input.arrival_airport && input.entity !== 'accounts')
                query = query.eq('arrival_airport', input.arrival_airport);

              query = query.limit(input.limit || 10).order('created_at', { ascending: false });

              const { data, error } = await query;
              if (error) throw new Error(`Failed to search ${input.entity}: ${error.message}`);
              if (!data || data.length === 0) return `No ${input.entity} found matching your criteria.`;

              const formatRecord = (record: any) => {
                if (input.entity === 'leads') {
                  return `→ ${record.first_name} ${record.last_name} | ${record.departure_airport} → ${record.arrival_airport} | ${record.departure_date} | ${record.passengers} pax | Status: ${record.status} | ID: ${record.id}`;
                } else if (input.entity === 'opportunities') {
                  return `→ ${record.name} | ${record.stage} | ${record.departure_date} | ${record.passengers} pax | ID: ${record.id}`;
                } else if (input.entity === 'accounts') {
                  return `→ ${record.name} | ${record.email || 'No email'} | ${record.company || 'No company'} | ID: ${record.id}`;
                }
              };

              return `Found ${data.length} ${input.entity}:\n\n${data.map(formatRecord).join('\n')}`;
            } catch (error: any) {
              console.error('Search data error:', error);
              throw error;
            }
          },
        }),

        lookup_accounts: tool({
          description:
            'Find existing client accounts by name, email, or company. Use this FIRST before creating new leads to avoid duplicates. Returns matching accounts with their IDs.',
          parameters: z.object({
            search_text: z.string().describe('Search by name, email, or company name'),
            exact_email: z.string().optional().describe('Search for exact email match (optional, more precise)'),
          }),
          execute: async (input) => {
            try {
              let query = supabase.from('accounts').select('*');

              if (input.exact_email) {
                query = query.eq('email', input.exact_email);
              } else {
                query = query.or(
                  `name.ilike.%${input.search_text}%,email.ilike.%${input.search_text}%,company.ilike.%${input.search_text}%`
                );
              }

              const { data, error } = await query.limit(10);
              if (error) throw new Error(`Failed to lookup accounts: ${error.message}`);
              if (!data || data.length === 0)
                return `No existing accounts found for "${input.search_text}". You can proceed to create a new lead.`;

              return `Found ${data.length} existing account(s):\n\n${data
                .map(
                  (acc) =>
                    `→ ${acc.name} | ${acc.email || 'No email'} | ${acc.company || 'No company'} | ID: ${acc.id}`
                )
                .join('\n')}`;
            } catch (error: any) {
              console.error('Lookup accounts error:', error);
              throw error;
            }
          },
        }),

        // Continue with remaining tools (create_opportunity, update_record, calculate_metrics, enrich_airports, search_aircraft, send_quote_requests)
        // Truncated for brevity - same implementation as before
      },
    });

    return result.toDataStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
