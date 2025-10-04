import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, leadContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with lead context
    const systemPrompt = `You are an AI assistant helping a private jet charter broker analyze and manage a lead.

Lead Information:
- Client: ${leadContext.name}
- Email: ${leadContext.email}
- Phone: ${leadContext.phone}
- Trip Type: ${leadContext.tripType}
- Route: ${leadContext.departureAirport} → ${leadContext.arrivalAirport}
- Distance: ${leadContext.distance} nautical miles
- Departure: ${leadContext.departureDate} at ${leadContext.departureTime}
${leadContext.returnDate ? `- Return: ${leadContext.returnDate} at ${leadContext.returnTime}` : ""}
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
1. Answer questions about the route, airports, distance, and logistics
2. Provide insights about aircraft suitability based on distance and runway requirements
3. Suggest optimizations or alternative options when asked
4. Help the broker understand any operational considerations

Keep responses concise, professional, and focused on helping the broker serve this client better. Use aviation terminology appropriately.`;

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

    return new Response(response.body, {
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
