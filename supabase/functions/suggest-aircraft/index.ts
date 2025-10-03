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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in response');
      return new Response(
        JSON.stringify({ error: 'Could not generate suggestions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = JSON.parse(content);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.aircraft || suggestions.suggestions || []
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
