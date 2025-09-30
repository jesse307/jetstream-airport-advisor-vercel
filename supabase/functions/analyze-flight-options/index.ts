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

    // Generate HTML report
    const generateHTML = () => {
      const depRunway = departureAirport.runway || departureAirport.runwayLength || 'N/A';
      const arrRunway = arrivalAirport.runway || arrivalAirport.runwayLength || 'N/A';

      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
    .section h2 { color: #1e40af; margin-top: 0; font-size: 20px; }
    .route-info { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
    .airport { flex: 1; text-align: center; }
    .airport-code { font-size: 32px; font-weight: bold; color: #1e40af; }
    .airport-name { font-size: 14px; color: #64748b; }
    .route-arrow { font-size: 24px; color: #3b82f6; padding: 0 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .info-item { background: white; padding: 15px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .info-value { font-size: 18px; font-weight: bold; color: #1e40af; margin-top: 5px; }
    .aircraft-card { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .aircraft-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
    .aircraft-name { font-size: 20px; font-weight: bold; color: #1e40af; }
    .aircraft-category { background: #dbeafe; color: #1e40af; padding: 5px 12px; border-radius: 12px; font-size: 12px; }
    .specs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
    .spec-item { text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px; }
    .spec-label { font-size: 11px; color: #64748b; }
    .spec-value { font-size: 16px; font-weight: bold; color: #334155; margin-top: 3px; }
    .aviapages-data { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 15px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; color: #64748b; padding: 20px; font-size: 12px; margin-top: 30px; border-top: 2px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Flight Analysis Report</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Comprehensive route and aircraft analysis</p>
  </div>

  <div class="route-info">
    <div class="airport">
      <div class="airport-code">${departureCode}</div>
      <div class="airport-name">${departureAirport.name}</div>
      <div class="airport-name">${departureAirport.city}</div>
    </div>
    <div class="route-arrow">→</div>
    <div class="airport">
      <div class="airport-code">${arrivalCode}</div>
      <div class="airport-name">${arrivalAirport.name}</div>
      <div class="airport-name">${arrivalAirport.city}</div>
    </div>
  </div>

  <div class="section">
    <h2>Route Analysis</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Distance</div>
        <div class="info-value">${distance} NM</div>
      </div>
      <div class="info-item">
        <div class="info-label">Passengers</div>
        <div class="info-value">${passengers}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Departure Runway</div>
        <div class="info-value">${depRunway}'</div>
      </div>
      <div class="info-item">
        <div class="info-label">Arrival Runway</div>
        <div class="info-value">${arrRunway}'</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Recommended Aircraft Options</h2>
    <p style="color: #64748b; margin-bottom: 20px;">Based on route requirements, passenger count, and runway compatibility</p>
    
    ${aviapagesResults.map((result, index) => {
      const aircraft = result.aircraft;
      const flightTime = result.success && result.aviapagesData?.time?.airway 
        ? Math.round(result.aviapagesData.time.airway) 
        : Math.round((distance / aircraft.speed) * 60);

      return `
    <div class="aircraft-card">
      <div class="aircraft-header">
        <div>
          <div class="aircraft-name">${index + 1}. ${aircraft.name}</div>
          <div style="font-size: 14px; color: #64748b; margin-top: 5px;">${aircraft.category}</div>
        </div>
        <div class="aircraft-category">Option ${index + 1}</div>
      </div>
      
      <div class="specs-grid">
        <div class="spec-item">
          <div class="spec-label">Flight Time</div>
          <div class="spec-value">${Math.floor(flightTime / 60)}h ${flightTime % 60}m</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">Cruise Speed</div>
          <div class="spec-value">${aircraft.speed} kts</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">Max Range</div>
          <div class="spec-value">${aircraft.maxRange} NM</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">Min Runway</div>
          <div class="spec-value">${aircraft.minRunway}'</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">Max Passengers</div>
          <div class="spec-value">${aircraft.maxPassengers}</div>
        </div>
      </div>

      ${result.success && result.aviapagesData ? `
      <div class="aviapages-data">
        <strong>✓ Verified Flight Data</strong>
        <div style="font-size: 13px; color: #334155; margin-top: 8px;">
          Actual distance: ${result.aviapagesData.distance?.great_circle ? Math.round(result.aviapagesData.distance.great_circle * 0.539957) : distance} NM
        </div>
      </div>
      ` : result.error ? `
      <div class="warning">
        ⚠️ Using estimated calculations (Aviapages unavailable)
      </div>
      ` : ''}
    </div>
      `;
    }).join('')}
  </div>

  ${selectedAircraft.length === 0 ? `
  <div class="warning">
    <strong>⚠️ No Suitable Aircraft Found</strong>
    <p style="margin: 10px 0 0 0;">The route requirements exceed available aircraft capabilities or runway limitations. Please contact us for alternative solutions.</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>This is an automated analysis</strong></p>
    <p>Prices are estimates and subject to change. Contact us for accurate quotes and availability.</p>
    <p style="margin-top: 15px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
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
