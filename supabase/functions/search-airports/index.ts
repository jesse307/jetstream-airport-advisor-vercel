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
    const { query } = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ 
        airports: [],
        message: "Query must be at least 2 characters"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Searching airports for query: ${query}`);

    // Search AviationAPI for airports
    const response = await fetch(`https://api.aviationapi.com/v1/airports?search=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`AviationAPI error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ 
        airports: [],
        error: `API error: ${response.status}`
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Found ${data.length || 0} airports`);

    // Transform the data to match our expected format
    const airports = Array.isArray(data) ? data.map((airport: any) => ({
      code: airport.iata_code || airport.icao_code || airport.ident,
      name: airport.name,
      city: airport.municipality || airport.city,
      state: airport.iso_region ? airport.iso_region.split('-')[1] : '',
      country: airport.iso_country,
      type: airport.type === 'large_airport' ? 'Commercial' : 
            airport.type === 'medium_airport' ? 'Commercial' :
            airport.type === 'small_airport' ? 'Private' : 'Other',
      runwayLength: airport.runway_length_ft || null,
      fbo: airport.services || null,
      latitude: airport.latitude_deg,
      longitude: airport.longitude_deg
    })) : [];

    return new Response(JSON.stringify({ airports }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-airports function:', error);
    return new Response(JSON.stringify({ 
      airports: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});