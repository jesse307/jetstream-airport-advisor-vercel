import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    if (!aviapagesToken) {
      throw new Error('AVIAPAGES_API_TOKEN not configured');
    }

    console.log('Fetching open legs from Aviapages API...');

    // Aviapages API endpoint for available aircraft/open legs
    const aviapagesUrl = 'https://dir.aviapages.com/api/available_aircraft/';

    const response = await fetch(aviapagesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${aviapagesToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aviapages API error:', response.status, errorText);
      throw new Error(`Aviapages API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} open legs from Aviapages`);

    // Transform Aviapages data to match our open_legs schema
    const transformedLegs = (data.results || []).map((leg: any) => {
      // Parse route to extract departure and arrival airports
      const route = leg.route || '';
      const routeParts = route.split(/[-–—>→]/i).map((p: string) => p.trim());

      return {
        operator_name: leg.operator_name || leg.operator || null,
        operator_email: leg.operator_email || leg.email || null,
        aircraft_type: leg.aircraft_type || leg.aircraft_model || null,
        tail_number: leg.tail_number || leg.registration || null,
        departure_airport: routeParts[0] || null,
        arrival_airport: routeParts[1] || null,
        route: route || null,
        departure_date: leg.departure_date || leg.available_from || null,
        departure_time: leg.departure_time || null,
        arrival_date: leg.arrival_date || null,
        arrival_time: leg.arrival_time || null,
        availability_start_date: leg.available_from || leg.departure_date || null,
        availability_end_date: leg.available_to || leg.departure_date || null,
        passengers: leg.passengers || leg.pax || null,
        price: leg.price || null,
        notes: leg.notes || leg.description || null,
        source: 'aviapages',
        external_id: leg.id?.toString() || null,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: transformedLegs.length,
        openLegs: transformedLegs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in fetch-aviapages-openlegs:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
