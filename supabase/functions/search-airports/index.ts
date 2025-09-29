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
    const airportDbToken = Deno.env.get('AIRPORTDB_API_TOKEN');
    
    console.log('AVIATION_EDGE_API_KEY configured:', !!aviationEdgeKey);
    console.log('AIRPORTDB_API_TOKEN configured:', !!airportDbToken);

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