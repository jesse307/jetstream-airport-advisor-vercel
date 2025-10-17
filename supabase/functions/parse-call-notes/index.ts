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
    const { notes } = await req.json();

    if (!notes || typeof notes !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Notes text is required' }),
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

    console.log('Parsing call notes with AI...');

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
            content: `You are a lead data extraction assistant for a private charter flight company. Extract structured lead information from call notes. Be smart about inferring missing information when possible (e.g., if they mention "tomorrow at 3pm", calculate the actual date).

Return ONLY valid JSON with this exact structure:
{
  "firstName": "string or null",
  "lastName": "string or null", 
  "email": "string or null",
  "phone": "string or null",
  "tripType": "One Way" or "Round Trip" or null,
  "departureAirport": "3-4 letter airport code or null",
  "arrivalAirport": "3-4 letter airport code or null",
  "departureDate": "YYYY-MM-DD or null",
  "departureTime": "HH:MM (24-hour format) or null",
  "returnDate": "YYYY-MM-DD or null",
  "returnTime": "HH:MM (24-hour format) or null",
  "passengers": number or null,
  "notes": "any additional relevant information or null"
}

Rules:
- Extract airport codes (ICAO or IATA) when mentioned
- If city names are mentioned, convert to airport codes (e.g., "Los Angeles" → "LAX", "New York" → "JFK")
- Phone numbers should be in E.164 format when possible
- Date should be YYYY-MM-DD format
- Time should be 24-hour HH:MM format
- If trip type isn't clear, set to null
- Put any unstructured info in the notes field
- Return null for any field you cannot extract`
          },
          {
            role: 'user',
            content: notes
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_lead_data',
              description: 'Extract structured lead data from call notes',
              parameters: {
                type: 'object',
                properties: {
                  firstName: { type: ['string', 'null'] },
                  lastName: { type: ['string', 'null'] },
                  email: { type: ['string', 'null'] },
                  phone: { type: ['string', 'null'] },
                  tripType: { type: ['string', 'null'], enum: ['One Way', 'Round Trip', null] },
                  departureAirport: { type: ['string', 'null'] },
                  arrivalAirport: { type: ['string', 'null'] },
                  departureDate: { type: ['string', 'null'] },
                  departureTime: { type: ['string', 'null'] },
                  returnDate: { type: ['string', 'null'] },
                  returnTime: { type: ['string', 'null'] },
                  passengers: { type: ['integer', 'null'] },
                  notes: { type: ['string', 'null'] }
                },
                required: [],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_lead_data' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process notes with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No tool call found in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to extract data from notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: extractedData
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in parse-call-notes:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
