import { useState, useEffect } from "react";
import { Calculator, Clock, Plane, MapPin, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Airport {
  code: string;
  name: string;
  city: string;
  runway: string;
  fbo: string;
  type: string;
  lat?: number;
  lng?: number;
}

interface AircraftType {
  category: string;
  speed: number; // knots
  examples: string[];
  minRunway: number; // feet
  passengers: string;
}

const AIRCRAFT_TYPES: AircraftType[] = [
  {
    category: "Turboprop",
    speed: 300,
    examples: ["King Air 350", "TBM 940", "PC-12"],
    minRunway: 3000,
    passengers: "6-10"
  },
  {
    category: "Light Jet",
    speed: 450,
    examples: ["Citation CJ3+", "Phenom 300", "Learjet 75"],
    minRunway: 4000,
    passengers: "6-8"
  },
  {
    category: "Mid Jet",
    speed: 500,
    examples: ["Citation XLS+", "Hawker 900XP", "Learjet 60XR"],
    minRunway: 5000,
    passengers: "8-10"
  },
  {
    category: "Super Mid Jet",
    speed: 530,
    examples: ["Citation X+", "Challenger 350", "G280"],
    minRunway: 5500,
    passengers: "9-12"
  },
  {
    category: "Heavy Jet",
    speed: 550,
    examples: ["Falcon 7X", "G650", "Global 6000"],
    minRunway: 6000,
    passengers: "12-16"
  },
  {
    category: "Ultra Long Range",
    speed: 560,
    examples: ["G700", "Global 7500", "Falcon 8X"],
    minRunway: 6500,
    passengers: "14-19"
  }
];

interface FlightCalculatorProps {
  departure: Airport | null;
  arrival: Airport | null;
}

export function FlightCalculator({ departure, arrival }: FlightCalculatorProps) {
  const [distance, setDistance] = useState<number>(0);

  // Calculate great circle distance using Haversine formula
  const calculateDistance = (dep: Airport, arr: Airport): number => {
    // Use approximate coordinates for major airports
    const getCoordinates = (airport: Airport) => {
      const coords: { [key: string]: [number, number] } = {
        'KJFK': [40.6413, -73.7781], // JFK
        'KLAX': [33.9425, -118.4081], // LAX
        'KORD': [41.9742, -87.9073], // ORD
        'KATL': [33.6407, -84.4277], // ATL
        'KDFW': [32.8998, -97.0403], // DFW
        'KDEN': [39.8561, -104.6737], // DEN
        'KSFO': [37.6213, -122.3790], // SFO
        'KLAS': [36.0840, -115.1537], // LAS
        'KMIA': [25.7959, -80.2870], // MIA
        'KBOS': [42.3656, -71.0096], // BOS
        'KJFB': [40.6892, -74.1745], // Teterboro
        'KTEB': [40.8501, -74.0606], // Teterboro
        'KHPN': [41.0674, -73.7063], // Westchester
        'KPDK': [33.8756, -84.3020], // DeKalb-Peachtree
        'KVNY': [34.2198, -118.4898], // Van Nuys
        'KBUR': [34.2007, -118.3591], // Burbank
        'KSNA': [33.6757, -117.8681], // John Wayne
        'KSDL': [33.6228, -111.9105], // Scottsdale
        'KPHX': [33.4484, -112.0740], // Phoenix Sky Harbor
        'KIAH': [29.9902, -95.3368], // Houston Intercontinental
        'KMCO': [28.4312, -81.3081], // Orlando International
        'KFLL': [26.0742, -80.1506], // Fort Lauderdale
        'KTPA': [27.9755, -82.5332], // Tampa
        'KPBI': [26.6832, -80.0956], // West Palm Beach
        'KFXE': [26.1973, -80.1707], // Fort Lauderdale Executive
        'KOPF': [25.9077, -80.2784], // Miami-Opa Locka Executive
        'KTMB': [25.6479, -80.4328], // Tamiami Executive
        'KJQF': [26.1953, -80.2489], // Concord Field
        'KBCT': [26.3785, -80.1076], // Boca Raton
        'KSRQ': [27.3954, -82.5544], // Sarasota-Bradenton
        'KAPF': [26.1525, -81.7756], // Naples Municipal
        'KRSW': [26.5362, -81.7552], // Southwest Florida International
        'KPGD': [26.9202, -81.9905], // Charlotte County
        'KSUA': [26.6862, -80.0659], // Stuart Witham Field
      };
      
      return coords[airport.code] || [40.6413, -73.7781]; // Default to JFK if not found
    };

    const [lat1, lon1] = getCoordinates(dep);
    const [lat2, lon2] = getCoordinates(arr);

    const R = 3440; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  const calculateFlightTime = (distance: number, aircraftSpeed: number): string => {
    const timeInHours = distance / aircraftSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const checkRunwayCompatibility = (runway: string, minRunway: number) => {
    const runwayLength = parseInt(runway.replace(/[^\d]/g, ""));
    return runwayLength >= minRunway;
  };

  useEffect(() => {
    if (departure && arrival) {
      const dist = calculateDistance(departure, arrival);
      setDistance(dist);
    } else {
      setDistance(0);
    }
  }, [departure, arrival]);

  return (
    <Card className="shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Flight Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Flight Route */}
        {departure && arrival && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg bg-gradient-sky p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{departure.code}</div>
                  <div className="text-xs text-muted-foreground">{departure.city}</div>
                </div>
                <Route className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{arrival.code}</div>
                  <div className="text-xs text-muted-foreground">{arrival.city}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="text-xl font-bold text-primary">{distance} NM</div>
              </div>
            </div>

            {/* Flight Times for All Aircraft Types */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Estimated Flight Times by Aircraft Type
              </h3>
              
              <div className="grid gap-3">
                {AIRCRAFT_TYPES.map((aircraft) => {
                  const flightTime = calculateFlightTime(distance, aircraft.speed);
                  const departureCompatible = checkRunwayCompatibility(departure.runway, aircraft.minRunway);
                  const arrivalCompatible = checkRunwayCompatibility(arrival.runway, aircraft.minRunway);
                  const isCompatible = departureCompatible && arrivalCompatible;

                  return (
                    <div 
                      key={aircraft.category} 
                      className={`rounded-lg border p-4 transition-colors ${
                        isCompatible 
                          ? "border-border bg-card hover:bg-secondary/30" 
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{aircraft.category}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {aircraft.passengers} passengers
                            </Badge>
                            {!isCompatible && (
                              <Badge variant="destructive" className="text-xs">
                                Runway Incompatible
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Cruise Speed:</span>
                              <div className="font-medium">{aircraft.speed} kts</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Min Runway:</span>
                              <div className="font-medium">{aircraft.minRunway.toLocaleString()} ft</div>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground text-sm">Popular Aircraft:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {aircraft.examples.map((example) => (
                                <Badge key={example} variant="secondary" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Flight Time</div>
                          <div className={`text-2xl font-bold ${isCompatible ? "text-accent" : "text-muted-foreground"}`}>
                            {flightTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Runway Compatibility Summary */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Runway Compatibility
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{departure.code}:</span>
                    <div className="font-medium">{departure.runway}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{arrival.code}:</span>
                    <div className="font-medium">{arrival.runway}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(!departure || !arrival) && (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select departure and arrival airports to calculate flight details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}