import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Flatten data to individual fields at root level for Make webhook
    const webhookPayload = {
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      tripType: leadData.tripType,
      departureAirport: leadData.departureAirport,
      arrivalAirport: leadData.arrivalAirport,
      departureDate: leadData.departureDate,
      departureTime: leadData.departureTime,
      returnDate: leadData.returnDate,
      returnTime: leadData.returnTime,
      passengers: leadData.passengers,
      notes: leadData.notes,
      leadId: leadData.leadId,
      createdAt: leadData.createdAt,
      status: leadData.status
    };

    console.log("Sending data to Make webhook:", JSON.stringify(webhookPayload, null, 2));

    const webhookUrl = "https://hook.us2.make.com/j8qtzo8gui8ieqaye9dxprb2cgxqydlb";
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await webhookResponse.text();
    console.log("Make webhook response status:", webhookResponse.status);
    console.log("Make webhook response body:", responseText);

    if (!webhookResponse.ok) {
      console.error("Make webhook failed:", webhookResponse.status, responseText);
      throw new Error(`Make webhook failed: ${webhookResponse.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Process started successfully",
        webhookResponse: responseText 
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
