import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, startDate, endDate } = await req.json();
    console.log("Fetching football events for city:", city);
    console.log("Date range:", startDate, "to", endDate);

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const APP_ID = "default-application_11070511";
    
    // Format dates for API (YYYY-MM-DD)
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log("Calling RapidAPI with dates:", formattedStartDate, "to", formattedEndDate);

    // Call RapidAPI sports events endpoint
    const url = `https://eventful-sports-data.p.rapidapi.com/v1/events?app_id=${APP_ID}&location=${encodeURIComponent(city)}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&sport=football`;
    
    console.log("API URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "eventful-sports-data.p.rapidapi.com",
      },
    });

    console.log("RapidAPI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", errorText);
      throw new Error(`RapidAPI request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Events found:", data?.events?.length || 0);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching football events:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
