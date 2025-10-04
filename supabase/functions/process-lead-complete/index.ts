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
  return_date?: string;
  passengers?: number;
  trip_type?: string;
  additional_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData } = await req.json();
    console.log('Processing complete workflow for raw data');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Step 2: Create lead in database with status "new"
    console.log('Step 2: Creating lead in database');
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        ...parsedData,
        status: 'new',
        source: 'chrome_extension_auto',
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
    const makeResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-make-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
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
        status: 500 
      }
    );
  }
});
