import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Haversine formula to calculate distance between two coordinates in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departureAirport, arrivalAirport, startDate, endDate } = await req.json();
    console.log("Fetching football events near airports");
    console.log("Departure:", departureAirport);
    console.log("Arrival:", arrivalAirport);
    console.log("Date range:", startDate, "to", endDate);

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Required environment variables not configured");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all NFL teams from database
    const { data: nflTeams, error: teamsError } = await supabase
      .from('nfl_teams')
      .select('*');

    if (teamsError) {
      console.error("Error fetching NFL teams:", teamsError);
      throw teamsError;
    }

    console.log(`Found ${nflTeams?.length || 0} NFL teams in database`);

    // Find teams within 50 miles of either airport
    const nearbyTeams = nflTeams?.filter(team => {
      const distanceToDeparture = calculateDistance(
        departureAirport.latitude,
        departureAirport.longitude,
        parseFloat(team.stadium_latitude),
        parseFloat(team.stadium_longitude)
      );
      
      const distanceToArrival = calculateDistance(
        arrivalAirport.latitude,
        arrivalAirport.longitude,
        parseFloat(team.stadium_latitude),
        parseFloat(team.stadium_longitude)
      );

      const isNearby = distanceToDeparture <= 50 || distanceToArrival <= 50;
      
      if (isNearby) {
        console.log(`${team.team_name}: ${Math.min(distanceToDeparture, distanceToArrival).toFixed(1)} miles from nearest airport`);
      }

      return isNearby;
    }) || [];

    console.log(`Found ${nearbyTeams.length} teams within 50 miles`);

    if (nearbyTeams.length === 0) {
      return new Response(JSON.stringify({ games: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format dates for API (day before departure to day after arrival)
    const depDate = new Date(startDate);
    depDate.setDate(depDate.getDate() - 1); // Day before departure
    const searchStartDate = depDate.toISOString().split('T')[0];
    
    const arrDate = new Date(endDate);
    arrDate.setDate(arrDate.getDate() + 1); // Day after arrival
    const searchEndDate = arrDate.toISOString().split('T')[0];

    console.log(`Searching for games from ${searchStartDate} to ${searchEndDate}`);

    // Search for games for each nearby team
    const allGames = [];
    
    for (const team of nearbyTeams) {
      console.log(`Searching for ${team.team_name} games`);
      
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
        console.log(`No API data for ${team.team_name}`);
        continue;
      }

      const teamId = teamsData.response[0].id;

      // Get games for this team in the date range
      const gamesUrl = `https://v1.american-football.api-sports.io/games?team=${teamId}&season=2025&date=${searchStartDate}`;
      
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
          console.log(`Found ${gamesData.response.length} games for ${team.team_name}`);
          // Add stadium info to each game
          const gamesWithStadium = gamesData.response.map((game: any) => ({
            ...game,
            stadium_info: {
              name: team.stadium_name,
              city: team.team_city
            }
          }));
          allGames.push(...gamesWithStadium);
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
