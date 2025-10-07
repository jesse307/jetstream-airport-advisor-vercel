import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Airport code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Fetching airport data from AirNav for:', code);

    // Convert 3-letter code to 4-letter ICAO (add K prefix for US airports)
    let icaoCode = code.toUpperCase();
    if (icaoCode.length === 3) {
      icaoCode = 'K' + icaoCode;
      console.log('Converted 3-letter code to ICAO:', icaoCode);
    }

    // Fetch the AirNav page
    const airnavUrl = `https://airnav.com/airport/${icaoCode}`;
    console.log('Fetching from:', airnavUrl);
    
    const response = await fetch(airnavUrl);
    
    if (!response.ok) {
      console.log('AirNav returned status:', response.status);
      return new Response(
        JSON.stringify({ error: 'Airport not found on AirNav' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const html = await response.text();
    
    // Parse the HTML to extract airport information
    const airportData = parseAirNavHTML(html, icaoCode);
    
    if (!airportData) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse airport data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully parsed airport data:', airportData);

    // Store in fallback database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from('fallback_airports')
      .upsert({
        code: icaoCode,
        ...airportData,
        source: 'airnav'
      }, {
        onConflict: 'code'
      });

    if (insertError) {
      console.error('Error storing airport data:', insertError);
    } else {
      console.log('Successfully stored airport data in fallback database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          code: icaoCode,
          ...airportData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching AirNav data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function parseAirNavHTML(html: string, code: string): any {
  try {
    // Extract airport name
    const nameMatch = html.match(/<title>([^<]+)\s+\(/);
    const name = nameMatch ? nameMatch[1].trim() : null;

    // Extract location (city, state)
    const locationMatch = html.match(/Location:<\/b>\s*([^<]+)/);
    let city = null;
    let state = null;
    if (locationMatch) {
      const location = locationMatch[1].trim();
      const parts = location.split(',');
      if (parts.length >= 2) {
        city = parts[0].trim();
        state = parts[1].trim().split(' ')[0]; // Get state code
      }
    }

    // Extract coordinates
    const latMatch = html.match(/Lat\/Long:<\/b>\s*([\d.-]+),\s*([\d.-]+)/);
    const latitude = latMatch ? parseFloat(latMatch[1]) : null;
    const longitude = latMatch ? parseFloat(latMatch[2]) : null;

    // Extract elevation
    const elevMatch = html.match(/Elevation:<\/b>\s*([\d,]+)/);
    const elevation = elevMatch ? parseInt(elevMatch[1].replace(/,/g, '')) : null;

    // Extract runway length (longest runway)
    const runwayMatch = html.match(/(\d+)\s*x\s*\d+\s*ft/);
    const runway_length = runwayMatch ? parseInt(runwayMatch[1]) : null;

    // Extract runway surface
    const surfaceMatch = html.match(/Surface:<\/b>\s*([A-Z]+)/i);
    const runway_surface = surfaceMatch ? surfaceMatch[1] : null;

    // Extract FBO information
    const fboMatches = html.matchAll(/FBO:<\/b>\s*<[^>]+>([^<]+)</g);
    const fbos = Array.from(fboMatches, m => m[1].trim());

    console.log('Parsed data:', {
      name,
      city,
      state,
      latitude,
      longitude,
      elevation,
      runway_length,
      runway_surface,
      fbo: fbos.length > 0 ? fbos : null
    });

    return {
      name,
      city,
      state,
      country: 'US', // AirNav is primarily US airports
      latitude,
      longitude,
      elevation,
      runway_length,
      runway_surface,
      fbo: fbos.length > 0 ? fbos : null
    };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return null;
  }
}
