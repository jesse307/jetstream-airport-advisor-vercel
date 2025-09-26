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
    
    // Helper function to get detailed airport info from AirportDB.io
    const getAirportDetails = async (icaoCode: string): Promise<any> => {
      const apiToken = Deno.env.get('AIRPORTDB_API_TOKEN');
      if (!apiToken) {
        console.warn('AIRPORTDB_API_TOKEN not configured');
        return null;
      }
      
      try {
        console.log(`Getting detailed info for ${icaoCode} from AirportDB.io`);
        const response = await fetch(`https://airportdb.io/api/v1/airport/${icaoCode}?apiToken=${apiToken}`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`AirportDB.io data for ${icaoCode}:`, JSON.stringify(data, null, 2));
          return data;
        }
      } catch (error) {
        console.log(`Failed to get AirportDB.io data for ${icaoCode}:`, error instanceof Error ? error.message : 'Unknown error');
      }
      return null;
    };
    
    try {
      // First try AviationAPI with original query
      console.log('Trying AviationAPI with query:', query);
      let aviationResponse = await fetch(`https://api.aviationapi.com/v1/airports?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      // If no results and query is 3 letters, try with K prefix (US airports)
      if (!aviationResponse.ok && query.length === 3 && !query.startsWith('K')) {
        console.log('Trying AviationAPI with K prefix:', `K${query}`);
        aviationResponse = await fetch(`https://api.aviationapi.com/v1/airports?search=${encodeURIComponent('K' + query)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
      }
      
      if (aviationResponse.ok) {
        const aviationData = await aviationResponse.json();
        console.log('AviationAPI response received:', aviationData.length || 0, 'airports');
        if (Array.isArray(aviationData) && aviationData.length > 0) {
          // Get detailed runway info for each airport from AirportDB.io
          const airportsWithDetails = await Promise.allSettled(
            aviationData.slice(0, 10).map(async (airport: any) => { // Limit to 10 to avoid rate limits
              const icaoCode = airport.icao_code || airport.ident;
              let runwayLength = airport.runway_length_ft || 8000;
              
              // Try to get more accurate runway data from AirportDB.io
              if (icaoCode) {
                const detailedInfo = await getAirportDetails(icaoCode);
                if (detailedInfo && detailedInfo.runways && detailedInfo.runways.length > 0) {
                  // Find the longest runway
                  const longestRunway = detailedInfo.runways.reduce((longest: any, runway: any) => {
                    const length = runway.length_ft || 0;
                    return length > (longest.length_ft || 0) ? runway : longest;
                  }, detailedInfo.runways[0]);
                  
                  if (longestRunway.length_ft) {
                    runwayLength = longestRunway.length_ft;
                    console.log(`Updated runway length for ${icaoCode}: ${runwayLength} ft`);
                  }
                }
              }
              
              return {
                code: airport.iata_code || airport.icao_code || airport.ident,
                name: airport.name,
                city: airport.municipality || airport.city,
                state: airport.iso_region ? airport.iso_region.split('-')[1] : '',
                country: airport.iso_country,
                type: airport.type === 'large_airport' ? 'Commercial' : 
                      airport.type === 'medium_airport' ? 'Commercial' :
                      airport.type === 'small_airport' ? 'Private' : 'Other',
                runwayLength,
                fbo: airport.services || null,
                latitude: airport.latitude_deg,
                longitude: airport.longitude_deg
              };
            })
          );
          
          airports = airportsWithDetails
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<Airport>).value);
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
        { code: 'KVNY', name: 'Van Nuys Airport', city: 'Van Nuys', state: 'CA', country: 'US', type: 'Private', runwayLength: 8001 },
        { code: 'KSMO', name: 'Santa Monica Airport', city: 'Santa Monica', state: 'CA', country: 'US', type: 'Private', runwayLength: 4973 },
        { code: 'KBUR', name: 'Hollywood Burbank Airport', city: 'Burbank', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 6886 },
        { code: 'KHPN', name: 'Westchester County Airport', city: 'White Plains', state: 'NY', country: 'US', type: 'Private', runwayLength: 6549 },
        { code: 'KPDK', name: 'DeKalb-Peachtree Airport', city: 'Atlanta', state: 'GA', country: 'US', type: 'Private', runwayLength: 6001 }
      ];
      
      const searchTerm = query.toLowerCase();
      airports = fallbackAirports.filter(airport => {
        const code = airport.code.toLowerCase();
        const name = airport.name.toLowerCase();
        const city = airport.city.toLowerCase();
        
        // Handle different search patterns
        return (
          code.includes(searchTerm) ||
          code.replace('k', '').includes(searchTerm) || // Handle ICAO vs IATA (KVNY vs VNY)
          name.includes(searchTerm) ||
          city.includes(searchTerm) ||
          (searchTerm.length === 3 && code.endsWith(searchTerm)) // Handle 3-letter codes
        );
      });
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