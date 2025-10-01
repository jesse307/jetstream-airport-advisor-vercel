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
      console.log('=== AERODATABOX FLIGHT TIME CALCULATION ===');
      console.log('Flight time calculation requested');
      console.log('Departure:', departure);
      console.log('Arrival:', arrival);
      console.log('Aircraft Type:', aircraftType);
      console.log('Passengers:', passengers);
      
      const aerodataboxApiKey = Deno.env.get('AERODATABOX_API_KEY');
      console.log('AERODATABOX_API_KEY configured:', !!aerodataboxApiKey);
      
      if (!aerodataboxApiKey) {
        console.log('ERROR: AERODATABOX_API_KEY not configured');
        return new Response(JSON.stringify({
          success: false,
          error: 'AeroDataBox API key not configured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const mappedAircraftName = mapAircraftName(aircraftType);
        console.log(`Mapped aircraft: ${aircraftType} -> ${mappedAircraftName}`);
        console.log(`Making API call to AeroDataBox with: ${departure} to ${arrival}, aircraft: ${mappedAircraftName}`);

        // AeroDataBox uses ICAO codes - ensure we're using the right format
        const departureCode = departure.length === 4 ? departure : `K${departure}`;
        const arrivalCode = arrival.length === 4 ? arrival : `K${arrival}`;
        
        const url = `https://aerodatabox.p.rapidapi.com/airports/icao/${departureCode}/distance-time/${arrivalCode}?flightTimeModel=ML01&aircraftName=${encodeURIComponent(mappedAircraftName)}`;
        console.log('Request URL:', url);

        const aerodataboxResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': aerodataboxApiKey,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(15000)
        });

        console.log('AeroDataBox response status:', aerodataboxResponse.status);

        if (aerodataboxResponse.ok) {
          const flightData = await aerodataboxResponse.json();
          console.log('AeroDataBox API SUCCESS:', JSON.stringify(flightData));
          
          // Transform AeroDataBox response to match expected format
          const transformedData = {
            time: {
              airway: flightData.flightTime ? Math.round(flightData.flightTime / 60) : null,
              great_circle: flightData.flightTime ? Math.round(flightData.flightTime / 60) : null
            },
            distance: {
              airway: flightData.greatCircleDistance?.nm || null,
              great_circle: flightData.greatCircleDistance?.nm || null
            },
            airport: {
              departure_airport: departure,
              arrival_airport: arrival
            },
            aircraft: mappedAircraftName
          };
          
          return new Response(JSON.stringify({
            success: true,
            flightTime: transformedData
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await aerodataboxResponse.text();
          console.log('AeroDataBox API FAILED - Status:', aerodataboxResponse.status);
          console.log('AeroDataBox API FAILED - Error body:', errorText);
          return new Response(JSON.stringify({
            success: false,
            error: `AeroDataBox API error: ${aerodataboxResponse.status} - ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('AeroDataBox API EXCEPTION:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error type');
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
    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    
    console.log('AVIAPAGES_API_TOKEN configured:', !!aviapagesToken);

    // Try Aviapages Airport API (if configured and query is long enough)
    if (aviapagesToken && query.length >= 3) {
      console.log('Trying Aviapages Airport API...');
      console.log('API Token configured, length:', aviapagesToken.length);
      
      try {
        // Build the search URL with query parameters
        const searchUrl = `https://dir.aviapages.com/api/airports/?search=${encodeURIComponent(query)}`;
        console.log('Using endpoint:', searchUrl);
        
        const aviapagesResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': `Token ${aviapagesToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000)
        });
        
        console.log('Aviapages Airport API response status:', aviapagesResponse.status);
        
        if (aviapagesResponse.ok) {
          const data = await aviapagesResponse.json();
          console.log('Aviapages response type:', typeof data);
          console.log('Aviapages response keys:', Object.keys(data));
          
          // The API likely returns results in a 'results' or 'airports' array
          const results = data.results || data.airports || data;
          
          if (Array.isArray(results) && results.length > 0) {
            console.log('Aviapages found', results.length, 'airports');
            
            results.forEach((airport: any) => {
              // Extract runway length from runways array if available
              let runwayLength = 0;
              if (airport.runways && Array.isArray(airport.runways) && airport.runways.length > 0) {
                runwayLength = Math.max(...airport.runways.map((r: any) => parseInt(r.length_ft || r.length) || 0));
              } else if (airport.runway_length) {
                runwayLength = parseInt(airport.runway_length);
              }
              
              airports.push({
                code: airport.iata || airport.icao || airport.lid || 'N/A',
                icao_code: airport.icao,
                name: airport.name || 'Unknown',
                city: airport.city?.name || airport.municipality || airport.city || 'Unknown',
                state: airport.state || airport.region || '',
                country: airport.country?.iso_alpha2 || airport.country?.name || airport.iso_country || 'Unknown',
                latitude: parseFloat(airport.latitude || airport.lat) || null,
                longitude: parseFloat(airport.longitude || airport.lon || airport.lng) || null,
                elevation: airport.elevation ? parseInt(airport.elevation) : null,
                runwayLength: runwayLength,
                type: airport.type || 'airport',
                source: 'Aviapages'
              });
            });
            
            console.log('Aviapages processed', airports.length, 'airports');
          } else {
            console.log('Aviapages returned no results or unexpected format');
          }
        } else {
          const errorText = await aviapagesResponse.text();
          console.log('Aviapages API error response:', errorText);
        }
      } catch (error) {
        console.log('Aviapages API error:', error instanceof Error ? error.message : 'Unknown error');
      }
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
        { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 12091, source: 'Fallback Database' },
        { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 12091, source: 'Fallback Database' },
        { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 14572, source: 'Fallback Database' },
        { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 14572, source: 'Fallback Database' },
        { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 7000, source: 'Fallback Database' },
        { code: 'KLGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', country: 'US', type: 'Commercial', runwayLength: 7000, source: 'Fallback Database' },
        { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', state: 'IL', country: 'US', type: 'Commercial', runwayLength: 13000, source: 'Fallback Database' },
        { code: 'KORD', name: 'O\'Hare International Airport', city: 'Chicago', state: 'IL', country: 'US', type: 'Commercial', runwayLength: 13000, source: 'Fallback Database' },
        { code: 'MIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 13016, source: 'Fallback Database' },
        { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'US', type: 'Commercial', runwayLength: 13016, source: 'Fallback Database' },
        { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 13401, source: 'Fallback Database' },
        { code: 'KDFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 13401, source: 'Fallback Database' },
        { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 11870, source: 'Fallback Database' },
        { code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'US', type: 'Commercial', runwayLength: 11870, source: 'Fallback Database' },
        { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', state: 'GA', country: 'US', type: 'Commercial', runwayLength: 12390, source: 'Fallback Database' },
        { code: 'KATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', state: 'GA', country: 'US', type: 'Commercial', runwayLength: 12390, source: 'Fallback Database' },
        { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', country: 'US', type: 'Commercial', runwayLength: 11901, source: 'Fallback Database' },
        { code: 'KSEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', country: 'US', type: 'Commercial', runwayLength: 11901, source: 'Fallback Database' },
        { code: 'LAS', name: 'McCarran International Airport', city: 'Las Vegas', state: 'NV', country: 'US', type: 'Commercial', runwayLength: 14511, source: 'Fallback Database' },
        { code: 'KLAS', name: 'McCarran International Airport', city: 'Las Vegas', state: 'NV', country: 'US', type: 'Commercial', runwayLength: 14511, source: 'Fallback Database' },
        { code: 'DEN', name: 'Denver International Airport', city: 'Denver', state: 'CO', country: 'US', type: 'Commercial', runwayLength: 16000, source: 'Fallback Database' },
        { code: 'KDEN', name: 'Denver International Airport', city: 'Denver', state: 'CO', country: 'US', type: 'Commercial', runwayLength: 16000, source: 'Fallback Database' },
        { code: 'BOS', name: 'Logan International Airport', city: 'Boston', state: 'MA', country: 'US', type: 'Commercial', runwayLength: 10083, source: 'Fallback Database' },
        { code: 'KBOS', name: 'Logan International Airport', city: 'Boston', state: 'MA', country: 'US', type: 'Commercial', runwayLength: 10083, source: 'Fallback Database' },
        { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', country: 'US', type: 'Commercial', runwayLength: 11489, source: 'Fallback Database' },
        { code: 'KPHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', country: 'US', type: 'Commercial', runwayLength: 11489, source: 'Fallback Database' },
        { code: 'IAH', name: 'Houston George Bush', city: 'Houston', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 12037, source: 'Fallback Database' },
        { code: 'KIAH', name: 'Houston George Bush', city: 'Houston', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 12037, source: 'Fallback Database' },
        { code: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 7602, source: 'Fallback Database' },
        { code: 'KHOU', name: 'William P. Hobby Airport', city: 'Houston', state: 'TX', country: 'US', type: 'Commercial', runwayLength: 7602, source: 'Fallback Database' },
        { code: 'TEB', name: 'Teterboro', city: 'Teterboro', state: 'NJ', country: 'US', type: 'Commercial', runwayLength: 7014, source: 'Fallback Database' },
        { code: 'KTEB', name: 'Teterboro', city: 'Teterboro', state: 'NJ', country: 'US', type: 'Commercial', runwayLength: 7014, source: 'Fallback Database' },
        { code: 'OGG', name: 'Kahului', city: 'Kahului', state: 'HI', country: 'US', type: 'Commercial', runwayLength: 7021, source: 'Fallback Database' },
        { code: 'PHOG', name: 'Kahului', city: 'Kahului', state: 'HI', country: 'US', type: 'Commercial', runwayLength: 7021, source: 'Fallback Database' }
      ];

      const filteredFallback = fallbackAirports.filter(airport => {
        const codeMatch = airport.code.toLowerCase().includes(query.toLowerCase());
        const nameMatch = airport.name.toLowerCase().includes(query.toLowerCase());
        const cityMatch = airport.city.toLowerCase().includes(query.toLowerCase());
        return codeMatch || nameMatch || cityMatch;
      });

      airports = filteredFallback.slice(0, 10);
      console.log('Fallback found', airports.length, 'airports');
    } else {
      airports = realResults;
    }

    console.log('=== SEARCH COMPLETE ===');
    console.log('Total airports found:', airports.length);
    console.log('Results:', JSON.stringify(airports, null, 2));

    return new Response(JSON.stringify({ airports }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-airports function:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});