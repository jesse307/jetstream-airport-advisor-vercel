// OpenAI version of generate-flight-analysis
// This is an example showing how to migrate from Lovable AI to OpenAI

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
    const { departure, arrival, distance, passengers, flightTime } = await req.json();

    if (!departure || !arrival || !distance || !passengers) {
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

    console.log('Generating flight analysis for:', { departure, arrival, distance, passengers, flightTime });

    const systemPrompt = `You are an expert private jet charter analyst. Generate a brief 2-3 sentence analysis for sales teams.

ALWAYS start your response with: "Do you have a preferred aircraft for this route? Quick analysis shows that a super-mid aircraft can do the trip non-stop with 11 people and normal luggage. If you're looking for more space, we can certainly look at heavy jets as well"

Then add 1-2 additional sentences with specific insights about:
- Route characteristics (distance, typical considerations)
- Passenger capacity recommendations
- Any special considerations (long distance, popular route, etc.)

Keep it conversational and sales-focused.`;

    const userPrompt = `Route: ${departure} to ${arrival}
Distance: ${distance} nautical miles
Passengers: ${passengers}
${flightTime ? `Estimated Flight Time: ${flightTime}` : ''}

Generate a brief flight analysis.`;

    // CHANGED: Use OpenAI endpoint instead of Lovable AI gateway
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // CHANGED: Use OpenAI model instead of Gemini
        model: 'gpt-3.5-turbo',  // or 'gpt-4' for better quality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // CHANGED: OpenAI uses 401 for auth errors (not 402)
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key invalid or missing.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Response structure is the same
    const analysis = data.choices?.[0]?.message?.content;
    if (!analysis) {
      console.error('No analysis in response');
      return new Response(
        JSON.stringify({ error: 'Could not generate analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-flight-analysis function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
