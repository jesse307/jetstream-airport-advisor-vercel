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

    const { tailNumber, webhookUrl } = await req.json();
    
    if (!tailNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tail number is required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('Using API token:', aviapagesToken.substring(0, 10) + '...');
    console.log('Fetching aircraft data for tail number:', tailNumber);

    // Call Aviapages API - using search parameter instead of path parameter
    const aviapagesUrl = `https://dir.aviapages.com/api/charter_aircraft/?search=${encodeURIComponent(tailNumber)}`;
    console.log('Calling Aviapages API:', aviapagesUrl);

    const response = await fetch(aviapagesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${aviapagesToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('Aviapages response status:', response.status);
    console.log('Aviapages response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log('Aviapages response body:', responseText);

    if (!response.ok) {
      console.error('Aviapages API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: `Aviapages API returned ${response.status}: ${response.statusText}`,
        details: responseText,
        tailNumber: tailNumber,
        url: aviapagesUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      });
    }

    const data = JSON.parse(responseText);
    console.log('Successfully fetched aircraft data');

    // If webhook URL provided, send data to n8n
    if (webhookUrl) {
      try {
        console.log('Sending data to webhook:', webhookUrl);
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        console.log('Webhook response status:', webhookResponse.status);
        if (!webhookResponse.ok) {
          console.error('Webhook error:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the main request if webhook fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-aviapages-aircraft:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
