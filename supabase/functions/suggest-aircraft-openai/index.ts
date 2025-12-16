// OpenAI version of suggest-aircraft
// This example shows function calling migration from Lovable AI to OpenAI

import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { distance, passengers, departure, arrival, departureDate, returnDate } = await req.json();

    if (!distance || !passengers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CHANGED: Use OPENAI_API_KEY instead of LOVABLE_API_KEY
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating aircraft suggestions for:', { distance, passengers, departure, arrival });

    const systemPrompt = `You are an expert private jet charter analyst. Suggest 3-4 suitable aircraft for the given trip.

Available aircraft categories:
- Light Jet (up to 1,500 nm, 6-8 passengers): Phenom 300, Citation CJ3+, Learjet 75
- Super Light Jet (up to 2,000 nm, 7-9 passengers): Phenom 300E, Citation XLS+
- Mid Jet (up to 2,500 nm, 8-9 passengers): Citation Sovereign, Hawker 900XP
- Super Mid Jet (up to 3,500 nm, 9-12 passengers): Citation X, Challenger 350, Gulfstream G280
- Heavy Jet (up to 4,500 nm, 10-16 passengers): Gulfstream G450, Challenger 605, Falcon 2000
- Ultra Long Range (5,000+ nm, 12-19 passengers): Gulfstream G650, Global 7500, Falcon 8X

Consider:
1. Route distance and passenger count
2. Recommend aircraft from minimum capable category plus one category up
3. Prioritize popular, reliable aircraft
4. Brief explanation for each suggestion (1 sentence)

Format as JSON array with: aircraft (name), category, reason`;

    const userPrompt = `Route: ${departure} to ${arrival}
Distance: ${distance} nautical miles
Passengers: ${passengers}
${departureDate ? `Departure: ${departureDate}` : ''}
${returnDate ? `Return: ${returnDate}` : ''}

Suggest 3-4 suitable aircraft with brief reasons.`;

    // CHANGED: Use OpenAI endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // CHANGED: Use OpenAI model
        model: 'gpt-3.5-turbo',  // or 'gpt-4' for better accuracy
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        // Function calling syntax is the same!
        functions: [
          {
            name: "suggest_aircraft",
            description: "Return aircraft suggestions for the trip",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      aircraft: { type: "string" },
                      category: { type: "string" },
                      reason: { type: "string" }
                    },
                    required: ["aircraft", "category", "reason"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        ],
        function_call: { name: "suggest_aircraft" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key invalid.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Function call response structure is slightly different
    const functionCall = data.choices?.[0]?.message?.function_call;
    if (!functionCall) {
      console.error('No function call in response');
      return new Response(
        JSON.stringify({ error: 'Could not generate suggestions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = JSON.parse(functionCall.arguments);
    console.log('Parsed suggestions:', suggestions);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.suggestions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-aircraft function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
