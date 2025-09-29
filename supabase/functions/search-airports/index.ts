import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Aircraft name mapping for aviapages API
function mapAircraftName(aircraftType: string): string {
  console.log('Original aircraft type received:', aircraftType);
  
  // Handle the format "Category-Model" that comes from the frontend
  if (aircraftType.includes('-')) {
    const parts = aircraftType.split('-');
    if (parts.length >= 2) {
      const modelName = parts.slice(1).join('-'); // Everything after the first dash
      console.log('Extracted model name:', modelName);
      return modelName;
    }
  }
  
  // Fallback mappings for category names
  const mappings: { [key: string]: string } = {
    'Light Jet': 'Citation CJ3',
    'Mid Jet': 'Citation XLS+',
    'Super Mid Jet': 'Challenger 350',
    'Heavy Jet': 'Gulfstream G550',
    'Ultra Long Range': 'Global 7500',
    'Turboprop': 'King Air 350',
  };
  
  const mapped = mappings[aircraftType] || aircraftType;
  console.log('Final mapped aircraft name:', mapped);
  return mapped;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculateFlightTime, departure, arrival, aircraftType, passengers, query } = await req.json();

    // If this is a flight time calculation request
    if (calculateFlightTime) {
      console.log('=== AVIAPAGES FLIGHT TIME CALCULATION ===');
      console.log('Flight time calculation requested');
      console.log('Departure:', departure);
      console.log('Arrival:', arrival);
      console.log('Aircraft Type:', aircraftType);
      console.log('Passengers:', passengers);
      
      const aviapagesApiToken = Deno.env.get('AVIAPAGES_API_TOKEN');
      console.log('AVIAPAGES_API_TOKEN configured:', !!aviapagesApiToken);
      console.log('AVIAPAGES_API_TOKEN length:', aviapagesApiToken?.length || 0);
      
      if (!aviapagesApiToken) {
        console.log('ERROR: AVIAPAGES_API_TOKEN not configured');
        return new Response(JSON.stringify({
          success: false,
          error: 'Aviapages API token not configured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const mappedAircraftName = mapAircraftName(aircraftType);
        console.log(`Mapped aircraft: ${aircraftType} -> ${mappedAircraftName}`);
        console.log(`Making API call to aviapages with: ${departure} to ${arrival}, aircraft: ${mappedAircraftName}, passengers: ${passengers}`);

        const requestBody = {
          departure_airport: departure,
          arrival_airport: arrival,
          aircraft: mappedAircraftName,
          pax: passengers || 2,
          great_circle_time: true,
          great_circle_distance: true,
          airway_time: true
        };
        console.log('Request body:', JSON.stringify(requestBody));

        const aviapagesResponse = await fetch('https://frc.aviapages.com/api/flight_calculator/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${aviapagesApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(15000)
        });

        console.log('Aviapages response status:', aviapagesResponse.status);
        console.log('Aviapages response headers:', JSON.stringify([...aviapagesResponse.headers.entries()]));

        if (aviapagesResponse.ok) {
          const flightData = await aviapagesResponse.json();
          console.log('Aviapages API SUCCESS - response length:', JSON.stringify(flightData).length);
          console.log('Aviapages API response preview:', JSON.stringify(flightData).substring(0, 500));
          
          return new Response(JSON.stringify({
            success: true,
            flightTime: flightData
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await aviapagesResponse.text();
          console.log('Aviapages API FAILED - Status:', aviapagesResponse.status);
          console.log('Aviapages API FAILED - Error body:', errorText);
          return new Response(JSON.stringify({
            success: false,
            error: `Aviapages API error: ${aviapagesResponse.status} - ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Aviapages API EXCEPTION:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error type');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to calculate flight time: ${error instanceof Error ? error.message : 'Unknown error'}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Airport search functionality
    if (!query) {
      return new Response(JSON.stringify({ airports: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== AIRPORT SEARCH DEBUG ===');
    console.log('Query:', query);
    console.log('Query length:', query.length);
    console.log('Query type:', typeof query);

    // For queries shorter than 3 characters, skip API calls and go directly to fallback
    if (query.length < 3) {
      console.log('Query too short for API calls, using fallback database only');
    }

    let airports: any[] = [];

    // Check environment variables
    const aviationEdgeKey = Deno.env.get('AVIATION_EDGE_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const airportDbToken = Deno.env.get('AIRPORTDB_API_TOKEN');
    
    console.log('AVIATION_EDGE_API_KEY configured:', !!aviationEdgeKey);
    console.log('RAPIDAPI_KEY configured:', !!rapidApiKey);
    console.log('AIRPORTDB_API_TOKEN configured:', !!airportDbToken);
    if (rapidApiKey) {
      console.log('RAPIDAPI_KEY length:', rapidApiKey.length);
      console.log('RAPIDAPI_KEY preview:', rapidApiKey.substring(0, 10) + '...');
    }

    // Try AirportDB.io first (if configured)
    if (airportDbToken && query.length >= 3) {
      console.log('Trying AirportDB.io API...');
      try {
        // Try exact ICAO code lookup for 4-character codes
        if (query.length === 4) {
          console.log('Trying ICAO lookup for:', query.toUpperCase());
          const icaoResponse = await fetch(`https://airportdb.io/api/v1/airport/${query.toUpperCase()}?apiToken=${airportDbToken}`, {
            signal: AbortSignal.timeout(8000)
          });
          
          console.log('AirportDB.io ICAO response status:', icaoResponse.status);
          
          if (icaoResponse.ok) {
            const airport = await icaoResponse.json();
            console.log('AirportDB.io airport data:', JSON.stringify(airport, null, 2));
            
            if (airport && airport.icao_code) {
              const runwayLength = airport.runways && airport.runways.length > 0 
                ? Math.max(...airport.runways.map((r: any) => parseInt(r.length_ft) || 0))
                : 0;
                
              airports.push({
                code: airport.iata_code || airport.icao_code,
                icao_code: airport.icao_code,
                name: airport.name,
                city: airport.municipality || '',
                state: airport.iso_region?.split('-')[1] || '',
                country: airport.iso_country,
                latitude: parseFloat(airport.latitude_deg) || null,
                longitude: parseFloat(airport.longitude_deg) || null,
                elevation: airport.elevation_ft ? parseInt(airport.elevation_ft) : null,
                runwayLength: runwayLength,
                type: airport.type || 'airport',
                source: 'AirportDB.io'
              });
              console.log('AirportDB.io found airport:', airports[airports.length - 1]);
            }
          }
        }
        
        // Try IATA code lookup for 3-character codes
        if (airports.length === 0 && query.length === 3) {
          console.log('Trying to search for IATA code via ICAO in AirportDB.io');
          // AirportDB.io doesn't have direct IATA search, so we'll fall back to other APIs
        }
      } catch (error) {
        console.log('AirportDB.io error:', error instanceof Error ? error.message : 'Unknown');
      }
    }

    // Try Aviation Edge if AirportDB.io didn't find anything (if configured and query is long enough)
    if (airports.length === 0 && aviationEdgeKey && query.length >= 3) {
      console.log('Trying Aviation Edge API...');
      try {
        const response = await fetch(
          `https://aviation-edge.com/v2/public/airportDatabase?key=${aviationEdgeKey}&codeIataAirport=${query}`,
          { signal: AbortSignal.timeout(8000) }
        );

        console.log('Aviation Edge response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Aviation Edge data type:', Array.isArray(data) ? 'array' : typeof data);
          console.log('Aviation Edge data length:', Array.isArray(data) ? data.length : 'not array');
          
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((airport: any) => {
              airports.push({
                code: airport.codeIataAirport || airport.codeIcaoAirport || 'N/A',
                name: airport.nameAirport || 'Unknown',
                city: airport.nameCountry || 'Unknown',
                state: airport.codeIso2Country || 'N/A',
                country: airport.nameCountry || 'Unknown',
                type: 'Commercial',
                runwayLength: 0,
                source: 'Aviation Edge'
              });
            });
            console.log('Aviation Edge found', airports.length, 'airports');
          }
        } else {
          console.log('Aviation Edge failed with status:', response.status);
        }
      } catch (error) {
        console.log('Aviation Edge error:', error instanceof Error ? error.message : 'Unknown');
      }
    }

    // Try AeroDataBox if Aviation Edge didn't work and query is long enough
    if (airports.length === 0 && rapidApiKey && query.length >= 3) {
      console.log('Trying AeroDataBox API...');
      
      try {
        let aeroResponse: Response | undefined;
        
        // Try different endpoint strategies
        if (query.length === 3 || query.length === 4) {
          console.log('Trying IATA lookup for:', query.toUpperCase());
          
          const iataUrl = `https://aerodatabox.p.rapidapi.com/airports/iata/${query.toUpperCase()}`;
          console.log('IATA URL:', iataUrl);
          
          aeroResponse = await fetch(iataUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          console.log('IATA response status:', aeroResponse.status);
          console.log('IATA response headers:', JSON.stringify([...aeroResponse.headers.entries()]));
          
          if (!aeroResponse.ok || aeroResponse.status === 204) {
            // Handle 204 (No Content) and other errors gracefully
            let errorText = 'No content returned';
            try {
              if (aeroResponse.status !== 204) {
                errorText = await aeroResponse.text();
              }
            } catch (textError) {
              console.log('Could not read error text:', textError);
              errorText = `Status ${aeroResponse.status} - Could not read response`;
            }
            
            console.log('IATA failed - Status:', aeroResponse.status, 'Body:', errorText);
            
            // Try ICAO if it's 4 characters
            if (query.length === 4) {
              console.log('Trying ICAO lookup for:', query.toUpperCase());
              
              const icaoUrl = `https://aerodatabox.p.rapidapi.com/airports/icao/${query.toUpperCase()}`;
              console.log('ICAO URL:', icaoUrl);
              
              aeroResponse = await fetch(icaoUrl, {
                method: 'GET',
                headers: {
                  'X-RapidAPI-Key': rapidApiKey,
                  'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
                  'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
              });
              
              console.log('ICAO response status:', aeroResponse.status);
              
              if (!aeroResponse.ok) {
                const icaoErrorText = await aeroResponse.text();
                console.log('ICAO failed - Status:', aeroResponse.status, 'Body:', icaoErrorText);
              }
            }
          }
          
          // Try search endpoint as fallback
          if (!aeroResponse.ok) {
            console.log('Direct lookups failed, trying search endpoint');
            
            const searchUrl = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(query)}&limit=10`;
            console.log('Search URL:', searchUrl);
            
            aeroResponse = await fetch(searchUrl, {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
                'Accept': 'application/json'
              },
              signal: AbortSignal.timeout(10000)
            });
            
            console.log('Search response status:', aeroResponse.status);
          }
        } else {
          // For longer queries, use search directly
          const searchUrl = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(query)}&limit=10`;
          console.log('Direct search URL:', searchUrl);
          
          aeroResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          console.log('Direct search response status:', aeroResponse.status);
        }
        
        // Process successful response
        if (aeroResponse && aeroResponse.ok) {
          let aeroData;
          try {
            aeroData = await aeroResponse.json();
          } catch (jsonError) {
            console.log('Failed to parse JSON response:', jsonError);
            // Skip processing if JSON parsing fails
            aeroData = null;
          }
          
          if (aeroData) {
            console.log('AeroDataBox response type:', Array.isArray(aeroData) ? 'array' : typeof aeroData);
            console.log('AeroDataBox FULL response:', JSON.stringify(aeroData, null, 2));
          
          // Function to get runway data for an airport
          const getRunwayData = async (airportCode: string): Promise<number> => {
            try {
              const runwayResponse = await fetch(
                `https://aerodatabox.p.rapidapi.com/airports/iata/${airportCode}/runways`,
                {
                  method: 'GET',
                  headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
                    'Accept': 'application/json'
                  },
                  signal: AbortSignal.timeout(5000)
                }
              );
              
              if (runwayResponse.ok) {
                const runwayData = await runwayResponse.json();
                console.log('Runway data for', airportCode, ':', JSON.stringify(runwayData));
                
                // Find the longest runway
                if (Array.isArray(runwayData) && runwayData.length > 0) {
                  const longestRunway = runwayData.reduce((max, runway) => {
                    const length = runway.length?.meter || runway.lengthMeter || runway.length || 0;
                    return length > max ? length : max;
                  }, 0);
                  
                  // Convert from meters to feet if needed
                  return Math.round(longestRunway * 3.28084);
                }
              }
            } catch (error) {
              console.log('Error fetching runway data for', airportCode, ':', error);
            }
            return 0;
          };
          
          // Handle different response formats
          if (Array.isArray(aeroData)) {
            console.log('Processing array response with', aeroData.length, 'items');
            for (const airport of aeroData) {
              console.log('Processing airport:', JSON.stringify(airport, null, 2));
              const airportCode = airport.iata || airport.icao;
              const runwayLength = airportCode ? await getRunwayData(airportCode) : 0;
              
              airports.push({
                code: airport.iata || airport.icao || 'N/A',
                name: airport.fullName || airport.shortName || airport.name || 'Unknown',
                city: airport.municipalityName || airport.city || 'Unknown',
                state: airport.country?.code || airport.regionName || 'N/A',
                country: airport.country?.name || airport.countryName || 'Unknown',
                type: 'Commercial',
                runwayLength: runwayLength,
                latitude: airport.location?.lat || null,
                longitude: airport.location?.lon || null,
                source: 'AeroDataBox'
              });
            }
          } else if (aeroData && typeof aeroData === 'object') {
            console.log('Processing single object response:', JSON.stringify(aeroData, null, 2));
            
            // Check if this is a search response with items array
            if (aeroData.items && Array.isArray(aeroData.items)) {
              console.log('Found items array with', aeroData.items.length, 'airports');
              for (const airport of aeroData.items) {
                console.log('Processing airport from items:', JSON.stringify(airport, null, 2));
                const airportCode = airport.iata || airport.icao;
                const runwayLength = airportCode ? await getRunwayData(airportCode) : 0;
                
                airports.push({
                  code: airport.iata || airport.icao || 'N/A',
                  name: airport.name || airport.shortName || airport.fullName || 'Unknown',
                  city: airport.municipalityName || airport.city || 'Unknown',
                  state: airport.countryCode || airport.regionName || 'N/A',
                  country: airport.countryCode || airport.countryName || 'Unknown',
                  type: 'Commercial',
                  runwayLength: runwayLength,
                  latitude: airport.location?.lat || null,
                  longitude: airport.location?.lon || null,
                  source: 'AeroDataBox'
                });
              }
            } else {
              // Single airport response
              const airportCode = aeroData.iata || aeroData.icao;
              const runwayLength = airportCode ? await getRunwayData(airportCode) : 0;
              
              airports.push({
                code: aeroData.iata || aeroData.icao || 'N/A',
                name: aeroData.fullName || aeroData.shortName || aeroData.name || 'Unknown',
                city: aeroData.municipalityName || aeroData.city || 'Unknown',
                state: aeroData.country?.code || aeroData.regionName || 'N/A',
                country: aeroData.country?.name || aeroData.countryName || 'Unknown',
                type: 'Commercial',
                runwayLength: runwayLength,
                latitude: aeroData.location?.lat || null,
                longitude: aeroData.location?.lon || null,
                source: 'AeroDataBox'
              });
            }
          }
          }
          
          console.log('AeroDataBox processed', airports.length, 'airports');
        } else if (aeroResponse) {
          const errorText = await aeroResponse.text();
          console.log('AeroDataBox final error - Status:', aeroResponse.status, 'Body:', errorText);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log('AeroDataBox fetch error:', errorMsg);
      }
    } else if (!rapidApiKey) {
      airports.push({
        code: 'NO_API_KEY',
        name: 'RAPIDAPI_KEY not configured',
        city: 'Check Supabase secrets',
        state: 'ERROR',
        country: 'ERROR',
        type: 'DEBUG',
        runwayLength: 0
      });
    }

    // Remove any debug entries if we have real results
    const realResults = airports.filter(a => a.type !== 'DEBUG');
    const debugEntries = airports.filter(a => a.type === 'DEBUG');
    
    if (realResults.length === 0) {
      console.log('No real results, using fallback database...');
      
      // Fallback to hardcoded database
      const fallbackAirports = [
        { code: 'EYW', name: 'Key West International Airport', city: 'Key West', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 4801, source: 'Fallback Database' },
        { code: 'KEYW', name: 'Key West International Airport', city: 'Key West', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 4801, source: 'Fallback Database' },
        { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 14511, source: 'Fallback Database' },
        { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 12923, source: 'Fallback Database' },
        { code: 'KORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', state: 'IL', country: 'US', type: 'Commercial', runwayLength: 13000, source: 'Fallback Database' },
        { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', state: 'NV', country: 'US', type: 'Commercial', runwayLength: 14514, source: 'Fallback Database' },
        { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 13016, source: 'Fallback Database' },
        { code: 'KEWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', country: 'US', type: 'Commercial', runwayLength: 11000, source: 'Fallback Database' },
        { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 11870, source: 'Fallback Database' },
        { code: 'KBOS', name: 'Boston Logan International Airport', city: 'Boston', state: 'MA', country: 'US', type: 'Commercial', runwayLength: 10083, source: 'Fallback Database' },
        { code: 'EGLL', name: 'London Heathrow Airport', city: 'London', state: 'England', country: 'UK', type: 'Commercial', runwayLength: 12799, source: 'Fallback Database' },
        { code: 'LHR', name: 'London Heathrow Airport', city: 'London', state: 'England', country: 'UK', type: 'Commercial', runwayLength: 12799, source: 'Fallback Database' }
      ];
      
      const queryLower = query.toLowerCase();
      const fallbackResults = fallbackAirports.filter(airport => 
        airport.code.toLowerCase().includes(queryLower) ||
        airport.name.toLowerCase().includes(queryLower) ||
        airport.city.toLowerCase().includes(queryLower)
      );
      
      // Include debug entries for API diagnostics
      airports = [...debugEntries, ...fallbackResults];
      console.log('Using fallback database, found', fallbackResults.length, 'airports');
    } else {
      airports = realResults;
    }

    console.log('Final result count:', airports.length);
    console.log('=== END DEBUG ===');

    // For debugging, include debug info in response if it's a debug query
    const response: any = { airports };
    if (query.includes('DEBUG_TEST')) {
      response.debug = {
        queryReceived: query,
        aviationEdgeConfigured: !!aviationEdgeKey,
        rapidApiConfigured: !!rapidApiKey,
        rapidApiKeyLength: rapidApiKey?.length || 0,
        rapidApiKeyPreview: rapidApiKey?.substring(0, 10) + '...' || 'NOT_SET',
        totalAirportsFound: airports.length,
        debugEntries: airports.filter(a => a.type === 'DEBUG'),
        realResults: airports.filter(a => a.type !== 'DEBUG'),
        fellbackToHardcoded: airports.some(a => a.code === 'KJFK' || a.code === 'KLAX'),
        rawApiResponse: null // Will be set if we captured it
      };
      
      // Try to capture the raw API response for debugging
      if (rapidApiKey) {
        try {
          const testResponse = await fetch('https://aerodatabox.p.rapidapi.com/airports/iata/LHR', {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (testResponse.ok) {
            const rawData = await testResponse.json();
            response.debug.rawApiResponse = rawData;
          } else {
            response.debug.rawApiResponse = {
              error: true,
              status: testResponse.status,
              statusText: testResponse.statusText,
              body: await testResponse.text()
            };
          }
        } catch (error) {
          response.debug.rawApiResponse = {
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      airports: [{
        code: 'FUNCTION_ERROR',
        name: `Function Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        city: 'Check function logs',
        state: 'ERROR',
        country: 'ERROR',
        type: 'DEBUG',
        runwayLength: 0
      }]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});