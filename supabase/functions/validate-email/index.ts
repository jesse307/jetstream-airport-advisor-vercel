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
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RapidAPI key not configured');
    }

    console.log('Validating email:', email);

    const response = await fetch(`https://email-validator-api.p.rapidapi.com/verify?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'email-validator-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email validation API error:', response.status, errorText);
      throw new Error(`Email validation API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Email validation result:', data);

    return new Response(
      JSON.stringify({
        success: true,
        isValid: data.is_valid === true || data.valid === true,
        status: data.status || null,
        reason: data.reason || data.message || null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error validating email:', error);
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
