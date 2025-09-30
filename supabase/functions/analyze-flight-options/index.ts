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

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3440.065; // Earth's radius in nautical miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return Math.round(R * c);
    };

    const distance = calculateDistance(
      departureAirport.latitude,
      departureAirport.longitude,
      arrivalAirport.latitude,
      arrivalAirport.longitude
    );

    // Aircraft database with comprehensive specs
    const aircraftDatabase = [
      {
        name: "Citation CJ3+",
        category: "Light Jet",
        speed: 464,
        minRunway: 4000,
        maxPassengers: 8,
        maxRange: 2000,
        hourlyRate: 8100,
        emptyWeight: 11500,
        maxTakeoffWeight: 17110,
        maxPayload: 2200,
        fuelCapacity: 5200,
        fuelConsumption: 230,
      },
      {
        name: "Citation CJ4",
        category: "Super Light Jet",
        speed: 451,
        minRunway: 4500,
        maxPassengers: 9,
        maxRange: 2400,
        hourlyRate: 9200,
        emptyWeight: 13000,
        maxTakeoffWeight: 19500,
        maxPayload: 2600,
        fuelCapacity: 6800,
        fuelConsumption: 270,
      },
      {
        name: "Citation X+",
        category: "Super Mid Jet",
        speed: 700,
        minRunway: 5250,
        maxPassengers: 10,
        maxRange: 3460,
        hourlyRate: 12500,
        emptyWeight: 22700,
        maxTakeoffWeight: 36600,
        maxPayload: 3200,
        fuelCapacity: 13900,
        fuelConsumption: 400,
      },
      {
        name: "Gulfstream G280",
        category: "Super Mid Jet",
        speed: 652,
        minRunway: 4750,
        maxPassengers: 10,
        maxRange: 3600,
        hourlyRate: 13500,
        emptyWeight: 21450,
        maxTakeoffWeight: 39600,
        maxPayload: 4100,
        fuelCapacity: 15620,
        fuelConsumption: 380,
      },
      {
        name: "Gulfstream G650",
        category: "Heavy Jet",
        speed: 652,
        minRunway: 6000,
        maxPassengers: 16,
        maxRange: 7000,
        hourlyRate: 18500,
        emptyWeight: 53900,
        maxTakeoffWeight: 99600,
        maxPayload: 7500,
        fuelCapacity: 44200,
        fuelConsumption: 550,
      },
      {
        name: "Phenom 300",
        category: "Light Jet",
        speed: 464,
        minRunway: 4000,
        maxPassengers: 8,
        maxRange: 2000,
        hourlyRate: 8100,
        emptyWeight: 11500,
        maxTakeoffWeight: 17110,
        maxPayload: 2200,
        fuelCapacity: 5200,
        fuelConsumption: 230,
      },
    ];

    // Check runway compatibility
    const checkRunwayCompatibility = (runway: number | string | undefined, minRunway: number): boolean => {
      if (!runway) return false;
      const runwayLength = typeof runway === 'number' ? runway : parseInt(String(runway).replace(/[^\d]/g, ""));
      return !isNaN(runwayLength) && runwayLength >= minRunway;
    };

    // Filter capable aircraft
    const capableAircraft = aircraftDatabase.filter(aircraft => {
      const depRunway = departureAirport.runway || departureAirport.runwayLength;
      const arrRunway = arrivalAirport.runway || arrivalAirport.runwayLength;
      
      const departureOk = checkRunwayCompatibility(depRunway, aircraft.minRunway);
      const arrivalOk = checkRunwayCompatibility(arrRunway, aircraft.minRunway);
      
      const flightTimeHours = distance / aircraft.speed;
      const fuelNeeded = flightTimeHours * aircraft.fuelConsumption * 1.15;
      const passengerWeight = passengers * 230;
      const totalWeight = aircraft.emptyWeight + passengerWeight + fuelNeeded;
      
      const rangeOk = distance <= aircraft.maxRange * 0.85;
      const passengersOk = passengers <= aircraft.maxPassengers;
      const weightOk = totalWeight <= aircraft.maxTakeoffWeight;
      const payloadOk = passengerWeight <= aircraft.maxPayload;
      const fuelOk = fuelNeeded <= aircraft.fuelCapacity;
      
      return departureOk && arrivalOk && rangeOk && passengersOk && weightOk && payloadOk && fuelOk;
    });

    // Take top 3-4 aircraft
    const selectedAircraft = capableAircraft.slice(0, 4);

    // Call Aviapages for each aircraft
    const aviapagesResults = await Promise.all(
      selectedAircraft.map(async (aircraft) => {
        try {
          const response = await fetch(
            `https://dir.aviapages.com/api/flight_time/?departure=${departureCode}&arrival=${arrivalCode}&aircraft=${encodeURIComponent(`${aircraft.category}-${aircraft.name}`)}&passengers=${passengers}`,
            {
              headers: {
                'Authorization': `Token ${AVIAPAGES_API_TOKEN}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return { aircraft, aviapagesData: data, success: true };
          } else {
            return { aircraft, success: false, error: response.statusText };
          }
        } catch (error) {
          return { aircraft, success: false, error: error.message };
        }
      })
    );

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
    <div class="distance">${distance} NM • ${passengers} passenger${passengers > 1 ? 's' : ''}</div>
  </div>

  <div class="aircraft-list">
    ${aviapagesResults.map((result, index) => {
      const aircraft = result.aircraft;
      const flightTime = result.success && result.aviapagesData?.time?.airway 
        ? Math.round(result.aviapagesData.time.airway) 
        : Math.round((distance / aircraft.speed) * 60);
      const hours = Math.floor(flightTime / 60);
      const mins = flightTime % 60;

      return `
    <div class="aircraft">
      <div class="aircraft-name">${aircraft.name}</div>
      <div class="aircraft-info">${aircraft.category} • ${hours}h ${mins}m • ${aircraft.speed} kts</div>
    </div>
      `;
    }).join('')}
  </div>

  ${selectedAircraft.length === 0 ? `
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
          selectedAircraft: selectedAircraft.map(a => a.name),
          aviapagesResults: aviapagesResults.map(r => ({
            aircraft: r.aircraft.name,
            success: r.success,
            flightTime: r.success ? r.aviapagesData?.time?.airway : null,
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
