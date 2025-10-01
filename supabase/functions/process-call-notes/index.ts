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
    const { messages, leadData } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing call notes with AI');

    const systemPrompt = `You are an AI assistant helping a charter flight sales representative take notes during a phone call.

Current lead information:
- Name: ${leadData.firstName} ${leadData.lastName}
- Email: ${leadData.email}
- Phone: ${leadData.phone}
- Trip Type: ${leadData.tripType}
- Departure: ${leadData.departureAirport}
- Arrival: ${leadData.arrivalAirport}
- Departure Date: ${leadData.departureDate}
- Passengers: ${leadData.passengers}

Your job is to:
1. Help the rep take notes during the call
2. Extract any changes to the itinerary (airports, dates, passenger count, etc.)
3. Be conversational and helpful
4. Keep responses concise and relevant

If the caller mentions changes to airports, dates, or other booking details, acknowledge them clearly.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_itinerary_changes',
              description: 'Extract any changes to the flight itinerary from the conversation',
              parameters: {
                type: 'object',
                properties: {
                  departureAirport: { type: 'string', description: 'New departure airport code' },
                  arrivalAirport: { type: 'string', description: 'New arrival airport code' },
                  departureDate: { type: 'string', description: 'New departure date' },
                  departureTime: { type: 'string', description: 'New departure time' },
                  returnDate: { type: 'string', description: 'New return date' },
                  returnTime: { type: 'string', description: 'New return time' },
                  passengers: { type: 'number', description: 'New passenger count' },
                  notes: { type: 'string', description: 'Any additional notes' }
                }
              }
            }
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    const message = data.choices[0].message;
    const toolCalls = message.tool_calls;

    let extractedChanges = null;
    if (toolCalls && toolCalls.length > 0) {
      const tool = toolCalls[0];
      if (tool.function.name === 'extract_itinerary_changes') {
        extractedChanges = JSON.parse(tool.function.arguments);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: message.content,
        changes: extractedChanges
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing call notes:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
