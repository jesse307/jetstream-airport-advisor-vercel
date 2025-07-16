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

  // Simple distance calculation (in reality, you'd use great circle distance)
  const calculateDistance = (dep: Airport, arr: Airport): number => {
    // Mock calculation - in real app, use lat/lng coordinates
    const hash1 = dep.code.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const hash2 = arr.code.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.abs(hash1 - hash2) * 10 + 200; // Mock distance in nautical miles
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