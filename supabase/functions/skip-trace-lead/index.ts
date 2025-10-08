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
    const { firstName, lastName, email, phone } = await req.json();
    
    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    console.log('Skip tracing for:', firstName, lastName, email, phone);

    // Call the skip tracing API
    // Note: This is a general implementation - may need adjustment based on actual API endpoints
    const searchParams = new URLSearchParams();
    searchParams.append('first_name', firstName);
    searchParams.append('last_name', lastName);
    if (email) searchParams.append('email', email);
    if (phone) searchParams.append('phone', phone);

    const response = await fetch(`https://skip-tracing-working-api.p.rapidapi.com/api/person?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'skip-tracing-working-api.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Skip tracing API error:', response.status, errorText);
      throw new Error(`Skip tracing API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Skip tracing response:', JSON.stringify(data, null, 2));

    // Extract relevant information
    const result = {
      netWorth: data.net_worth || data.estimated_net_worth || data.wealth || null,
      linkedInProfile: data.linkedin_url || data.linkedin || data.social_profiles?.linkedin || null,
      income: data.income || data.estimated_income || null,
      properties: data.properties || data.property_records || null,
      businesses: data.businesses || data.business_affiliations || null,
      socialProfiles: data.social_profiles || null,
      rawData: data, // Include full response for debugging
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in skip-trace-lead function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        netWorth: null,
        linkedInProfile: null,
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
