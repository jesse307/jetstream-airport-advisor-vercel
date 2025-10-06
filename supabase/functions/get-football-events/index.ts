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

    // Format dates for API (YYYY-MM-DD)
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log("Searching for teams in:", city);

    // Step 1: Search for teams in the city (NFL league ID is 1, season 2025)
    const teamsUrl = `https://v1.american-football.api-sports.io/teams?league=1&season=2025&search=${encodeURIComponent(city)}`;
    
    const teamsResponse = await fetch(teamsUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "v1.american-football.api-sports.io",
      },
    });

    console.log("Teams API response status:", teamsResponse.status);

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      console.error("Teams API error:", errorText);
      throw new Error(`Teams API failed: ${teamsResponse.status} - ${errorText}`);
    }

    const teamsData = await teamsResponse.json();
    console.log("Teams found:", teamsData?.response?.length || 0);

    if (!teamsData.response || teamsData.response.length === 0) {
      return new Response(JSON.stringify({ games: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: For each team, get games in the date range
    const allGames = [];
    
    for (const teamInfo of teamsData.response) {
      const teamId = teamInfo.id;
      console.log(`Fetching games for team ${teamInfo.name} (ID: ${teamId})`);

      // Get games for the start date first
      const gamesUrl = `https://v1.american-football.api-sports.io/games?team=${teamId}&season=2025&date=${formattedStartDate}`;
      
      const gamesResponse = await fetch(gamesUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "v1.american-football.api-sports.io",
        },
      });

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        if (gamesData.response && gamesData.response.length > 0) {
          allGames.push(...gamesData.response);
        }
      }
    }

    console.log("Total games found:", allGames.length);

    return new Response(JSON.stringify({ games: allGames }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching football events:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", games: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
