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

    // Transform the data to a cleaner format
    const aircraftList = onGroundAircraft.map((flight: any) => ({
      registration: flight.registration || flight.modeSCode || 'Unknown',
      callsign: flight.callsign,
      aircraftType: flight.aircraftType || flight.aircraftModel || 'Unknown',
      operator: flight.operator || flight.airline,
      position: {
        lat: flight.latitude,
        lon: flight.longitude
      },
      altitude: flight.altitude,
      speed: flight.speed,
      heading: flight.heading,
      lastSeen: flight.timestamp || flight.lastUpdate,
      origin: flight.departure?.airport,
      destination: flight.arrival?.airport
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
