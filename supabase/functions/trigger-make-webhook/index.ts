import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tripType: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  departureTime: string | null;
  returnDate: string;
  returnTime: string;
  passengers: number;
  notes: string;
  leadId: string;
  createdAt: string;
  status: string;
  distance?: number;
  flightTime?: string;
  aiAnalysis?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData }: { leadData: LeadData } = await req.json();
    
    if (!leadData) {
      return new Response(
        JSON.stringify({ error: "Lead data is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create form data with individual fields for Make webhook
    const formData = new URLSearchParams();
    formData.append('firstName', leadData.firstName);
    formData.append('lastName', leadData.lastName);
    formData.append('email', leadData.email);
    formData.append('phone', leadData.phone);
    formData.append('tripType', leadData.tripType);
    formData.append('departureAirport', leadData.departureAirport);
    formData.append('arrivalAirport', leadData.arrivalAirport);
    formData.append('departureDate', leadData.departureDate);
    formData.append('departureTime', leadData.departureTime || '');
    formData.append('returnDate', leadData.returnDate);
    formData.append('returnTime', leadData.returnTime || '');
    formData.append('passengers', leadData.passengers.toString());
    formData.append('notes', leadData.notes || '');
    formData.append('leadId', leadData.leadId);
    formData.append('createdAt', leadData.createdAt);
    formData.append('status', leadData.status);
    formData.append('distance', leadData.distance?.toString() || '');
    formData.append('flightTime', leadData.flightTime || '');
    formData.append('aiAnalysis', leadData.aiAnalysis || '');

    // Save to database first
    const { data: logEntry, error: dbError } = await supabase
      .from('webhook_logs')
      .insert({
        lead_id: leadData.leadId,
        webhook_url: "https://hook.us2.make.com/j8qtzo8gui8ieqaye9dxprb2cgxqydlb",
        payload: leadData,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to log webhook attempt: ${dbError.message}`);
    }

    console.log("Webhook attempt logged with ID:", logEntry.id);
    console.log("Sending form data to Make webhook:", formData.toString());

    const webhookUrl = "https://hook.us2.make.com/j8qtzo8gui8ieqaye9dxprb2cgxqydlb";
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await webhookResponse.text();
    console.log("Make webhook response status:", webhookResponse.status);
    console.log("Make webhook response body:", responseText);

    // Update database with response
    const updateData = {
      response_status: webhookResponse.status,
      response_body: responseText,
      success: webhookResponse.ok,
      error_message: webhookResponse.ok ? null : `Webhook failed with status ${webhookResponse.status}`,
    };

    const { error: updateError } = await supabase
      .from('webhook_logs')
      .update(updateData)
      .eq('id', logEntry.id);

    if (updateError) {
      console.error("Failed to update webhook log:", updateError);
    }

    if (!webhookResponse.ok) {
      console.error("Make webhook failed:", webhookResponse.status, responseText);
      throw new Error(`Make webhook failed: ${webhookResponse.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Process started successfully",
        webhookResponse: responseText,
        logId: logEntry.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in trigger-make-webhook function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to trigger Make webhook",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
