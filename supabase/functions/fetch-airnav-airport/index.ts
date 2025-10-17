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
    
    // Extract IATA code (FAA Identifier)
    const iataMatch = html.match(/FAA Identifier:<\/b><\/td><td>([A-Z0-9]{3,4})/i);
    const iata = iataMatch ? iataMatch[1].trim() : null;
    console.log('Extracted IATA:', iata);
    
    // Extract airport name from header
    const nameMatch = html.match(/<font[^>]*size="\+1"[^>]*><b>([^<]+)<\/b>/i);
    const name = nameMatch ? nameMatch[1].trim() : null;
    console.log('Extracted name:', name);
    
    // Extract city from same header
    const cityMatch = html.match(/<b>([^<]+)<\/b><br>([^,]+),\s*([A-Za-z\s]+),\s*USA/i);
    let city = null;
    let state = null;
    if (cityMatch) {
      city = cityMatch[2].trim();
      state = cityMatch[3].trim();
    }
    console.log('Extracted city/state:', city, state);
    
    // Extract coordinates (decimal format)
    const coordMatch = html.match(/([-\d.]+),([-\d.]+)<br>\(estimated\)|Lat\/Long:<\/b><\/td><td[^>]*>[^<]*<br>[^<]*<br>([-\d.]+),([-\d.]+)/i);
    let latitude = null;
    let longitude = null;
    if (coordMatch) {
      latitude = parseFloat(coordMatch[3] || coordMatch[1]);
      longitude = parseFloat(coordMatch[4] || coordMatch[2]);
    }
    console.log('Extracted coordinates:', latitude, longitude);
    
    // Extract elevation from Location section
    const elevMatch = html.match(/Elevation:<\/b><\/td><td[^>]*>(\d+)\s*ft/i);
    const elevation = elevMatch ? parseInt(elevMatch[1]) : null;
    console.log('Extracted elevation:', elevation);

    // Extract ALL runway dimensions (format: "8002 x 150 ft")
    const runwayMatches = Array.from(html.matchAll(/Dimensions:<\/b><\/td><td[^>]*valign="top">(\d{3,5})\s*x\s*\d+\s*ft/gi));
    const runwayLengths = runwayMatches.map(m => parseInt(m[1]));
    const runway_length = runwayLengths.length > 0 ? Math.max(...runwayLengths) : null;
    console.log('Extracted runway lengths:', runwayLengths, 'Longest:', runway_length);

    // Extract runway surface (get first occurrence after "Surface:")
    const surfaceMatch = html.match(/Surface:<\/b><\/td><td[^>]*valign="top">([^,<]+)/i);
    const runway_surface = surfaceMatch ? surfaceMatch[1].trim() : null;
    console.log('Extracted surface:', runway_surface);

    // Extract FBO names from the FBO section
    // Pattern: <img src="..." alt="FBO Name" ...> in the FBO section
    const fboSection = html.match(/<h3>FBO, Fuel Providers[^<]*<\/h3>([\s\S]*?)<a name="/i);
    const fboList: string[] = [];
    
    if (fboSection) {
      // Extract from alt attributes of FBO logo images
      const fboImgMatches = fboSection[1].matchAll(/alt="([^"]+)"\s+border="0"><\/a>/gi);
      for (const match of fboImgMatches) {
        const fboName = match[1].trim();
        if (fboName && !fboName.includes('Aviation') && fboName !== 'Paragon Aviation Group') {
          fboList.push(fboName);
        } else if (fboName && fboName !== '') {
          fboList.push(fboName);
        }
      }
      
      // Also extract from the FBO links/names if images don't have good alt text
      const fboNameMatches = fboSection[1].matchAll(/<td width="240"><a[^>]*><a[^>]*><img[^>]*alt="([^"]+)"/gi);
      fboList.push(...Array.from(fboNameMatches, m => m[1].trim()));
    }
    
    // Clean and deduplicate FBOs
    const fbos = [...new Set(fboList.filter(f => 
      f && 
      f.length > 2 && 
      !f.includes('http') && 
      !f.includes('.gif') &&
      f !== 'Paragon Aviation Group'
    ))];
    console.log('Extracted FBOs:', fbos);

    const parsedData = {
      name: name || code,
      city: city || 'Unknown',
      state: state || '',
      country: 'US',
      latitude,
      longitude,
      elevation,
      runway_length,
      runway_surface: runway_surface || 'Asphalt',
      fbo: fbos.length > 0 ? fbos : null,
      iata_code: iata
    };

    console.log('=== FINAL PARSED DATA ===');
    console.log(JSON.stringify(parsedData, null, 2));
    return parsedData;
    
  } catch (error) {
    console.error('Error parsing AirNav HTML:', error);
    return null;
  }
}
