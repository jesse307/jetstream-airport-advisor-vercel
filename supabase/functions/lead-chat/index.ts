import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, leadContext, leadId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build system prompt with lead context
    const systemPrompt = `You are an AI assistant helping a private jet charter broker analyze and manage a lead. You have access to the internet and can search for current information.

Lead Information:
- Client: ${leadContext.name}
- Email: ${leadContext.email}
- Phone: ${leadContext.phone}
- Trip Type: ${leadContext.tripType}
- Route: ${leadContext.departureAirport} → ${leadContext.arrivalAirport}
- Distance: ${leadContext.distance} nautical miles
- Departure: ${leadContext.departureDate}
${leadContext.returnDate ? `- Return: ${leadContext.returnDate}` : ""}
- Passengers: ${leadContext.passengers}

Departure Airport Details:
- Code: ${leadContext.departureAirportInfo?.code || "N/A"}
- Name: ${leadContext.departureAirportInfo?.name || "N/A"}
- Location: ${leadContext.departureAirportInfo?.city || "N/A"}, ${leadContext.departureAirportInfo?.state || leadContext.departureAirportInfo?.country || "N/A"}
- Runway Length: ${leadContext.departureAirportInfo?.runwayLength ? leadContext.departureAirportInfo.runwayLength + " ft" : "N/A"}

Arrival Airport Details:
- Code: ${leadContext.arrivalAirportInfo?.code || "N/A"}
- Name: ${leadContext.arrivalAirportInfo?.name || "N/A"}
- Location: ${leadContext.arrivalAirportInfo?.city || "N/A"}, ${leadContext.arrivalAirportInfo?.state || leadContext.arrivalAirportInfo?.country || "N/A"}
- Runway Length: ${leadContext.arrivalAirportInfo?.runwayLength ? leadContext.arrivalAirportInfo.runwayLength + " ft" : "N/A"}

Your role is to:
1. Answer questions about the route, airports, distance, and logistics using current information
2. Use the web_search tool to find current information about airports, weather, aviation regulations, or any other relevant topics
3. When changing airports, ALWAYS use search_airport_details to get complete information including runway lengths
4. Provide insights about aircraft suitability based on distance and runway requirements
5. Suggest optimizations or alternative options when asked
6. Help the broker understand any operational considerations
7. Detect when the user wants to make changes to the lead details

CRITICAL AIRPORT CODE HANDLING:
- If user provides a 3-letter airport code and a 4-letter ICAO code is needed, assume it's a US airport and add 'K' prefix (e.g., JFK → KJFK)
- When replacing an airport, ALWAYS search for its details first to get runway lengths and location info
- Update ALL instances where the airport is referenced

CRITICAL INSTRUCTIONS FOR UPDATING LEAD DETAILS:
- ANY TIME the user says they want to change airports, dates, times, passenger count, or trip type - IMMEDIATELY use the appropriate tools
- For airport changes: FIRST use search_airport_details, THEN use update_lead_details with the complete information
- Examples that should trigger updates:
  * "Change departure to JFK" → search_airport_details for JFK, then update departureAirport
  * "Make it 5 passengers" → update passengers
  * "They're coming back on the 14th" → update returnDatetime
  * "Actually make it round trip" → update tripType
- ALWAYS call the tool when changes are requested, don't just acknowledge - ACT on it
- After calling the tool, confirm what was updated

CRITICAL INSTRUCTIONS FOR DATE HANDLING:
- When the user mentions a specific date, use EXACTLY that date
- Return timestamps in ISO format (YYYY-MM-DDTHH:MM:SS) for datetime fields
- Preserve the local date/time the user specifies
- Double-check your date calculations before calling the update tool

Keep responses concise, professional, and focused on helping the broker serve this client better.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        grounding: {
          googleSearch: {}
        },
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the internet for current information about airports, weather, aviation regulations, or any topic. Use this to get up-to-date information.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to find information on the web"
                  }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "search_airport_details",
              description: "Search for detailed airport information including ICAO code, runway lengths, and location. MUST be called before updating any airport in the lead. Automatically handles 3-letter to 4-letter code conversion for US airports.",
              parameters: {
                type: "object",
                properties: {
                  airportCode: {
                    type: "string",
                    description: "Airport code (3-letter IATA or 4-letter ICAO). If 3 letters and US airport, will automatically add K prefix."
                  }
                },
                required: ["airportCode"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "update_lead_details",
              description: "MUST be called whenever the user requests ANY changes to trip details. For airport changes, call search_airport_details FIRST to get complete info, then call this.",
              parameters: {
                type: "object",
                properties: {
                  passengers: { 
                    type: "number", 
                    description: "New passenger count" 
                  },
                  departureAirport: { 
                    type: "string", 
                    description: "New departure airport code with full details from search_airport_details" 
                  },
                  arrivalAirport: { 
                    type: "string", 
                    description: "New arrival airport code with full details from search_airport_details" 
                  },
                  departureDatetime: { 
                    type: "string", 
                    description: "New departure date and time in ISO format (YYYY-MM-DDTHH:MM:SS)" 
                  },
                  returnDatetime: { 
                    type: "string", 
                    description: "New return date and time in ISO format (YYYY-MM-DDTHH:MM:SS)" 
                  },
                  tripType: { 
                    type: "string", 
                    description: "Trip type: 'one-way' or 'round-trip'" 
                  }
                }
              }
            }
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if we need to handle tool calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(":")) continue;
              if (!line.startsWith("data: ")) continue;
              
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices?.[0];
                
                // Check for tool calls
                if (choice?.delta?.tool_calls) {
                  const toolCall = choice.delta.tool_calls[0];
                  console.log("Tool call detected:", toolCall);
                  
                  if (toolCall.function?.name === "update_lead_details") {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log("Updating lead with:", args);
                    
                    // Build update object
                    const updates: any = {};
                    if (args.passengers !== undefined) updates.passengers = args.passengers;
                    if (args.departureAirport) updates.departure_airport = args.departureAirport;
                    if (args.arrivalAirport) updates.arrival_airport = args.arrivalAirport;
                    if (args.departureDatetime) {
                      updates.departure_datetime = args.departureDatetime;
                      updates.departure_date = args.departureDatetime.split('T')[0];
                      updates.departure_time = args.departureDatetime.split('T')[1];
                    }
                    if (args.returnDatetime) {
                      updates.return_datetime = args.returnDatetime;
                      updates.return_date = args.returnDatetime.split('T')[0];
                      updates.return_time = args.returnDatetime.split('T')[1];
                    }
                    if (args.tripType) updates.trip_type = args.tripType;
                    
                    // Update the lead in database
                    const { error: updateError } = await supabase
                      .from('leads')
                      .update(updates)
                      .eq('id', leadId);
                    
                    if (updateError) {
                      console.error("Error updating lead:", updateError);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        choices: [{
                          delta: {
                            content: `\n\n❌ Failed to update lead: ${updateError.message}`
                          }
                        }]
                      })}\n\n`));
                    } else {
                      console.log("Lead updated successfully");
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        choices: [{
                          delta: {
                            content: `\n\n✅ Updated successfully!`
                          }
                        }]
                      })}\n\n`));
                    }
                  }
                }
                
                // Forward the original chunk
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                
              } catch (e) {
                console.error("Error parsing SSE:", e);
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
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
