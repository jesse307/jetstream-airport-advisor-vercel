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
    const { operatorName } = await req.json();
    
    if (!operatorName || !operatorName.trim()) {
      return new Response(
        JSON.stringify({ error: 'operatorName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    if (!aviapagesToken) {
      console.error('AVIAPAGES_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Aviapages API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Aviapages for operator: ${operatorName}`);

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
          message: 'No operators found with that name'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first matching operator
    const operator = operatorData.results[0];
    const operatorId = operator.id;
    
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

    // Transform the aircraft data - try multiple field name variations
    const aircraft = (aircraftData.results || []).map((ac: any) => {
      console.log('Processing aircraft:', ac.registration || ac.tail_number);
      
      // Try various field names for aircraft type
      const aircraftType = ac.aircraft_type || ac.type || ac.model || 
                          ac.aircraftType || ac.ac_type || ac.make_model ||
                          (ac.make && ac.model ? `${ac.make} ${ac.model}` : null);
      
      // Try various field names for homebase
      const homeIcao = ac.home_airport_icao || ac.homebase_icao || 
                       ac.home_base_icao || ac.base_icao || 
                       ac.home_airport?.icao || ac.homebase?.icao;
      
      const homeIata = ac.home_airport_iata || ac.homebase_iata || 
                       ac.home_base_iata || ac.base_iata ||
                       ac.home_airport?.iata || ac.homebase?.iata;
      
      const homeName = ac.home_airport_name || ac.homebase_name || 
                       ac.home_base_name || ac.base_name ||
                       ac.home_airport?.name || ac.homebase?.name || 
                       ac.home_airport || ac.homebase;
      
      console.log(`  Aircraft type: ${aircraftType || 'NOT FOUND'}`);
      console.log(`  Homebase: ${homeIcao || homeIata || homeName || 'NOT FOUND'}`);
      
      return {
        tailNumber: ac.registration || ac.tail_number || 'Unknown',
        aircraftType: aircraftType || 'Unknown',
        homeAirportIcao: homeIcao || null,
        homeAirportIata: homeIata || null,
        homeAirportName: homeName || null,
        countryCode: ac.country_code || ac.country || null,
        year: ac.year || ac.year_built || ac.year_manufactured || null,
        serialNumber: ac.serial_number || ac.serial || ac.msn || null
      };
    });

    console.log(`Found ${aircraft.length} aircraft for operator ${operator.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        operator: {
          id: operator.id,
          name: operator.name,
          country: operator.country,
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
