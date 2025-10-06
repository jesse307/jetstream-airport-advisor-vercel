import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Callsign prefix to operator mapping
const CALLSIGN_OPERATORS: Record<string, string> = {
  'EJA': 'NetJets',
  'VJA': 'VistaJet',
  'LXJ': 'Flexjet',
  'FLX': 'Flexjet',
  'JRE': 'JetReady',
  'XOJ': 'XOJET',
  'TMC': 'Jet Aviation',
  'GAJ': 'GrandView Aviation',
  'SOF': 'Solairus Aviation',
  'MMD': 'Magellan Jets',
  'TWY': 'Jet Linx Aviation',
  'VXJ': 'VistaJet',
  'WUP': 'Wheels Up',
  'KOW': 'JetSuite',
  'JRE': 'JetReady',
};

function getOperatorFromCallsign(callsign?: string): string | null {
  if (!callsign) return null;
  
  // Extract prefix (usually first 3 letters)
  const prefix = callsign.substring(0, 3).toUpperCase();
  return CALLSIGN_OPERATORS[prefix] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { airportIcao } = await req.json();
    
    if (!airportIcao) {
      return new Response(
        JSON.stringify({ error: 'airportIcao is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('AIRNAV_RADARBOX_API_KEY');
    if (!apiKey) {
      console.error('AIRNAV_RADARBOX_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching aircraft on ground at ${airportIcao}`);
    console.log('API Key configured:', !!apiKey);

    // Call AirNav RadarBox API to get live flights at this airport
    const url = 'https://api.airnavradar.com/v2/flights/live';
    
    const requestBody = {
      toOrFromAirports: [airportIcao.toUpperCase()],
      incLastKnownPos: false
    };

    console.log('Request URL:', url);
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AirNav API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Received ${data.flights?.length || 0} flights from API`);
    
    // Log sample flight data to see structure
    if (data.flights && data.flights.length > 0) {
      console.log('Sample flight data:', JSON.stringify(data.flights[0], null, 2));
    }

    // Filter for aircraft on the ground
    // Aircraft are considered on ground if:
    // 1. Altitude is 0 or very low (< 500 feet)
    // 2. Speed is 0 or very low (< 50 knots)
    // 3. Has a position at/near the airport
    const onGroundAircraft = (data.flights || []).filter((flight: any) => {
      const altitude = flight.altitude || 0;
      const speed = flight.speed || 0;
      const isOnGround = altitude < 500 && speed < 50;
      
      if (isOnGround) {
        console.log(`Aircraft on ground: ${flight.registration || flight.callsign} - Alt: ${altitude}ft, Speed: ${speed}kt`);
      }
      
      return isOnGround;
    });

    console.log(`Found ${onGroundAircraft.length} aircraft on ground`);

    // Transform the data to a cleaner format and fetch flight history
    const aircraftList = await Promise.all(onGroundAircraft.map(async (flight: any) => {
      const registration = flight.registration || flight.reg || flight.tail || flight.modeSCode;
      const callsign = flight.callsign || flight.flight || flight.flightNumber;
      let operatorName = flight.operator || flight.airline || flight.operatorName;
      
      console.log(`Mapping aircraft - reg: ${registration}, callsign: ${callsign}, type: ${flight.aircraftType}`);
      
      // Try to get operator from cache first
      if (registration && registration !== 'Unknown') {
        const { data: cachedOperator } = await supabase
          .from('aircraft_operators')
          .select('operator_name, callsign_prefix')
          .eq('tail_number', registration)
          .single();
        
        if (cachedOperator?.operator_name) {
          operatorName = cachedOperator.operator_name;
          console.log(`Found cached operator for ${registration}: ${operatorName}`);
        }
      }
      
      // If no operator yet, try callsign prefix lookup
      if (!operatorName && callsign) {
        const callsignOperator = getOperatorFromCallsign(callsign);
        if (callsignOperator) {
          operatorName = callsignOperator;
          console.log(`Identified operator from callsign ${callsign}: ${operatorName}`);
        }
      }
      
      const baseData = {
        registration: registration || callsign || 'Unknown',
        callsign: callsign !== registration ? callsign : undefined,
        aircraftType: flight.aircraftType || flight.aircraftModel || flight.type || 'Unknown',
        operator: operatorName,
        position: {
          lat: flight.latitude || flight.lat,
          lon: flight.longitude || flight.lon
        },
        altitude: flight.altitude || flight.alt || 0,
        speed: flight.speed || flight.groundSpeed || 0,
        heading: flight.heading || flight.track || 0,
        lastSeen: flight.timestamp || flight.lastUpdate || flight.time,
        origin: flight.departure?.airport || flight.origin || flight.from,
        destination: flight.arrival?.airport || flight.destination || flight.to,
        lastFlight: null,
        nextFlight: null
      };

      // Cache the operator info if we have it
      if (registration && registration !== 'Unknown' && operatorName) {
        const callsignPrefix = callsign ? callsign.substring(0, 3) : null;
        
        await supabase
          .from('aircraft_operators')
          .upsert({
            tail_number: registration,
            operator_name: operatorName,
            callsign_prefix: callsignPrefix,
            aircraft_type: baseData.aircraftType,
            last_seen_airport: airportIcao.toUpperCase()
          }, {
            onConflict: 'tail_number'
          });
        
        console.log(`Cached operator info for ${registration}`);
      }

      // Fetch flight history for this aircraft if we have a registration
      if (registration && registration !== 'Unknown') {
        try {
          // Get flights from last 48 hours
          const now = new Date();
          const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
          const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
          
          // Search for recent flights by this registration
          const historyUrl = `https://api.airnavradar.com/v2/flights/search?registration=${encodeURIComponent(registration)}&fromDate=${twoDaysAgo.toISOString()}&toDate=${now.toISOString()}&page=1&pageSize=5`;
          
          const historyResponse = await fetch(historyUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            if (historyData.flights && historyData.flights.length > 0) {
              // Find the most recent completed flight
              const recentFlights = historyData.flights
                .filter((f: any) => f.arrival?.actualTime || f.arrival?.estimatedTime)
                .sort((a: any, b: any) => {
                  const aTime = new Date(a.arrival?.actualTime || a.arrival?.estimatedTime).getTime();
                  const bTime = new Date(b.arrival?.actualTime || b.arrival?.estimatedTime).getTime();
                  return bTime - aTime;
                });
              
              if (recentFlights.length > 0) {
                const lastFlight = recentFlights[0];
                baseData.lastFlight = {
                  from: lastFlight.departure?.airport,
                  to: lastFlight.arrival?.airport,
                  departureTime: lastFlight.departure?.actualTime || lastFlight.departure?.estimatedTime,
                  arrivalTime: lastFlight.arrival?.actualTime || lastFlight.arrival?.estimatedTime,
                  callsign: lastFlight.callsign
                };
              }
            }
          }

          // Search for scheduled future flights
          const scheduleUrl = `https://api.airnavradar.com/v2/flights/schedules?registration=${encodeURIComponent(registration)}&departureFromDate=${now.toISOString()}&departureToDate=${tomorrow.toISOString()}`;
          
          const scheduleResponse = await fetch(scheduleUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            if (scheduleData.flights && scheduleData.flights.length > 0) {
              const nextFlight = scheduleData.flights[0];
              baseData.nextFlight = {
                from: nextFlight.departure?.airport,
                to: nextFlight.arrival?.airport,
                departureTime: nextFlight.departure?.scheduledTime || nextFlight.departure?.estimatedTime,
                arrivalTime: nextFlight.arrival?.scheduledTime || nextFlight.arrival?.estimatedTime,
                callsign: nextFlight.callsign
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching flight history for ${registration}:`, error);
        }
      }
      
      return baseData;
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        airport: airportIcao.toUpperCase(),
        totalFlights: data.flights?.length || 0,
        onGroundCount: aircraftList.length,
        aircraft: aircraftList
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-aircraft-on-ground:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
