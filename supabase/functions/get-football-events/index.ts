import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { airportLat, airportLon, startDate, endDate } = await req.json();
    console.log("Finding games near airport:", airportLat, airportLon);
    console.log("Date range:", startDate, "to", endDate);

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Get all NFL teams
    const { data: teams, error: teamsError } = await supabase
      .from('nfl_teams')
      .select('*');

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      throw teamsError;
    }

    console.log("Total NFL teams:", teams?.length || 0);

    // Filter teams within 50 miles
    const nearbyTeams = teams?.filter(team => {
      if (!team || !team.stadium_latitude || !team.stadium_longitude) {
        console.log("Skipping team with missing coordinates:", team?.team_name);
        return false;
      }
      const distance = calculateDistance(
        airportLat,
        airportLon,
        parseFloat(team.stadium_latitude.toString()),
        parseFloat(team.stadium_longitude.toString())
      );
      console.log(`${team.team_name}: ${distance.toFixed(1)} miles away`);
      return distance <= 50;
    }) || [];

    console.log("Teams within 50 miles:", nearbyTeams.length);

    if (nearbyTeams.length === 0) {
      return new Response(JSON.stringify({ games: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate date range (day before to day after)
    const startDateTime = new Date(startDate);
    startDateTime.setDate(startDateTime.getDate() - 1);
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);

    const searchStartDate = startDateTime.toISOString().split('T')[0];
    const searchEndDate = endDateTime.toISOString().split('T')[0];

    console.log("Searching games from", searchStartDate, "to", searchEndDate);

    // For each nearby team, get their games
    const allGames = [];
    
    for (const team of nearbyTeams) {
      console.log(`Searching for ${team.team_name} games...`);
      
      const teamsUrl = `https://v1.american-football.api-sports.io/teams?league=1&season=2025&search=${encodeURIComponent(team.team_name.split(' ').pop() || '')}`;
      
      const teamsResponse = await fetch(teamsUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "v1.american-football.api-sports.io",
        },
      });

      if (!teamsResponse.ok) {
        console.error(`Failed to find team ${team.team_name}`);
        continue;
      }

      const teamsData = await teamsResponse.json();
      
      if (!teamsData.response || teamsData.response.length === 0) {
        console.log(`No API match for ${team.team_name}`);
        continue;
      }

      const teamId = teamsData.response[0].id;
      console.log(`Found ${team.team_name} with API ID: ${teamId}`);

      // Get games in date range
      let currentDate = new Date(searchStartDate);
      const finalDate = new Date(searchEndDate);

      while (currentDate <= finalDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const gamesUrl = `https://v1.american-football.api-sports.io/games?team=${teamId}&season=2025&date=${dateStr}`;
        
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
            // Add stadium info to each game
            const gamesWithStadium = gamesData.response.map((game: any) => ({
              ...game,
              stadium_info: {
                name: team.stadium_name,
                distance_miles: calculateDistance(
                  airportLat,
                  airportLon,
                  parseFloat(team.stadium_latitude.toString()),
                  parseFloat(team.stadium_longitude.toString())
                ).toFixed(1)
              }
            }));
            allGames.push(...gamesWithStadium);
            console.log(`Found ${gamesData.response.length} game(s) for ${team.team_name} on ${dateStr}`);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
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
