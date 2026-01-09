import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // System prompt for autonomous operation
    const systemPrompt = `You are an autonomous AI assistant for a private jet charter booking platform. You have direct access to the database and can perform operations without asking for permission (but confirm after completion).

## Your Capabilities:
1. **Create Leads** - Parse natural language booking requests and create leads directly
2. **Search Data** - Query leads, opportunities, accounts, and aircraft
3. **Update Records** - Modify existing records when requested
4. **Calculate Metrics** - Compute flight times, distances, and pricing
5. **Enrich Data** - Get detailed airport and aircraft information

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

## Example Interactions:
User: "Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, light and superlight"
Assistant: [Calls create_lead with parsed data] → "Created lead #1234 for Michael Morgan..."

User: "Show me all leads from last week"
Assistant: [Calls search_data with date filters] → "Found 8 leads from last week..."

Current date/time: ${new Date().toISOString()}
User timezone: America/New_York (assume Eastern Time for date parsing)`;

    // Define tools for Claude
    const tools: Anthropic.Tool[] = [
      {
        name: "create_lead",
        description: "Parse natural language and create a new lead in the system. Extracts name, dates/times, passenger count, airports, and aircraft categories from casual input. ALWAYS use this when user provides booking information.",
        input_schema: {
          type: "object",
          properties: {
            first_name: {
              type: "string",
              description: "Client's first name"
            },
            last_name: {
              type: "string",
              description: "Client's last name"
            },
            email: {
              type: "string",
              description: "Email address (if provided, otherwise use placeholder)"
            },
            phone: {
              type: "string",
              description: "Phone number (if provided)"
            },
            departure_airport: {
              type: "string",
              description: "Departure airport code (IATA or ICAO)"
            },
            arrival_airport: {
              type: "string",
              description: "Arrival airport code (IATA or ICAO)"
            },
            departure_datetime: {
              type: "string",
              description: "ISO 8601 datetime (e.g., 2026-01-15T12:00:00)"
            },
            return_datetime: {
              type: "string",
              description: "ISO 8601 datetime for round trips (optional)"
            },
            trip_type: {
              type: "string",
              enum: ["One Way", "Round Trip", "Multi-Leg"],
              description: "Trip type"
            },
            passengers: {
              type: "number",
              description: "Number of passengers"
            },
            aircraft_categories: {
              type: "string",
              description: "Comma-separated aircraft categories (e.g., 'Light Jet, Super Light Jet')"
            },
            notes: {
              type: "string",
              description: "Additional notes extracted from input"
            }
          },
          required: ["first_name", "last_name", "departure_airport", "arrival_airport", "departure_datetime", "passengers", "trip_type"]
        }
      },
      {
        name: "search_data",
        description: "Query leads, opportunities, accounts, and aircraft data. Supports filters by date range, status, airports, passenger count, etc. Use this to find existing records.",
        input_schema: {
          type: "object",
          properties: {
            entity: {
              type: "string",
              enum: ["leads", "opportunities", "accounts"],
              description: "Which entity to search"
            },
            search_text: {
              type: "string",
              description: "Search in name, email, airports (optional)"
            },
            status: {
              type: "string",
              description: "Filter by status (optional)"
            },
            date_from: {
              type: "string",
              description: "ISO date YYYY-MM-DD (optional)"
            },
            date_to: {
              type: "string",
              description: "ISO date YYYY-MM-DD (optional)"
            },
            min_passengers: {
              type: "number",
              description: "Minimum passenger count (optional)"
            },
            max_passengers: {
              type: "number",
              description: "Maximum passenger count (optional)"
            },
            departure_airport: {
              type: "string",
              description: "Filter by departure airport (optional)"
            },
            arrival_airport: {
              type: "string",
              description: "Filter by arrival airport (optional)"
            },
            limit: {
              type: "number",
              description: "Maximum results to return (default 10)"
            }
          },
          required: ["entity"]
        }
      },
      {
        name: "update_record",
        description: "Modify existing leads, opportunities, or accounts. Requires record ID and fields to update. Use this when user wants to change existing data.",
        input_schema: {
          type: "object",
          properties: {
            entity: {
              type: "string",
              enum: ["leads", "opportunities", "accounts"],
              description: "Which entity to update"
            },
            id: {
              type: "string",
              description: "UUID of the record to update"
            },
            updates: {
              type: "object",
              description: "Fields to update with new values (e.g., {passengers: 4, notes: 'VIP client'})"
            }
          },
          required: ["entity", "id", "updates"]
        }
      },
      {
        name: "calculate_metrics",
        description: "Calculate flight times, distances, and pricing estimates for routes. Uses existing aviation APIs and aircraft database.",
        input_schema: {
          type: "object",
          properties: {
            departure_airport: {
              type: "string",
              description: "Departure airport code"
            },
            arrival_airport: {
              type: "string",
              description: "Arrival airport code"
            },
            aircraft_category: {
              type: "string",
              description: "Specific aircraft category (optional)"
            },
            passengers: {
              type: "number",
              description: "Number of passengers (optional)"
            },
            trip_type: {
              type: "string",
              enum: ["one-way", "round-trip"],
              description: "Trip type for cost calculation (optional)"
            }
          },
          required: ["departure_airport", "arrival_airport"]
        }
      },
      {
        name: "enrich_airports",
        description: "Get detailed airport information including runway lengths, FBOs, coordinates, and location. Critical for determining aircraft suitability. Use this to validate airport codes.",
        input_schema: {
          type: "object",
          properties: {
            airport_codes: {
              type: "array",
              items: { type: "string" },
              description: "Array of airport codes (IATA or ICAO) to look up"
            }
          },
          required: ["airport_codes"]
        }
      }
    ];

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      tools: tools,
    });

    // Handle streaming response with tool execution
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let toolUseBlock: any = null;
          let toolUseInputJson = "";

          for await (const event of stream) {
            // Handle different event types
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                toolUseBlock = event.content_block;
                toolUseInputJson = "";
              }
            }

            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                // Stream text content
                const chunk = {
                  choices: [{
                    delta: {
                      content: event.delta.text
                    }
                  }]
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              } else if (event.delta.type === "input_json_delta") {
                // Accumulate tool input
                toolUseInputJson += event.delta.partial_json;
              }
            }

            if (event.type === "content_block_stop") {
              if (toolUseBlock && toolUseInputJson) {
                // Execute tool
                const toolName = toolUseBlock.name;
                const toolInput = JSON.parse(toolUseInputJson);

                console.log(`Executing tool: ${toolName}`, toolInput);

                // Execute the appropriate tool
                let toolResult: any;
                try {
                  if (toolName === "create_lead") {
                    toolResult = await executeCreateLead(supabase, toolInput);
                  } else if (toolName === "search_data") {
                    toolResult = await executeSearchData(supabase, toolInput);
                  } else if (toolName === "update_record") {
                    toolResult = await executeUpdateRecord(supabase, toolInput);
                  } else if (toolName === "calculate_metrics") {
                    toolResult = await executeCalculateMetrics(supabase, toolInput);
                  } else if (toolName === "enrich_airports") {
                    toolResult = await executeEnrichAirports(supabase, toolInput);
                  }

                  // Stream tool result as text
                  if (toolResult) {
                    const resultChunk = {
                      choices: [{
                        delta: {
                          content: `\n\n${toolResult}`
                        }
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultChunk)}\n\n`));
                  }
                } catch (toolError) {
                  console.error(`Tool execution error:`, toolError);
                  const errorChunk = {
                    choices: [{
                      delta: {
                        content: `\n\n❌ Error: ${toolError instanceof Error ? toolError.message : "Tool execution failed"}`
                      }
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                }

                toolUseBlock = null;
                toolUseInputJson = "";
              }
            }
          }

          // Send [DONE]
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Tool execution functions
async function executeCreateLead(supabase: any, input: any): Promise<string> {
  try {
    // Parse departure datetime
    const depDate = input.departure_datetime.split('T')[0];
    const depTime = input.departure_datetime.split('T')[1];

    // Parse return datetime if provided
    let retDate = null;
    let retTime = null;
    if (input.return_datetime) {
      retDate = input.return_datetime.split('T')[0];
      retTime = input.return_datetime.split('T')[1];
    }

    // Create lead object
    const leadData = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email || `${input.first_name.toLowerCase()}.${input.last_name.toLowerCase()}@chatbot-lead.com`,
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
      notes: input.notes || (input.aircraft_categories ? `Requested aircraft: ${input.aircraft_categories}` : null),
      status: "new",
      source: "chatbot",
      user_id: null // Anonymous for now
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return `✅ Created lead #${data.id.slice(0, 8)} for ${input.first_name} ${input.last_name}
→ Route: ${input.departure_airport} → ${input.arrival_airport}
→ Departure: ${new Date(input.departure_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
${input.return_datetime ? `→ Return: ${new Date(input.return_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
→ ${input.passengers} passenger${input.passengers > 1 ? 's' : ''}
${input.aircraft_categories ? `→ Aircraft: ${input.aircraft_categories}` : ''}
→ View in CRM: /leads/${data.id}`;
  } catch (error) {
    console.error("Create lead error:", error);
    throw error;
  }
}

async function executeSearchData(supabase: any, input: any): Promise<string> {
  try {
    let query = supabase.from(input.entity).select('*');

    // Apply filters
    if (input.search_text) {
      const searchLower = input.search_text.toLowerCase();
      query = query.or(`first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,departure_airport.ilike.%${searchLower}%,arrival_airport.ilike.%${searchLower}%`);
    }

    if (input.status) {
      query = query.eq('status', input.status);
    }

    if (input.date_from) {
      query = query.gte('departure_date', input.date_from);
    }

    if (input.date_to) {
      query = query.lte('departure_date', input.date_to);
    }

    if (input.min_passengers) {
      query = query.gte('passengers', input.min_passengers);
    }

    if (input.max_passengers) {
      query = query.lte('passengers', input.max_passengers);
    }

    if (input.departure_airport) {
      query = query.ilike('departure_airport', `%${input.departure_airport}%`);
    }

    if (input.arrival_airport) {
      query = query.ilike('arrival_airport', `%${input.arrival_airport}%`);
    }

    // Limit results
    const limit = input.limit || 10;
    query = query.limit(limit).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return `No ${input.entity} found matching your criteria.`;
    }

    let result = `Found ${data.length} ${input.entity}:\n\n`;
    data.forEach((record: any, index: number) => {
      if (input.entity === 'leads') {
        result += `${index + 1}. ${record.first_name} ${record.last_name} - ${record.departure_airport}→${record.arrival_airport} - ${record.departure_date} - ${record.passengers} pax - ${record.status}\n`;
      } else if (input.entity === 'accounts') {
        result += `${index + 1}. ${record.name} - ${record.email || 'No email'} - ${record.phone || 'No phone'}\n`;
      } else {
        result += `${index + 1}. ${JSON.stringify(record).slice(0, 100)}...\n`;
      }
    });

    return result;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

async function executeUpdateRecord(supabase: any, input: any): Promise<string> {
  try {
    // Prevent updating protected fields
    const protectedFields = ['id', 'created_at', 'user_id'];
    const updates = { ...input.updates };
    protectedFields.forEach(field => delete updates[field]);

    const { data, error } = await supabase
      .from(input.entity)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return `✅ Updated ${input.entity} record #${input.id.slice(0, 8)}
→ Changes: ${Object.keys(updates).join(', ')}`;
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}

async function executeCalculateMetrics(supabase: any, input: any): Promise<string> {
  try {
    // Get airport coordinates
    const { data: airports, error: airportError } = await supabase
      .from('fallback_airports')
      .select('code, latitude, longitude, name, city')
      .in('code', [input.departure_airport.toUpperCase(), input.arrival_airport.toUpperCase()]);

    if (airportError || !airports || airports.length < 2) {
      return `❌ Could not find coordinates for one or both airports.`;
    }

    const depAirport = airports.find((a: any) => a.code === input.departure_airport.toUpperCase());
    const arrAirport = airports.find((a: any) => a.code === input.arrival_airport.toUpperCase());

    if (!depAirport || !arrAirport) {
      return `❌ Could not find coordinates for one or both airports.`;
    }

    // Calculate distance using Haversine formula
    const R = 3440.065; // Earth's radius in nautical miles
    const lat1 = depAirport.latitude * Math.PI / 180;
    const lat2 = arrAirport.latitude * Math.PI / 180;
    const deltaLat = (arrAirport.latitude - depAirport.latitude) * Math.PI / 180;
    const deltaLon = (arrAirport.longitude - depAirport.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate flight time (assuming ~450 knots average for jets)
    const flightTime = distance / 450;

    // Get pricing estimate from aircraft database
    let pricingInfo = "";
    if (input.aircraft_category) {
      const { data: aircraft } = await supabase
        .from('aircraft')
        .select('hourly_rate_min, hourly_rate_max')
        .eq('category', input.aircraft_category)
        .limit(1)
        .single();

      if (aircraft && aircraft.hourly_rate_min && aircraft.hourly_rate_max) {
        const minCost = aircraft.hourly_rate_min * flightTime;
        const maxCost = aircraft.hourly_rate_max * flightTime;
        const multiplier = input.trip_type === "round-trip" ? 2 : 1;
        pricingInfo = `\n→ Estimated cost: $${(minCost * multiplier).toLocaleString()} - $${(maxCost * multiplier).toLocaleString()} (${input.trip_type || 'one-way'})`;
      }
    }

    return `✈️ ${depAirport.code} (${depAirport.city}) to ${arrAirport.code} (${arrAirport.city})
→ Distance: ${distance.toFixed(0)} nautical miles
→ Flight time: ~${flightTime.toFixed(1)} hours${pricingInfo}`;
  } catch (error) {
    console.error("Calculate metrics error:", error);
    throw error;
  }
}

async function executeEnrichAirports(supabase: any, input: any): Promise<string> {
  try {
    const codes = input.airport_codes.map((code: string) => code.toUpperCase());

    const { data: airports, error } = await supabase
      .from('fallback_airports')
      .select('code, name, city, state, country, latitude, longitude, elevation')
      .in('code', codes);

    if (error) {
      throw new Error(`Airport lookup failed: ${error.message}`);
    }

    if (!airports || airports.length === 0) {
      return `❌ No airport information found for: ${codes.join(', ')}`;
    }

    let result = `Airport Information:\n\n`;
    airports.forEach((airport: any) => {
      result += `${airport.code} - ${airport.name}\n`;
      result += `→ Location: ${airport.city}${airport.state ? ', ' + airport.state : ''}${airport.country ? ', ' + airport.country : ''}\n`;
      result += `→ Coordinates: ${airport.latitude}, ${airport.longitude}\n`;
      if (airport.elevation) result += `→ Elevation: ${airport.elevation} ft\n`;
      result += `\n`;
    });

    return result;
  } catch (error) {
    console.error("Enrich airports error:", error);
    throw error;
  }
}
