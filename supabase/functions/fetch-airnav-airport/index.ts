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
    console.log('Parsing AirNav HTML for code:', code);
    
    // Extract airport name from title
    const titleMatch = html.match(/<title>([^-]+)-\s*([^(]+)\s*\(/i);
    let name = null;
    let iata = null;
    if (titleMatch) {
      iata = titleMatch[1].trim();
      name = titleMatch[2].trim();
    }
    
    // Alternative name extraction
    if (!name) {
      const nameMatch = html.match(/Airport:<\/b>\s*<[^>]+>([^<]+)</i) || 
                        html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      name = nameMatch ? nameMatch[1].trim() : null;
    }

    // Extract location - try multiple patterns
    let city = null;
    let state = null;
    
    const locationPatterns = [
      /Location:<\/b>\s*([^<,]+),\s*([A-Z]{2})/i,
      /City:<\/b>\s*([^<]+)<\/td>\s*<td[^>]*>State:<\/b>\s*([A-Z]{2})/i,
      /ownership:<\/b>[^<]*<\/td>\s*<td[^>]*>([^<,]+),\s*([A-Z]{2})/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = html.match(pattern);
      if (match) {
        city = match[1].trim();
        state = match[2].trim();
        break;
      }
    }

    // Extract coordinates - multiple formats
    let latitude = null;
    let longitude = null;
    
    const coordPatterns = [
      /Lat\/Long:<\/b>\s*([\d.-]+)\s*,\s*([\d.-]+)/i,
      /Latitude:<\/b>\s*([\d.-]+)[^<]*Longitude:<\/b>\s*([\d.-]+)/i,
      /(\d{1,3}\.\d+)°?\s*[NS],?\s*([\d.-]+)°?\s*[EW]/i
    ];
    
    for (const pattern of coordPatterns) {
      const match = html.match(pattern);
      if (match) {
        latitude = parseFloat(match[1]);
        longitude = parseFloat(match[2]);
        // Ensure longitude is negative for western hemisphere
        if (longitude > 0 && html.includes('W')) {
          longitude = -longitude;
        }
        break;
      }
    }

    // Extract elevation
    let elevation = null;
    const elevPatterns = [
      /Elevation:<\/b>\s*([\d,]+)\s*ft/i,
      /(\d{1,5})\s*ft\s*MSL/i
    ];
    
    for (const pattern of elevPatterns) {
      const match = html.match(pattern);
      if (match) {
        elevation = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Extract ALL runway lengths and find the longest
    const runwayMatches = html.matchAll(/(\d{3,5})\s*x\s*\d+\s*ft/gi);
    const runwayLengths = Array.from(runwayMatches, m => parseInt(m[1]));
    const runway_length = runwayLengths.length > 0 ? Math.max(...runwayLengths) : null;

    // Extract runway surface - get most common or first
    const surfaceMatches = html.matchAll(/Surface:<\/b>\s*([A-Za-z]+)/gi);
    const surfaces = Array.from(surfaceMatches, m => m[1]);
    const runway_surface = surfaces.length > 0 ? surfaces[0] : null;

    // Extract FBO information - multiple patterns
    const fboList: string[] = [];
    
    // Pattern 1: FBO links
    const fboLinkMatches = html.matchAll(/FBO[^<]*<a[^>]*>([^<]+)<\/a>/gi);
    fboList.push(...Array.from(fboLinkMatches, m => m[1].trim()));
    
    // Pattern 2: FBO in tables
    const fboTableMatches = html.matchAll(/<td[^>]*>([^<]*FBO[^<]*)<\/td>/gi);
    fboList.push(...Array.from(fboTableMatches, m => m[1].trim().replace(/\s+/g, ' ')));
    
    // Clean and deduplicate FBOs
    const fbos = [...new Set(fboList.filter(f => f && f.length > 2))];

    const parsedData = {
      name: name || code,
      city: city || 'Unknown',
      state: state || '',
      country: 'US',
      latitude,
      longitude,
      elevation,
      runway_length,
      runway_surface: runway_surface || 'Unknown',
      fbo: fbos.length > 0 ? fbos : null,
      iata_code: iata
    };

    console.log('Successfully parsed AirNav data:', parsedData);
    return parsedData;
    
  } catch (error) {
    console.error('Error parsing AirNav HTML:', error);
    return null;
  }
}
