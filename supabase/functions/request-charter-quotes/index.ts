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
    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    
    if (!aviapagesToken) {
      console.error('AVIAPAGES_API_TOKEN not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Aviapages API token not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const requestBody = await req.json();
    console.log('Charter quote request:', JSON.stringify(requestBody, null, 2));

    // Call Aviapages API
    const aviapagesUrl = 'https://dir.aviapages.com/api/charter_quote_requests/';
    console.log('Calling Aviapages API:', aviapagesUrl);

    const response = await fetch(aviapagesUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${aviapagesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Aviapages response status:', response.status);
    console.log('Aviapages response body:', responseText);

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Aviapages API error: ${response.status}`,
        details: responseText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      });
    }

    const data = JSON.parse(responseText);

    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in request-charter-quotes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
