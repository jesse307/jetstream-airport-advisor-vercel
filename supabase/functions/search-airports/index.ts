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

    // Try multiple airport APIs as fallback
    interface Airport {
      code: string;
      name: string;
      city: string;
      state?: string;
      country?: string;
      type: string;
      runwayLength?: number | null;
      fbo?: string[] | string | null;
      latitude?: number;
      longitude?: number;
    }
    
    let airports: Airport[] = [];
    
    try {
      // First try AviationAPI
      console.log('Trying AviationAPI...');
      const aviationResponse = await fetch(`https://api.aviationapi.com/v1/airports?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (aviationResponse.ok) {
        const aviationData = await aviationResponse.json();
        console.log('AviationAPI response received:', aviationData.length || 0, 'airports');
        if (Array.isArray(aviationData) && aviationData.length > 0) {
          airports = aviationData.map((airport: any) => ({
            code: airport.iata_code || airport.icao_code || airport.ident,
            name: airport.name,
            city: airport.municipality || airport.city,
            state: airport.iso_region ? airport.iso_region.split('-')[1] : '',
            country: airport.iso_country,
            type: airport.type === 'large_airport' ? 'Commercial' : 
                  airport.type === 'medium_airport' ? 'Commercial' :
                  airport.type === 'small_airport' ? 'Private' : 'Other',
            runwayLength: airport.runway_length_ft || 8000, // Use API runway length or default to 8000
            fbo: airport.services || null,
            latitude: airport.latitude_deg,
            longitude: airport.longitude_deg
          }));
        }
      }
    } catch (error) {
      console.log('AviationAPI failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // If no results, use a simple hardcoded search as fallback
    if (airports.length === 0) {
      console.log('Using fallback airport database...');
      const fallbackAirports = [
        { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 14511 },
        { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 12923 },
        { code: 'KORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', state: 'IL', country: 'US', type: 'Commercial', runwayLength: 13000 },
        { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', state: 'NV', country: 'US', type: 'Commercial', runwayLength: 14514 },
        { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 13016 },
        { code: 'KEWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', country: 'US', type: 'Commercial', runwayLength: 11000 },
        { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 11870 },
        { code: 'KBOS', name: 'Boston Logan International Airport', city: 'Boston', state: 'MA', country: 'US', type: 'Commercial', runwayLength: 10083 },
        { code: 'KTEB', name: 'Teterboro Airport', city: 'Teterboro', state: 'NJ', country: 'US', type: 'Private', runwayLength: 7000 },
        { code: 'KVAN', name: 'Van Nuys Airport', city: 'Van Nuys', state: 'CA', country: 'US', type: 'Private', runwayLength: 8001 }
      ];
      
      const searchTerm = query.toLowerCase();
      airports = fallbackAirports.filter(airport => 
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.name.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm)
      );
    }
    console.log(`Found ${airports.length} airports`);

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