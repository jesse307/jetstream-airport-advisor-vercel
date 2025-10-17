import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tailNumbers } = await req.json();
    
    if (!tailNumbers || !Array.isArray(tailNumbers)) {
      return new Response(
        JSON.stringify({ error: 'tailNumbers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aviapagesToken = Deno.env.get('AVIAPAGES_API_TOKEN');
    if (!aviapagesToken) {
      console.error('AVIAPAGES_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Aviapages API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching homebase data for ${tailNumbers.length} aircraft`);

    const results = [];

    // Fetch homebase data for each tail number
    for (const tailNumber of tailNumbers) {
      try {
        // Clean tail number (remove spaces, hyphens)
        const cleanTail = tailNumber.replace(/[-\s]/g, '').toUpperCase();
        
        console.log(`Looking up ${cleanTail} in Aviapages...`);
        
        const aviapagesUrl = `https://dir.aviapages.com/api/aircraft/${cleanTail}/`;
        const aviapagesResponse = await fetch(aviapagesUrl, {
          headers: {
            'Authorization': `Token ${aviapagesToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (aviapagesResponse.status === 404) {
          console.log(`Aircraft not found: ${cleanTail}`);
          results.push({
            tailNumber: cleanTail,
            success: false,
            error: 'not_found'
          });
          continue;
        }

        if (aviapagesResponse.status === 429) {
          console.log('Aviapages API rate limit exceeded');
          results.push({
            tailNumber: cleanTail,
            success: false,
            error: 'rate_limit_exceeded'
          });
          continue;
        }

        if (!aviapagesResponse.ok) {
          console.error(`Aviapages error for ${cleanTail}: ${aviapagesResponse.status}`);
          results.push({
            tailNumber: cleanTail,
            success: false,
            error: `api_error_${aviapagesResponse.status}`
          });
          continue;
        }

        const aviapagesData = await aviapagesResponse.json();
        console.log(`Aviapages response for ${cleanTail}:`, JSON.stringify(aviapagesData, null, 2));
        
        // Extract homebase and operator information
        const homeAirportIcao = aviapagesData.home_airport_icao || aviapagesData.homebase_icao || aviapagesData.home_base_icao;
        const homeAirportIata = aviapagesData.home_airport_iata || aviapagesData.homebase_iata || aviapagesData.home_base_iata;
        const homeAirportName = aviapagesData.home_airport_name || aviapagesData.homebase_name || aviapagesData.home_base_name || aviapagesData.home_airport;
        const operatorName = aviapagesData.operator || aviapagesData.owner || aviapagesData.operator_name;
        const countryCode = aviapagesData.country_code || aviapagesData.country;
        const aircraftType = aviapagesData.aircraft_type || aviapagesData.type || aviapagesData.model;

        // Store in database
        const { error: upsertError } = await supabase
          .from('aircraft_locations')
          .upsert({
            tail_number: cleanTail,
            home_airport_icao: homeAirportIcao,
            home_airport_iata: homeAirportIata,
            home_airport_name: homeAirportName,
            operator_name: operatorName,
            country_code: countryCode,
            aircraft_type: aircraftType,
            is_trusted: true,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'tail_number'
          });

        if (upsertError) {
          console.error(`Error storing ${cleanTail}:`, upsertError);
          results.push({
            tailNumber: cleanTail,
            success: false,
            error: 'database_error',
            details: upsertError.message
          });
        } else {
          console.log(`Successfully stored homebase for ${cleanTail}: ${homeAirportIcao || 'Unknown'}`);
          results.push({
            tailNumber: cleanTail,
            success: true,
            homebase: {
              icao: homeAirportIcao,
              iata: homeAirportIata,
              name: homeAirportName
            },
            operator: operatorName,
            aircraftType: aircraftType
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${tailNumber}:`, error.message);
        results.push({
          tailNumber: tailNumber,
          success: false,
          error: 'processing_error',
          details: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully processed ${successCount}/${tailNumbers.length} aircraft`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        summary: {
          total: tailNumbers.length,
          successful: successCount,
          failed: tailNumbers.length - successCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-trusted-operators:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
