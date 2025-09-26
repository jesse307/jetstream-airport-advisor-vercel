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
    const { query, calculateFlightTime, departure, arrival, aircraftType } = await req.json();
    
    // Handle flight time calculation requests
    if (calculateFlightTime && departure && arrival && aircraftType) {
      console.log(`Calculating flight time from ${departure} to ${arrival} using ${aircraftType}`);
      
      const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
      if (!aviapagesToken) {
        return new Response(JSON.stringify({ 
          error: "AVIAPAGES_API_TOKEN not configured"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      try {
        // Call aviapages API for flight time calculation
        const aviapagesResponse = await fetch(
          `https://frc.aviapages.com/api/flight_calculator/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${aviapagesToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              departure_airport: departure,
              arrival_airport: arrival,
              aircraft: aircraftType,
              pax: 4,
              airway_time: true
            }),
            signal: AbortSignal.timeout(15000)
          }
        );

        if (aviapagesResponse.ok) {
          const flightTimeData = await aviapagesResponse.json();
          console.log('Aviapages flight time response:', JSON.stringify(flightTimeData, null, 2));
          
          return new Response(JSON.stringify({ 
            success: true,
            departure,
            arrival,
            aircraftType,
            flightTime: flightTimeData
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await aviapagesResponse.text();
          console.log('Aviapages API failed:', aviapagesResponse.status, errorText);
          
          return new Response(JSON.stringify({ 
            success: false,
            error: `Aviapages API returned ${aviapagesResponse.status}: ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.log('Aviapages API error:', error);
        return new Response(JSON.stringify({ 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
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
      // Use AeroDataBox API via RapidAPI
      console.log('Trying AeroDataBox API with query:', query);
      const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
      
      if (!rapidApiKey) {
        console.log('RAPIDAPI_KEY not configured, skipping AeroDataBox API');
      } else {
        const aeroDataBoxResponse = await fetch(
          `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(query)}&limit=20`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(8000)
          }
        );

        if (aeroDataBoxResponse.ok) {
          const aeroDataBoxData = await aeroDataBoxResponse.json();
          console.log('AeroDataBox response received:', JSON.stringify(aeroDataBoxData, null, 2));
          
          if (Array.isArray(aeroDataBoxData) && aeroDataBoxData.length > 0) {
            // Process AeroDataBox results and enhance with runway data from AirportDB.io
            const airportsWithDetails = await Promise.allSettled(
              aeroDataBoxData.slice(0, 15).map(async (airport: any) => {
                const icaoCode = airport.icao || airport.iata;
                let runwayLength = null;
                
                // Try to get accurate runway data from AirportDB.io
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
                      console.log(`Got runway length for ${icaoCode}: ${runwayLength} ft`);
                    }
                  }
                }
                
                return {
                  code: airport.icao || airport.iata || 'N/A',
                  name: airport.fullName || airport.name || 'Unknown Airport',
                  city: airport.municipalityName || airport.city || 'Unknown City',
                  state: airport.regionName || airport.state,
                  country: airport.countryCode || airport.country,
                  type: airport.type === 'AIRPORT' ? 'Commercial' : (airport.type || 'Unknown'),
                  runwayLength,
                  fbo: null,
                  latitude: airport.location?.lat || airport.latitude,
                  longitude: airport.location?.lon || airport.longitude
                };
              })
            );
            
            airports = airportsWithDetails
              .filter(result => result.status === 'fulfilled')
              .map(result => (result as PromiseFulfilledResult<Airport>).value);
              
            console.log('Processed airports from AeroDataBox:', airports.length);
          }
        } else {
          console.log('AeroDataBox API failed:', aeroDataBoxResponse.status, await aeroDataBoxResponse.text());
        }
      }
    } catch (error) {
      console.log('AeroDataBox API error:', error instanceof Error ? error.message : 'Unknown error');
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