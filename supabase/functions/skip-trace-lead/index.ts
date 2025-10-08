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

    // Step 1: Search by name to get peo_id
    const fullName = `${firstName} ${lastName}`;
    const searchUrl = `https://skip-tracing-working-api.p.rapidapi.com/search/byname?name=${encodeURIComponent(fullName)}&page=1`;
    
    console.log('Searching for person:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'skip-tracing-working-api.p.rapidapi.com',
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Skip tracing search error:', searchResponse.status, errorText);
      throw new Error(`Skip tracing search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    // Check if we got results
    if (!searchData || !searchData.people || searchData.people.length === 0) {
      console.log('No results found for:', fullName);
      return new Response(JSON.stringify({ 
        error: 'No results found',
        netWorth: null,
        linkedInProfile: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the first result's peo_id
    const peoId = searchData.people[0].peo_id;
    console.log('Found peo_id:', peoId);

    // Step 2: Get detailed information using peo_id
    const detailsUrl = `https://skip-tracing-working-api.p.rapidapi.com/search/detailsbyID?peo_id=${peoId}`;
    
    console.log('Fetching details:', detailsUrl);
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'skip-tracing-working-api.p.rapidapi.com',
      },
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Skip tracing details error:', detailsResponse.status, errorText);
      throw new Error(`Skip tracing details error: ${detailsResponse.status}`);
    }

    const data = await detailsResponse.json();
    console.log('Details response:', JSON.stringify(data, null, 2));

    // Extract relevant information from the response
    const result = {
      netWorth: data.net_worth || data.estimated_net_worth || data.wealth || data.financials?.net_worth || null,
      linkedInProfile: data.linkedin_url || data.linkedin || data.social_profiles?.linkedin || data.social_media?.linkedin || null,
      income: data.income || data.estimated_income || data.financials?.income || null,
      properties: data.properties || data.property_records || data.real_estate || null,
      businesses: data.businesses || data.business_affiliations || data.business_records || null,
      socialProfiles: data.social_profiles || data.social_media || null,
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
