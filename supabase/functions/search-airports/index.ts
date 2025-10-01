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

    let airports: any[] = [];
    
    const aerodataboxApiKey = Deno.env.get('AERODATABOX_API_KEY');
    console.log('AERODATABOX_API_KEY configured:', !!aerodataboxApiKey);

    // Try AeroDataBox airport search first
    if (aerodataboxApiKey && query.length >= 2) {
      console.log('Trying AeroDataBox Airport Search...');
      
      try {
        const searchUrl = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(query)}&limit=15`;
        console.log('Request URL:', searchUrl);

        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': aerodataboxApiKey,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(10000)
        });

        console.log('AeroDataBox search response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('AeroDataBox found', data.items?.length || 0, 'airports');
          
          if (data.items && Array.isArray(data.items)) {
            for (const airport of data.items) {
              // Get runway information for this airport
              let runwayLength = 0;
              try {
                const runwayUrl = `https://aerodatabox.p.rapidapi.com/airports/icao/${airport.icao}/runways`;
                console.log(`Fetching runway data from: ${runwayUrl}`);
                const runwayResponse = await fetch(runwayUrl, {
                  headers: {
                    'X-RapidAPI-Key': aerodataboxApiKey,
                    'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
                  },
                  signal: AbortSignal.timeout(5000)
                });
                
                console.log(`Runway response status for ${airport.icao}:`, runwayResponse.status);
                
                if (runwayResponse.ok) {
                  const runways = await runwayResponse.json();
                  console.log(`Runway data for ${airport.icao}:`, JSON.stringify(runways));
                  if (runways && Array.isArray(runways) && runways.length > 0) {
                    runwayLength = Math.max(...runways.map((r: any) => r.lengthFt || 0));
                    console.log(`Calculated runway length for ${airport.icao}:`, runwayLength);
                  } else {
                    console.log(`No runway array found for ${airport.icao}`);
                  }
                } else {
                  const errorText = await runwayResponse.text();
                  console.log(`Runway API error for ${airport.icao}:`, runwayResponse.status, errorText);
                }
              } catch (runwayError) {
                console.log(`Failed to fetch runway for ${airport.icao}:`, runwayError instanceof Error ? runwayError.message : 'Unknown error');
              }

              airports.push({
                code: airport.iata || airport.icao || 'N/A',
                icao_code: airport.icao,
                name: airport.name || 'Unknown',
                city: airport.municipalityName || airport.location?.name || 'Unknown',
                state: airport.countryCode || '',
                country: airport.countryCode || 'Unknown',
                latitude: airport.location?.lat || null,
                longitude: airport.location?.lon || null,
                elevation: airport.elevationFt || null,
                runwayLength: runwayLength,
                type: 'airport',
                source: 'AeroDataBox'
              });
            }
            console.log('AeroDataBox processed', airports.length, 'airports with runway info');
          }
        } else {
          const errorText = await response.text();
          console.log('AeroDataBox API error:', response.status, errorText);
        }
      } catch (error) {
        console.log('AeroDataBox search error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Fallback to local database if no results
    if (airports.length === 0) {
      console.log('No AeroDataBox results, using fallback database...');
    // Use hardcoded database
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
      console.log('Found', airports.length, 'airports in database');
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