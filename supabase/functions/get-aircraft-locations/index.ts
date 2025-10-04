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
    const { tailNumbers } = await req.json();
    
    if (!tailNumbers || !Array.isArray(tailNumbers)) {
      return new Response(
        JSON.stringify({ error: 'tailNumbers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('AERODATABOX_API_KEY');
    if (!apiKey) {
      console.error('AERODATABOX_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching locations for ${tailNumbers.length} aircraft`);

    // Fetch location data for each tail number (limit to avoid rate limits)
    const locationPromises = tailNumbers.slice(0, 50).map(async (tailNumber: string) => {
      try {
        // Clean tail number (remove spaces, hyphens)
        const cleanTail = tailNumber.replace(/[-\s]/g, '').toUpperCase();
        
        const url = `https://aerodatabox.p.rapidapi.com/aircrafts/reg/${cleanTail}`;
        console.log(`Fetching aircraft data for: ${cleanTail}`);
        
        const response = await fetch(url, {
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'aerodatabox.p.rapidapi.com'
          }
        });

        if (response.status === 404) {
          console.log(`Aircraft not found: ${cleanTail}`);
          return { tailNumber, location: null, error: 'not_found' };
        }

        if (!response.ok) {
          console.error(`AeroDataBox error for ${cleanTail}: ${response.status}`);
          return { tailNumber, location: null, error: `api_error_${response.status}` };
        }

        const data = await response.json();
        
        // Extract home base information
        const homeBase = data.homeBase || data.airportIcao || data.airportIata;
        
        return {
          tailNumber,
          location: homeBase ? {
            icao: data.airportIcao || homeBase,
            iata: data.airportIata || null,
            name: data.homeBase || null
          } : null,
          country: data.countryCode || null,
          operator: data.operatorName || null
        };
      } catch (error) {
        console.error(`Error fetching ${tailNumber}:`, error.message);
        return { tailNumber, location: null, error: 'fetch_error' };
      }
    });

    const locations = await Promise.all(locationPromises);
    
    const successCount = locations.filter(l => l.location).length;
    console.log(`Successfully fetched ${successCount}/${tailNumbers.length} aircraft locations`);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: locations,
        stats: {
          total: tailNumbers.length,
          fetched: successCount,
          notFound: locations.filter(l => l.error === 'not_found').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-aircraft-locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
