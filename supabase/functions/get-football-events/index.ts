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

    // Map city names to team search terms
    const cityToTeams: Record<string, string[]> = {
      "Los Angeles": ["Rams", "Chargers"],
      "Miami": ["Dolphins"],
      "New York": ["Giants", "Jets"],
      "Chicago": ["Bears"],
      "Dallas": ["Cowboys"],
      "Green Bay": ["Packers"],
      "San Francisco": ["49ers"],
      "Boston": ["Patriots"],
      "Philadelphia": ["Eagles"],
      "Seattle": ["Seahawks"],
      "Denver": ["Broncos"],
      "Kansas City": ["Chiefs"],
      "Las Vegas": ["Raiders"],
      "Buffalo": ["Bills"],
      "Baltimore": ["Ravens"],
      "Pittsburgh": ["Steelers"],
      "Cleveland": ["Browns"],
      "Cincinnati": ["Bengals"],
      "Jacksonville": ["Jaguars"],
      "Indianapolis": ["Colts"],
      "Houston": ["Texans"],
      "Tennessee": ["Titans"],
      "Washington": ["Commanders"],
      "Detroit": ["Lions"],
      "Minnesota": ["Vikings"],
      "Atlanta": ["Falcons"],
      "Carolina": ["Panthers"],
      "New Orleans": ["Saints"],
      "Tampa": ["Buccaneers"],
      "Arizona": ["Cardinals"]
    };

    const teamNames = cityToTeams[city] || [];
    console.log("Team names to search:", teamNames);

    if (teamNames.length === 0) {
      console.log("No known NFL teams in this city");
      return new Response(JSON.stringify({ games: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Search for each team and get their games
    const allGames = [];
    
    for (const teamName of teamNames) {
      console.log(`Searching for team: ${teamName}`);
      
      const teamsUrl = `https://v1.american-football.api-sports.io/teams?league=1&season=2025&search=${encodeURIComponent(teamName)}`;
      
      const teamsResponse = await fetch(teamsUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "v1.american-football.api-sports.io",
        },
      });

      if (!teamsResponse.ok) {
        console.error(`Failed to find team ${teamName}`);
        continue;
      }

      const teamsData = await teamsResponse.json();
      
      if (!teamsData.response || teamsData.response.length === 0) {
        console.log(`No team found for ${teamName}`);
        continue;
      }

      const teamId = teamsData.response[0].id;
      console.log(`Found team ${teamName} with ID: ${teamId}`);

      // Get games for this team around the date
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
        console.log(`Games found for ${teamName}:`, gamesData?.response?.length || 0);
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
