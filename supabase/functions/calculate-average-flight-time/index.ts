import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightTimeRequest {
  departure: string;
  arrival: string;
  passengers: number;
  hasReturn?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departure, arrival, passengers, hasReturn }: FlightTimeRequest = await req.json();
    
    console.log('=== CALCULATE AVERAGE FLIGHT TIME ===');
    console.log('Departure:', departure);
    console.log('Arrival:', arrival);
    console.log('Passengers:', passengers);
    console.log('Has Return:', hasReturn);

    const aerodataboxApiKey = Deno.env.get('AERODATABOX_API_KEY');
    if (!aerodataboxApiKey) {
      throw new Error('AeroDataBox API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get suitable aircraft from database
    const { data: aircraft, error: dbError } = await supabase
      .from('aircraft')
      .select('*')
      .gte('typical_passengers', passengers)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch aircraft');
    }

    console.log(`Found ${aircraft?.length || 0} suitable aircraft`);

    // Calculate flight times for outbound
    const outboundResults: number[] = [];
    
    // Use ICAO format
    const departureCode = departure.length === 4 ? departure : `K${departure}`;
    const arrivalCode = arrival.length === 4 ? arrival : `K${arrival}`;

    // Sample a subset of aircraft to avoid too many API calls
    const aircraftToCheck = aircraft?.slice(0, 10) || [];
    
    for (const ac of aircraftToCheck) {
      try {
        const aircraftName = ac.model || ac.aviapages_name;
        if (!aircraftName) continue;

        const url = `https://aerodatabox.p.rapidapi.com/airports/icao/${departureCode}/distance-time/${arrivalCode}?flightTimeModel=ML01&aircraftName=${encodeURIComponent(aircraftName)}`;
        
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': aerodataboxApiKey,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.approxFlightTime) {
            // Parse "HH:MM:SS" to minutes
            const timeParts = data.approxFlightTime.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const totalMinutes = (hours * 60) + minutes;
            outboundResults.push(totalMinutes);
            console.log(`${aircraftName}: ${totalMinutes} minutes`);
          }
        }
      } catch (error) {
        console.log(`Error checking aircraft ${ac.model}:`, error);
        // Continue with next aircraft
      }
    }

    // Calculate averages
    const avgOutbound = outboundResults.length > 0 
      ? Math.round(outboundResults.reduce((a, b) => a + b, 0) / outboundResults.length)
      : 0;

    let avgReturn = 0;
    if (hasReturn) {
      // For return flight, it's the same route in reverse
      const returnResults: number[] = [];
      
      for (const ac of aircraftToCheck) {
        try {
          const aircraftName = ac.model || ac.aviapages_name;
          if (!aircraftName) continue;

          const url = `https://aerodatabox.p.rapidapi.com/airports/icao/${arrivalCode}/distance-time/${departureCode}?flightTimeModel=ML01&aircraftName=${encodeURIComponent(aircraftName)}`;
          
          const response = await fetch(url, {
            headers: {
              'X-RapidAPI-Key': aerodataboxApiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.approxFlightTime) {
              const timeParts = data.approxFlightTime.split(':');
              const hours = parseInt(timeParts[0]);
              const minutes = parseInt(timeParts[1]);
              const totalMinutes = (hours * 60) + minutes;
              returnResults.push(totalMinutes);
            }
          }
        } catch (error) {
          console.log(`Error checking return for ${ac.model}:`, error);
        }
      }

      avgReturn = returnResults.length > 0
        ? Math.round(returnResults.reduce((a, b) => a + b, 0) / returnResults.length)
        : 0;
    }

    console.log('Average outbound flight time:', avgOutbound, 'minutes');
    console.log('Average return flight time:', avgReturn, 'minutes');

    // Format response
    const result = {
      success: true,
      outboundFlightTimeMinutes: avgOutbound,
      outboundFlightTimeFormatted: formatMinutes(avgOutbound),
      returnFlightTimeMinutes: hasReturn ? avgReturn : null,
      returnFlightTimeFormatted: hasReturn ? formatMinutes(avgReturn) : null,
      aircraftChecked: aircraftToCheck.length,
      successfulCalculations: outboundResults.length
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}
