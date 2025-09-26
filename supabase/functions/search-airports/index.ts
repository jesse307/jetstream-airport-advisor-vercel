import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Aircraft name mapping for aviapages API
function mapAircraftName(aircraftType: string): string {
  const mappings: { [key: string]: string } = {
    'Light Jet': 'Citation CJ',
    'Mid-Size Jet': 'Citation XLS',
    'Heavy Jet': 'Gulfstream G550',
    'Ultra Long Range': 'Global 7500',
    'Turboprop': 'King Air 350',
  };
  
  return mappings[aircraftType] || aircraftType;
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
      console.log('Flight time calculation requested');
      const aviapagesApiToken = Deno.env.get('AVIAPAGES_API_TOKEN');
      
      if (!aviapagesApiToken) {
        console.log('AVIAPAGES_API_TOKEN not configured');
        return new Response(JSON.stringify({
          success: false,
          error: 'Aviapages API token not configured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const mappedAircraftName = mapAircraftName(aircraftType);
        console.log(`Calculating flight time: ${departure} to ${arrival}, aircraft: ${mappedAircraftName}, passengers: ${passengers}`);

        const aviapagesResponse = await fetch('https://api.aviapages.com/v2/route/calculate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aviapagesApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            departure_airport: departure,
            arrival_airport: arrival,
            aircraft: mappedAircraftName,
            passengers: passengers || 1
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (aviapagesResponse.ok) {
          const flightData = await aviapagesResponse.json();
          console.log('Aviapages API response:', JSON.stringify(flightData).substring(0, 300));
          
          return new Response(JSON.stringify({
            success: true,
            flightTime: flightData
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await aviapagesResponse.text();
          console.log('Aviapages API failed:', aviapagesResponse.status, errorText);
          return new Response(JSON.stringify({
            success: false,
            error: `Aviapages API error: ${aviapagesResponse.status} - ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Aviapages API error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to calculate flight time'
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

    let airports: any[] = [];

    // Check environment variables
    const aviationEdgeKey = Deno.env.get('AVIATION_EDGE_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    console.log('AVIATION_EDGE_API_KEY configured:', !!aviationEdgeKey);
    console.log('RAPIDAPI_KEY configured:', !!rapidApiKey);
    if (rapidApiKey) {
      console.log('RAPIDAPI_KEY length:', rapidApiKey.length);
      console.log('RAPIDAPI_KEY preview:', rapidApiKey.substring(0, 10) + '...');
    }

    // Try Aviation Edge first (if configured)
    if (aviationEdgeKey) {
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
                runwayLength: 0
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

    // Try AeroDataBox if Aviation Edge didn't work
    if (airports.length === 0 && rapidApiKey) {
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
          
          if (!aeroResponse.ok) {
            const errorText = await aeroResponse.text();
            console.log('IATA failed - Status:', aeroResponse.status, 'Body:', errorText);
            
            // Store the error details
            airports.push({
              code: 'API_ERROR',
              name: `AeroDataBox API Error: ${aeroResponse.status}`,
              city: errorText.substring(0, 200),
              state: 'ERROR',
              country: 'ERROR',
              type: 'DEBUG',
              runwayLength: 0
            });
            
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
          const aeroData = await aeroResponse.json();
          console.log('AeroDataBox response type:', Array.isArray(aeroData) ? 'array' : typeof aeroData);
          console.log('AeroDataBox FULL response:', JSON.stringify(aeroData, null, 2));
          
          // Handle different response formats
          if (Array.isArray(aeroData)) {
            console.log('Processing array response with', aeroData.length, 'items');
            aeroData.forEach((airport: any, index: number) => {
              console.log(`Airport ${index}:`, JSON.stringify(airport, null, 2));
              airports.push({
                code: airport.iata || airport.icao || 'N/A',
                name: airport.fullName || airport.shortName || airport.name || 'Unknown',
                city: airport.municipalityName || airport.city || 'Unknown',
                state: airport.country?.code || airport.regionName || 'N/A',
                country: airport.country?.name || airport.countryName || 'Unknown',
                type: 'Commercial',
                runwayLength: 0
              });
            });
          } else if (aeroData && typeof aeroData === 'object') {
            console.log('Processing single object response:', JSON.stringify(aeroData, null, 2));
            // Single airport response
            airports.push({
              code: aeroData.iata || aeroData.icao || 'N/A',
              name: aeroData.fullName || aeroData.shortName || aeroData.name || 'Unknown',
              city: aeroData.municipalityName || aeroData.city || 'Unknown',
              state: aeroData.country?.code || aeroData.regionName || 'N/A',
              country: aeroData.country?.name || aeroData.countryName || 'Unknown',
              type: 'Commercial',
              runwayLength: 0
            });
          }
          
          console.log('AeroDataBox processed', airports.length, 'airports');
        } else if (aeroResponse) {
          const errorText = await aeroResponse.text();
          console.log('AeroDataBox final error - Status:', aeroResponse.status, 'Body:', errorText);
          
          airports.push({
            code: 'API_ERROR',
            name: `AeroDataBox API Error: ${aeroResponse.status}`,
            city: errorText.substring(0, 200),
            state: 'ERROR',
            country: 'ERROR',
            type: 'DEBUG',
            runwayLength: 0
          });
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log('AeroDataBox fetch error:', errorMsg);
        
        airports.push({
          code: 'FETCH_ERROR',
          name: `API Fetch Error: ${errorMsg}`,
          city: 'Network or timeout error',
          state: 'ERROR',
          country: 'ERROR',
          type: 'DEBUG',
          runwayLength: 0
        });
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
        { code: 'EYW', name: 'Key West International Airport', city: 'Key West', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 4801 },
        { code: 'KEYW', name: 'Key West International Airport', city: 'Key West', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 4801 },
        { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 14511 },
        { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 12923 },
        { code: 'KORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', state: 'IL', country: 'US', type: 'Commercial', runwayLength: 13000 },
        { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', state: 'NV', country: 'US', type: 'Commercial', runwayLength: 14514 },
        { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 13016 },
        { code: 'KEWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', country: 'US', type: 'Commercial', runwayLength: 11000 },
        { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 11870 },
        { code: 'KBOS', name: 'Boston Logan International Airport', city: 'Boston', state: 'MA', country: 'US', type: 'Commercial', runwayLength: 10083 },
        { code: 'KLHR', name: 'London Heathrow Airport', city: 'London', state: 'England', country: 'UK', type: 'Commercial', runwayLength: 12800 },
        { code: 'LHR', name: 'London Heathrow Airport', city: 'London', state: 'England', country: 'UK', type: 'Commercial', runwayLength: 12800 }
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