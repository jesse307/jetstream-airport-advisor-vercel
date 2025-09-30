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
    const { unstructuredData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing lead data with AI...');

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
            content: 'You are a data extraction assistant. Extract CLIENT/CUSTOMER lead information from unstructured text. The data may contain both rep/owner information and client information - always extract the CLIENT information (usually found under "Name", "Company Name", or similar fields), NOT the rep/owner information at the top.'
          },
          {
            role: 'user',
            content: `Extract CLIENT lead information from the following text. Look for the client/customer name (often under "Name" or "Company" fields), not the rep/owner name:\n\n${unstructuredData}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_lead_data',
              description: 'Extract structured lead data from unstructured text',
              parameters: {
                type: 'object',
                properties: {
                  first_name: { type: 'string', description: 'First name of the CLIENT/CUSTOMER (not the rep or owner)' },
                  last_name: { type: 'string', description: 'Last name of the CLIENT/CUSTOMER (not the rep or owner)' },
                  email: { type: 'string', description: 'Email address' },
                  phone: { type: 'string', description: 'Phone number' },
                  trip_type: { 
                    type: 'string', 
                    enum: ['one-way', 'round-trip'],
                    description: 'Type of trip'
                  },
                  departure_airport: { type: 'string', description: 'Departure airport code or name' },
                  arrival_airport: { type: 'string', description: 'Arrival airport code or name' },
                  departure_date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
                  departure_time: { type: 'string', description: 'Departure time in AM/PM format (e.g., 10:00 AM)' },
                  return_date: { type: 'string', description: 'Return date in YYYY-MM-DD format (for round trips)' },
                  return_time: { type: 'string', description: 'Return time in AM/PM format (e.g., 3:00 PM, for round trips)' },
                  passengers: { type: 'number', description: 'Number of passengers' },
                  notes: { type: 'string', description: 'Additional notes or comments' }
                },
                required: ['first_name', 'last_name', 'email', 'trip_type', 'departure_airport', 'arrival_airport', 'departure_date', 'passengers'],
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
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const parsedData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed lead data:', parsedData);

    // Enrich airport data with codes and cities from aviapages
    const AVIAPAGES_API_TOKEN = Deno.env.get('AVIAPAGES_API_TOKEN');
    
    if (AVIAPAGES_API_TOKEN && (parsedData.departure_airport || parsedData.arrival_airport)) {
      console.log('Enriching airport data...');
      
      try {
        // Search for departure airport
        if (parsedData.departure_airport) {
          const depSearchUrl = `https://dir.aviapages.com/api/airports/?search=${encodeURIComponent(parsedData.departure_airport)}`;
          const depResponse = await fetch(depSearchUrl, {
            headers: {
              'Authorization': `Token ${AVIAPAGES_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (depResponse.ok) {
            const depData = await depResponse.json();
            const depResults = depData.results || depData.airports || depData;
            if (Array.isArray(depResults) && depResults.length > 0) {
              const airport = depResults[0];
              const code = airport.iata || airport.icao || airport.lid;
              const city = airport.city?.name || airport.municipality || airport.city;
              if (code && city) {
                parsedData.departure_airport = `${code} (${city})`;
                console.log('Enriched departure airport:', parsedData.departure_airport);
              }
            }
          }
        }
        
        // Search for arrival airport
        if (parsedData.arrival_airport) {
          const arrSearchUrl = `https://dir.aviapages.com/api/airports/?search=${encodeURIComponent(parsedData.arrival_airport)}`;
          const arrResponse = await fetch(arrSearchUrl, {
            headers: {
              'Authorization': `Token ${AVIAPAGES_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (arrResponse.ok) {
            const arrData = await arrResponse.json();
            const arrResults = arrData.results || arrData.airports || arrData;
            if (Array.isArray(arrResults) && arrResults.length > 0) {
              const airport = arrResults[0];
              const code = airport.iata || airport.icao || airport.lid;
              const city = airport.city?.name || airport.municipality || airport.city;
              if (code && city) {
                parsedData.arrival_airport = `${code} (${city})`;
                console.log('Enriched arrival airport:', parsedData.arrival_airport);
              }
            }
          }
        }
      } catch (error) {
        console.log('Failed to enrich airport data:', error);
        // Continue with original airport names if enrichment fails
      }
    }

    return new Response(
      JSON.stringify({ parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing lead data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});