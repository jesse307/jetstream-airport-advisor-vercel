import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    if (!rapidApiKey) {
      return new Response(JSON.stringify({ 
        error: 'RAPIDAPI_KEY not configured',
        keyExists: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Testing AeroDataBox API key...');
    console.log('API Key length:', rapidApiKey.length);
    console.log('API Key prefix:', rapidApiKey.substring(0, 8) + '...');

    // Test with a simple airport lookup
    const testResponse = await fetch(
      'https://aerodatabox.p.rapidapi.com/airports/iata/JFK',
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    console.log('API Response status:', testResponse.status);
    console.log('API Response headers:', JSON.stringify([...testResponse.headers.entries()]));

    let responseText = '';
    let responseData = null;
    
    try {
      responseText = await testResponse.text();
      console.log('API Response body:', responseText);
      
      if (testResponse.headers.get('content-type')?.includes('application/json')) {
        responseData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }

    return new Response(JSON.stringify({
      success: testResponse.ok,
      status: testResponse.status,
      statusText: testResponse.statusText,
      keyExists: true,
      keyLength: rapidApiKey.length,
      responseText: responseText.substring(0, 500), // Truncate for safety
      responseData: responseData,
      headers: [...testResponse.headers.entries()]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'fetch_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});