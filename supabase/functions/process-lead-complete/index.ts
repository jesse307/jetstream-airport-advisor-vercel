import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  departure_time?: string;
  return_date?: string;
  return_time?: string;
  passengers?: number;
  trip_type?: string;
  additional_notes?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody));
    
    const { rawData, userId } = requestBody;
    console.log('Processing complete workflow for raw data');
    console.log('Received userId:', userId);
    console.log('Received rawData length:', rawData?.length);
    
    // Extract URL from rawData (format: "Page: <title>\nURL: <url>\n\n...")
    let sourceUrl: string | null = null;
    const urlMatch = rawData?.match(/URL:\s*(.+)/);
    if (urlMatch && urlMatch[1]) {
      sourceUrl = urlMatch[1].trim();
      console.log('Extracted source URL:', sourceUrl);
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let user_id: string;
    
    // Try to get user from JWT token first (for web app calls)
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (authHeader && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined') {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (user) {
        user_id = user.id;
        console.log('Authenticated via JWT:', user_id);
      } else {
        console.log('JWT validation failed:', userError);
      }
    }
    
    // Fallback to userId from request body (for Chrome extension)
    if (!user_id && userId) {
      user_id = userId;
      console.log('Using userId from request:', user_id);
    }
    
    // If still no user, error
    if (!user_id) {
      console.error('No user identification - Auth header:', authHeader, 'Body userId:', userId);
      throw new Error('No user identification provided');
    }

    // Step 1: Parse the raw data using AI
    console.log('Step 1: Parsing lead data with AI');
    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-lead-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ unstructuredData: rawData }),
    });

    if (!parseResponse.ok) {
      const error = await parseResponse.text();
      console.error('Parse error:', error);
      throw new Error('Failed to parse lead data');
    }

    const { parsedData }: { parsedData: LeadData } = await parseResponse.json();
    console.log('Parsed lead data:', parsedData);

    // Clean up empty time strings - convert to null for database
    // Parse times from AM/PM format to HH:MM:SS format
    const parseTimeToHHMMSS = (timeStr: string | null | undefined): string | null => {
      if (!timeStr?.trim()) return null;
      
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const meridiem = match[3].toUpperCase();
      
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    };

    const cleanedData = {
      ...parsedData,
      departure_time: parseTimeToHHMMSS(parsedData.departure_time),
      return_time: parseTimeToHHMMSS(parsedData.return_time),
      // Don't populate datetime fields - keep as local date/time only
      departure_datetime: null,
      return_datetime: null,
    };

    // Step 2: Create lead in database with status "new" and user_id
    console.log('Step 2: Creating lead in database');
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        ...cleanedData,
        user_id: user_id,
        status: 'new',
        source: 'chrome_extension_auto',
        source_url: sourceUrl,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Lead creation error:', leadError);
      throw new Error('Failed to create lead');
    }

    console.log('Lead created:', lead.id);

    // Step 3: Trigger Make.com webhook
    console.log('Step 3: Triggering Make.com webhook');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const makeResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-make-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ leadData: lead }),
    });

    if (!makeResponse.ok) {
      const error = await makeResponse.text();
      console.error('Make.com webhook error:', error);
      // Don't throw here - lead was created successfully
      console.log('Warning: Make.com webhook failed but lead was created');
    } else {
      console.log('Make.com webhook triggered successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: lead.id,
        message: 'Lead processed and sent to Make.com'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in process-lead-complete:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process lead'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500 
      }
    );
  }
});
