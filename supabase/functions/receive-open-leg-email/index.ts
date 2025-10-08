import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming request - handle both JSON and raw HTML
    const contentType = req.headers.get("content-type") || "";
    let html: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      html = body.html;
    } else {
      // Assume raw HTML/text body
      html = await req.text();
    }

    if (!html) {
      return new Response(
        JSON.stringify({ error: "No HTML content provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Received HTML email, parsing with AI...");

    // Use Lovable AI to parse the HTML
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert at parsing aviation open leg and aircraft availability emails. Extract structured data from the HTML email content provided.

CRITICAL DATE PARSING RULES:
- Today's date is ${new Date().toISOString().split('T')[0]}
- If a date mentions only month and day (e.g., "Oct 8", "October 8"), use the current year (${new Date().getFullYear()})
- If the parsed date would be in the past, assume it's for next year
- Always return dates in YYYY-MM-DD format
- Parse times as HH:MM:SS in 24-hour format when available
- If only general time mentioned (morning, afternoon, evening), put that in notes instead

AIRPORT CODE EXTRACTION:
- Extract only the airport codes (3-4 letter codes like KDAL, KHOU, KASE)
- If airport codes are in parentheses like "(KDAL)", extract just KDAL
- If full airport names are provided, extract just the code portion
- If destination mentions "transient", "various", "TBD", or similar, use "transient" as the arrival airport

AVAILABILITY DATE RANGE:
- If the email mentions a date range for availability (e.g., "Oct 8-9", "available Oct 8 through Oct 10"), extract both start and end dates
- availability_start_date should be the first date mentioned
- availability_end_date should be the last date mentioned
- If only a single date is mentioned, use the same date for both start and end

Return the data in this exact JSON format:
{
  "legs": [
    {
      "operator_name": "operator name if mentioned",
      "aircraft_type": "aircraft type/model",
      "tail_number": "registration/tail number if available",
      "departure_airport": "ONLY the airport code (e.g., KDAL, KHOU)",
      "arrival_airport": "ONLY the airport code OR 'transient' if mentioned",
      "departure_date": "YYYY-MM-DD format - departure date if different from availability period",
      "departure_time": "HH:MM:SS format if specific time available, null otherwise",
      "arrival_date": "YYYY-MM-DD format if available",
      "arrival_time": "HH:MM:SS format if available",
      "availability_start_date": "YYYY-MM-DD format - first date of availability period",
      "availability_end_date": "YYYY-MM-DD format - last date of availability period",
      "passengers": number of passengers as integer,
      "price": numeric price if mentioned (no currency symbols, just number),
      "notes": "any additional notes, time of day (morning/afternoon/evening), restrictions, or details"
    }
  ]
}

If a field is not available in the email, use null. Extract multiple legs if the email contains multiple aircraft/routes.
Be extremely careful with dates - verify they match what's in the email exactly.`,
          },
          {
            role: "user",
            content: html,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_open_legs",
              description: "Extract structured open leg data from email HTML",
              parameters: {
                type: "object",
                properties: {
                  legs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        operator_name: { type: "string" },
                        aircraft_type: { type: "string" },
                        tail_number: { type: "string" },
                        departure_airport: { type: "string" },
                        arrival_airport: { type: "string" },
                        departure_date: { type: "string" },
                        departure_time: { type: "string" },
                        arrival_date: { type: "string" },
                        arrival_time: { type: "string" },
                        availability_start_date: { type: "string" },
                        availability_end_date: { type: "string" },
                        passengers: { type: "integer" },
                        price: { type: "number" },
                        notes: { type: "string" },
                      },
                    },
                  },
                },
                required: ["legs"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_open_legs" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received:", JSON.stringify(aiData));

    // Extract the parsed data from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_open_legs") {
      throw new Error("AI did not return expected tool call");
    }

    const parsedData = JSON.parse(toolCall.function.arguments);
    console.log("Parsed data:", JSON.stringify(parsedData));

    // Insert each leg into the database
    const insertPromises = parsedData.legs.map(async (leg: any) => {
      const { data, error } = await supabase.from("open_legs").insert({
        operator_name: leg.operator_name || null,
        aircraft_type: leg.aircraft_type || null,
        tail_number: leg.tail_number || null,
        departure_airport: leg.departure_airport || null,
        arrival_airport: leg.arrival_airport || null,
        departure_date: leg.departure_date || null,
        departure_time: leg.departure_time || null,
        arrival_date: leg.arrival_date || null,
        arrival_time: leg.arrival_time || null,
        availability_start_date: leg.availability_start_date || null,
        availability_end_date: leg.availability_end_date || null,
        passengers: leg.passengers || null,
        price: leg.price || null,
        notes: leg.notes || null,
        raw_html: html,
        parsed_data: leg,
      });

      if (error) {
        console.error("Error inserting open leg:", error);
        throw error;
      }

      return data;
    });

    await Promise.all(insertPromises);

    console.log(`Successfully inserted ${parsedData.legs.length} open leg(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully parsed and stored ${parsedData.legs.length} open leg(s)`,
        legs: parsedData.legs,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in receive-open-leg-email function:", error);
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
