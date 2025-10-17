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
    const { operatorName, searchOnly, listUSCarriers } = await req.json();
    
    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    if (!aviapagesToken) {
      console.error('AVIAPAGES_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Aviapages API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If listing US carriers, use a different endpoint
    if (listUSCarriers) {
      console.log('[list-us-carriers] Fetching US charter operators from Aviapages');
      
      const usCarriersUrl = 'https://dir.aviapages.com/api/companies/?country=US&charter=true&limit=100';
      console.log('US Carriers URL:', usCarriersUrl);

      const carriersResponse = await fetch(usCarriersUrl, {
        headers: {
          'Authorization': `Token ${aviapagesToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (carriersResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit_exceeded', message: 'API rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!carriersResponse.ok) {
        const errorText = await carriersResponse.text();
        console.error(`Aviapages error: ${carriersResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `api_error_${carriersResponse.status}`, details: errorText }),
          { status: carriersResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const carriersData = await carriersResponse.json();
      console.log(`Found ${carriersData.results?.length || 0} US charter operators`);

      return new Response(
        JSON.stringify({ 
          success: true,
          operators: carriersData.results || [],
          totalCount: carriersData.count || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!operatorName || !operatorName.trim()) {
      return new Response(
        JSON.stringify({ error: 'operatorName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[v3-autocomplete] Searching Aviapages for operator: ${operatorName}`);

    // Search for the operator first
    const operatorSearchUrl = `https://dir.aviapages.com/api/companies/?search=${encodeURIComponent(operatorName)}`;
    console.log('Operator search URL:', operatorSearchUrl);

    const operatorResponse = await fetch(operatorSearchUrl, {
      headers: {
        'Authorization': `Token ${aviapagesToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (operatorResponse.status === 429) {
      console.log('Aviapages API rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'rate_limit_exceeded', message: 'API rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!operatorResponse.ok) {
      const errorText = await operatorResponse.text();
      console.error(`Aviapages operator search error: ${operatorResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `api_error_${operatorResponse.status}`, details: errorText }),
        { status: operatorResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const operatorData = await operatorResponse.json();
    console.log('Operator search results:', JSON.stringify(operatorData, null, 2));

    if (!operatorData.results || operatorData.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          operator: null,
          aircraft: [],
          operators: [],
          message: 'No operators found with that name'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If searchOnly mode, return the list of operators for autocomplete
    if (searchOnly) {
      return new Response(
        JSON.stringify({ 
          success: true,
          operators: operatorData.results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first matching operator
    const operator = operatorData.results[0];
    const operatorId = operator.company_id;
    
    console.log(`Found operator: ${operator.name} (ID: ${operatorId})`);

    // Now search for aircraft owned/operated by this company
    const aircraftSearchUrl = `https://dir.aviapages.com/api/aircraft/?operator=${operatorId}`;
    console.log('Aircraft search URL:', aircraftSearchUrl);

    const aircraftResponse = await fetch(aircraftSearchUrl, {
      headers: {
        'Authorization': `Token ${aviapagesToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!aircraftResponse.ok) {
      const errorText = await aircraftResponse.text();
      console.error(`Aviapages aircraft search error: ${aircraftResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `api_error_${aircraftResponse.status}`, details: errorText }),
        { status: aircraftResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aircraftData = await aircraftResponse.json();
    console.log('Aircraft search results:', JSON.stringify(aircraftData, null, 2));

    // Log first aircraft to see field structure
    if (aircraftData.results && aircraftData.results.length > 0) {
      console.log('Sample aircraft data:', JSON.stringify(aircraftData.results[0], null, 2));
    }

    // Filter aircraft to only those that actually belong to this operator
    // The API returns all aircraft regardless of operator param, so we filter by company_id
    const operatorAircraft = (aircraftData.results || []).filter((ac: any) => 
      ac.company_id === operatorId
    );

    console.log(`Filtered to ${operatorAircraft.length} aircraft actually owned by operator ${operatorId}`);

    // Transform the aircraft data using correct Aviapages field names
    const aircraft = operatorAircraft.map((ac: any) => {
      console.log('Processing aircraft:', ac.tail_number);
      
      // Aviapages uses aircraft_type_name for the aircraft type
      const aircraftType = ac.aircraft_type_name;
      
      // Aviapages uses home_base for the home airport ICAO code
      const homeIcao = ac.home_base;
      
      console.log(`  Aircraft type: ${aircraftType || 'NOT FOUND'}`);
      console.log(`  Homebase: ${homeIcao || 'NOT FOUND'}`);
      
      return {
        tailNumber: ac.tail_number || 'Unknown',
        aircraftType: aircraftType || 'Unknown',
        homeAirportIcao: homeIcao || null,
        homeAirportIata: null,
        homeAirportName: null,
        countryCode: null,
        year: ac.year_of_production || null,
        serialNumber: ac.serial_number || null
      };
    });

    console.log(`Found ${aircraft.length} aircraft for operator ${operator.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        operator: {
          id: operator.company_id,
          name: operator.name,
          country: operator.country_name,
          website: operator.website
        },
        aircraft,
        totalCount: aircraftData.count || aircraft.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-operator-aircraft:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
