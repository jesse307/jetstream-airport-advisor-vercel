import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlightAnalysisRequest {
  departureCode: string;
  arrivalCode: string;
  passengers: number;
  departureAirport?: any;
  arrivalAirport?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departureCode, arrivalCode, passengers, departureAirport, arrivalAirport }: FlightAnalysisRequest = await req.json();
    
    const AVIAPAGES_API_TOKEN = Deno.env.get("AVIAPAGES_API_TOKEN");
    if (!AVIAPAGES_API_TOKEN) {
      throw new Error("AVIAPAGES_API_TOKEN not configured");
    }

    // Common aircraft models to query from Aviapages (just model names, not categories)
    const aircraftModels = [
      { name: "Citation CJ3+", category: "Light Jet" },
      { name: "Phenom 300", category: "Light Jet" },
      { name: "Citation CJ4", category: "Super Light Jet" },
      { name: "Citation X+", category: "Super Mid Jet" },
      { name: "Gulfstream G280", category: "Super Mid Jet" },
      { name: "Gulfstream G650", category: "Heavy Jet" },
      { name: "Global 6000", category: "Heavy Jet" },
      { name: "Learjet 75", category: "Light Jet" },
    ];

    // Query Aviapages for each aircraft model using POST method
    const aviapagesResults = await Promise.all(
      aircraftModels.map(async (aircraft) => {
        try {
          const requestBody = {
            departure_airport: departureCode,
            arrival_airport: arrivalCode,
            aircraft: aircraft.name,
            pax: passengers,
            great_circle_time: true,
            great_circle_distance: true,
            airway_time: true
          };

          const response = await fetch('https://frc.aviapages.com/api/flight_calculator/', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${AVIAPAGES_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(15000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Aviapages success for ${aircraft.name}`);
            return { 
              name: aircraft.name,
              category: aircraft.category,
              aviapagesData: data, 
              success: true 
            };
          } else {
            const errorText = await response.text();
            console.log(`Aviapages failed for ${aircraft.name}: ${response.status} - ${errorText}`);
            return { name: aircraft.name, category: aircraft.category, success: false };
          }
        } catch (error) {
          console.log(`Aviapages error for ${aircraft.name}:`, error.message);
          return { name: aircraft.name, category: aircraft.category, success: false };
        }
      })
    );

    // Filter to only successful results and take top 3-4
    const successfulAircraft = aviapagesResults
      .filter(result => result.success)
      .slice(0, 4);

    // Get distance from first successful result
    const distance = successfulAircraft[0]?.aviapagesData?.distance?.airway || 0;

    // Generate compact HTML report
    const generateHTML = () => {
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .route { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center; }
    .route-line { display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 8px; }
    .airport { font-size: 24px; font-weight: bold; color: #1e40af; }
    .arrow { color: #64748b; }
    .distance { font-size: 14px; color: #64748b; }
    .aircraft-list { margin-top: 15px; }
    .aircraft { background: white; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; }
    .aircraft-name { font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .aircraft-info { font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="route">
    <div class="route-line">
      <span class="airport">${departureCode}</span>
      <span class="arrow">→</span>
      <span class="airport">${arrivalCode}</span>
    </div>
    <div class="distance">${Math.round(distance)} NM • ${passengers} passenger${passengers > 1 ? 's' : ''}</div>
  </div>

  <div class="aircraft-list">
    ${successfulAircraft.map((result) => {
      const flightTime = result.aviapagesData?.time?.airway || 0;
      const hours = Math.floor(flightTime / 60);
      const mins = Math.round(flightTime % 60);
      const speed = result.aviapagesData?.distance?.airway && flightTime > 0
        ? Math.round((result.aviapagesData.distance.airway / (flightTime / 60)))
        : 0;

      return `
    <div class="aircraft">
      <div class="aircraft-name">${result.name}</div>
      <div class="aircraft-info">${result.category} • ${hours}h ${mins}m${speed > 0 ? ` • ${speed} kts` : ''}</div>
    </div>
      `;
    }).join('')}
  </div>

  ${successfulAircraft.length === 0 ? `
  <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 15px;">
    <strong>⚠️ No suitable aircraft found</strong>
  </div>
  ` : ''}
</body>
</html>
      `.trim();
    };

    const htmlReport = generateHTML();

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlReport,
        data: {
          distance,
          selectedAircraft: successfulAircraft.map(a => a.name),
          aviapagesResults: successfulAircraft.map(r => ({
            aircraft: r.name,
            flightTime: r.aviapagesData?.time?.airway,
            distance: r.aviapagesData?.distance?.airway,
          })),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in analyze-flight-options:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
