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

    // Get Make.com API key
    const makeApiKey = Deno.env.get("MAKE_API_KEY");
    
    if (!makeApiKey) {
      console.error("Make.com API key not configured");
      return new Response(
        JSON.stringify({ error: "Make.com integration not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Prepare data for Make.com webhook
    const makeData = {
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
      
      // Timestamp for Make.com
      exported_at: new Date().toISOString(),
      source: "Charter Flight Lead App"
    };

    console.log("Sending data to Make.com:", JSON.stringify(makeData, null, 2));

    // Send to Make.com webhook
    // Note: You'll need to provide your Make.com webhook URL
    // For now, we'll use the MAKE_API_KEY as a placeholder for the webhook URL
    // In a real implementation, you'd have a separate MAKE_WEBHOOK_URL environment variable
    
    const webhookUrl = `https://hook.us2.make.com/ym6st42bi0lhzvp14fdhk89whsfeoc6l`;
    
    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${makeApiKey}`, // If your webhook requires auth
      },
      body: JSON.stringify(makeData),
    });

    if (!makeResponse.ok) {
      const errorText = await makeResponse.text();
      console.error("Make.com webhook failed:", makeResponse.status, errorText);
      throw new Error(`Make.com webhook failed: ${makeResponse.status}`);
    }

    const result = await makeResponse.json();
    console.log("Make.com response:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead exported to Google Sheets successfully",
        makeResponse: result 
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