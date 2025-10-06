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
    const { phone } = await req.json();
    
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RapidAPI key not configured');
    }

    console.log('Validating phone:', phone);

    const response = await fetch(`https://veriphone.p.rapidapi.com/verify?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'veriphone.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veriphone API error:', response.status, errorText);
      throw new Error(`Veriphone API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Phone validation result:', data);

    return new Response(
      JSON.stringify({
        success: true,
        isValid: data.phone_valid === true,
        country: data.country || null,
        carrier: data.carrier || null,
        lineType: data.phone_type || null,
        international: data.international_number || null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error validating phone:', error);
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
