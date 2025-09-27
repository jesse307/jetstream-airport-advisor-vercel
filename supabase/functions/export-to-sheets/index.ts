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
  departureTime: string;
  returnDate: string;
  returnTime: string;
  passengers: number;
  notes: string;
  leadId: string;
  createdAt: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    // Zapier webhook doesn't require API key authentication

    // Prepare data for Zapier webhook
    const zapierData = {
      // Contact Information
      first_name: leadData.firstName,
      last_name: leadData.lastName,
      full_name: `${leadData.firstName} ${leadData.lastName}`,
      email: leadData.email,
      phone: leadData.phone,
      
      // Flight Details
      trip_type: leadData.tripType,
      departure_airport: leadData.departureAirport,
      arrival_airport: leadData.arrivalAirport,
      route: `${leadData.departureAirport} → ${leadData.arrivalAirport}`,
      departure_date: leadData.departureDate,
      departure_time: leadData.departureTime,
      return_date: leadData.returnDate,
      return_time: leadData.returnTime,
      passengers: leadData.passengers,
      notes: leadData.notes,
      
      // Meta Information
      lead_id: leadData.leadId,
      created_at: leadData.createdAt,
      status: leadData.status,
      
      // Timestamp for Zapier
      exported_at: new Date().toISOString(),
      source: "Charter Flight Lead App"
    };

    console.log("Sending data to Zapier:", JSON.stringify(zapierData, null, 2));

    // Send to Zapier webhook
    const webhookUrl = `https://hooks.zapier.com/hooks/catch/24529303/u1091p8/`;
    
    const zapierResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zapierData),
    });

    if (!zapierResponse.ok) {
      const errorText = await zapierResponse.text();
      console.error("Zapier webhook failed:", zapierResponse.status, errorText);
      throw new Error(`Zapier webhook failed: ${zapierResponse.status}`);
    }

    const result = await zapierResponse.json();
    console.log("Zapier response:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead exported to Google Sheets successfully",
        zapierResponse: result 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in export-to-sheets function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to export to Google Sheets",
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