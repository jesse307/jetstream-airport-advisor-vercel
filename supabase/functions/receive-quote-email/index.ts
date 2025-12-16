import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Function to parse quotes using AI
async function parseQuotesWithAI(emailContent: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY found, skipping AI parsing');
    return [];
  }

  console.log('Parsing quotes with AI...');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a quote extraction assistant. Extract charter aircraft quote information from emails (which may contain HTML). For each quote option, extract: aircraft_type, price (numeric only, no currency symbols or commas), passengers, category (Light/Mid/Heavy Jet, Turboprop, etc.), certifications (ARGUS, Wyvern, etc.), operator name, tail_number if mentioned, and any URLs. Remove all HTML tags and formatting. Return clean, structured data.'
          },
          {
            role: 'user',
            content: `Extract all quote options from this email. Look for multiple aircraft options with their details:\n\n${emailContent}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_quotes',
              description: 'Extract structured quote data from email content',
              parameters: {
                type: 'object',
                properties: {
                  quotes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        aircraft_type: { type: 'string', description: 'Aircraft model (e.g., Citation Ultra, Gulfstream G450)' },
                        price: { type: 'number', description: 'Quote price as number only, no commas or currency symbols' },
                        currency: { type: 'string', description: 'Currency code (default: USD)' },
                        passengers: { type: 'number', description: 'Number of passengers' },
                        category: { type: 'string', description: 'Aircraft category (Light Jet, Mid Jet, Heavy Jet, Turboprop, etc.)' },
                        certifications: { type: 'string', description: 'Safety certifications (ARGUS, Wyvern, etc.)' },
                        operator: { type: 'string', description: 'Operator/charter company name if mentioned' },
                        tail_number: { type: 'string', description: 'Aircraft tail number/registration if mentioned (e.g., N12345)' },
                        route: { type: 'string', description: 'Flight route if mentioned' },
                        dates: { type: 'string', description: 'Travel dates if mentioned' },
                        url: { type: 'string', description: 'URL link to detailed quote if present' }
                      },
                      required: ['aircraft_type']
                    }
                  }
                },
                required: ['quotes']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_quotes' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.log('No tool call in AI response');
      return [];
    }

    const parsedQuotes = JSON.parse(toolCall.function.arguments);
    console.log(`AI extracted ${parsedQuotes.quotes?.length || 0} quotes`);

    return parsedQuotes.quotes || [];
  } catch (error) {
    console.error('Error parsing with AI:', error);
    return [];
  }
}

// Function to parse client/trip information using AI
async function parseClientInfoWithAI(emailContent: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY found, skipping client info parsing');
    return {};
  }

  console.log('Parsing client information with AI...');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a client information extraction assistant. Extract client and trip details from charter quote emails (which may contain HTML). Extract: client name, email address, phone number, passenger count, routing (departure and arrival airports), trip dates, trip type, and any additional notes. Remove all HTML tags and formatting. Return clean, structured data.'
          },
          {
            role: 'user',
            content: `Extract client and trip information from this email:\n\n${emailContent}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_client_info',
              description: 'Extract structured client and trip data from email content',
              parameters: {
                type: 'object',
                properties: {
                  client_name: { type: 'string', description: 'Full name of the client' },
                  client_first_name: { type: 'string', description: 'Client first name' },
                  client_last_name: { type: 'string', description: 'Client last name' },
                  client_email: { type: 'string', description: 'Client email address' },
                  client_phone: { type: 'string', description: 'Client phone number if mentioned' },
                  passenger_count: { type: 'number', description: 'Number of passengers' },
                  departure_airport: { type: 'string', description: 'Departure airport code or name' },
                  arrival_airport: { type: 'string', description: 'Arrival airport code or name' },
                  routing: { type: 'string', description: 'Full routing description (e.g., "TEB to TPA")' },
                  departure_date: { type: 'string', description: 'Departure date' },
                  return_date: { type: 'string', description: 'Return date if applicable' },
                  trip_type: { type: 'string', description: 'Trip type (one-way, round-trip, multi-leg)' },
                  notes: { type: 'string', description: 'Any additional trip notes or special requirements' }
                }
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_client_info' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error for client info:', response.status, errorText);
      return {};
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.log('No tool call in AI response for client info');
      return {};
    }

    const clientInfo = JSON.parse(toolCall.function.arguments);
    console.log('AI extracted client info:', Object.keys(clientInfo).join(', '));

    return clientInfo;
  } catch (error) {
    console.error('Error parsing client info with AI:', error);
    return {};
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Quote email webhook received - Method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Always read as text first to handle Make.com's inconsistent formatting
    const textBody = await req.text();
    console.log("Raw body (first 500 chars):", textBody.substring(0, 500));

    let emailData: any = {};
    let rawContent = textBody;

    // Try to parse as JSON if it looks like JSON
    if (textBody.trim().startsWith("{") || textBody.trim().startsWith("[")) {
      try {
        emailData = JSON.parse(textBody);
        console.log("Successfully parsed as JSON");

        // Extract raw email content for AI parsing
        rawContent = emailData.html || emailData.body || emailData.text || textBody;
      } catch (e) {
        console.log("Failed to parse as JSON:", e);
        emailData = { raw_text: textBody };
      }
    } else {
      // If it's HTML or other format, store it as raw text
      console.log("Non-JSON content received");
      emailData = { raw_text: textBody };
    }

    console.log("Received email data:", JSON.stringify(emailData).substring(0, 200));

    // Check if JSON already contains parsed quotes array (from Make.com)
    let quotesArray = emailData.quotes || [];

    // If no pre-parsed quotes, use AI to extract them
    if (quotesArray.length === 0) {
      console.log('No pre-parsed quotes found, using AI to extract...');
      quotesArray = await parseQuotesWithAI(rawContent);
    } else {
      console.log(`Found ${quotesArray.length} pre-parsed quotes`);
    }

    // Extract client information using AI
    let clientInfo = emailData.client_info || {};
    if (Object.keys(clientInfo).length === 0) {
      console.log('No pre-parsed client info found, using AI to extract...');
      clientInfo = await parseClientInfoWithAI(rawContent);
    } else {
      console.log('Found pre-parsed client info');
    }

    // Handle Resend inbound email format for backward compatibility
    const senderEmail = emailData.from?.address || emailData.from || emailData.sender || emailData.From || emailData.sender_email || null;
    const subject = emailData.subject || emailData.Subject || "Quote Submission";

    // Store quote directly
    const { data: quoteRecord, error: insertError } = await supabase
      .from("quotes")
      .insert({
        raw_email_data: emailData,
        sender_email: senderEmail,
        subject: subject,
        extracted_data: {
          quotes: quotesArray,
          client_info: clientInfo
        },
        processed: true,
        status: 'completed'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting quote:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Quote record created:", quoteRecord.id, "with", quotesArray.length, "quotes and client info");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quotes and client info received and processed with AI",
        quoteId: quoteRecord.id,
        quotesExtracted: quotesArray.length,
        clientInfo: clientInfo
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in receive-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
