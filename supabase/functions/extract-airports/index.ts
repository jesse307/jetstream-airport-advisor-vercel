import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting airports from text:', text);

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
            content: `You are an airport code extraction assistant. Extract departure and arrival airports from user text.
Return ONLY valid airport codes (3-letter IATA codes like JFK, LAX, ORD).
If you find city names, convert them to their primary airport codes.
Examples:
- "from New York to Los Angeles" → departure: JFK, arrival: LAX
- "JFK to LAX" → departure: JFK, arrival: LAX
- "flying from Seattle to Miami" → departure: SEA, arrival: MIA
- "London to Paris" → departure: LHR, arrival: CDG

If you cannot identify valid airports, return empty strings.`
          },
          { role: 'user', content: text }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_airports',
              description: 'Extract departure and arrival airport codes from text',
              parameters: {
                type: 'object',
                properties: {
                  departure: {
                    type: 'string',
                    description: 'The 3-letter IATA departure airport code (e.g., JFK, LAX, ORD)'
                  },
                  arrival: {
                    type: 'string',
                    description: 'The 3-letter IATA arrival airport code (e.g., JFK, LAX, ORD)'
                  }
                },
                required: ['departure', 'arrival'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_airports' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ error: 'Could not extract airports from text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const airports = JSON.parse(toolCall.function.arguments);
    console.log('Extracted airports:', airports);

    // Validate airport codes (should be 3 letters)
    const isValidCode = (code: string) => code && /^[A-Z]{3}$/.test(code.toUpperCase());
    
    if (!isValidCode(airports.departure) || !isValidCode(airports.arrival)) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not identify valid airport codes. Please try again with airport codes (e.g., JFK, LAX) or city names.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        departure: airports.departure.toUpperCase(),
        arrival: airports.arrival.toUpperCase()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-airports function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
