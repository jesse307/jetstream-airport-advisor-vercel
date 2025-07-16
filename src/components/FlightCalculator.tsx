import { useState, useEffect } from "react";
import { Calculator, Clock, Plane, MapPin, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedAircraft, setSelectedAircraft] = useState<string>("Light Jet");
  const [distance, setDistance] = useState<number>(0);
  const [flightTime, setFlightTime] = useState<string>("");

  // Simple distance calculation (in reality, you'd use great circle distance)
  const calculateDistance = (dep: Airport, arr: Airport): number => {
    // Mock calculation - in real app, use lat/lng coordinates
    const hash1 = dep.code.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const hash2 = arr.code.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.abs(hash1 - hash2) * 10 + 200; // Mock distance in nautical miles
  };

  const calculateFlightTime = (distance: number, aircraftSpeed: number): string => {
    const timeInHours = distance / aircraftSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  useEffect(() => {
    if (departure && arrival) {
      const dist = calculateDistance(departure, arrival);
      setDistance(dist);
      
      const aircraft = AIRCRAFT_TYPES.find(a => a.category === selectedAircraft);
      if (aircraft) {
        setFlightTime(calculateFlightTime(dist, aircraft.speed));
      }
    } else {
      setDistance(0);
      setFlightTime("");
    }
  }, [departure, arrival, selectedAircraft]);

  const selectedAircraftData = AIRCRAFT_TYPES.find(a => a.category === selectedAircraft);

  const checkRunwayCompatibility = (runway: string, minRunway: number) => {
    const runwayLength = parseInt(runway.replace(/[^\d]/g, ''));
    return runwayLength >= minRunway;
  };

  return (
    <Card className="shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Flight Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Aircraft Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Aircraft Category</label>
          <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AIRCRAFT_TYPES.map((aircraft) => (
                <SelectItem key={aircraft.category} value={aircraft.category}>
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {aircraft.category}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Flight Route */}
        {departure && arrival && (
          <div className="space-y-4">
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

            {/* Flight Time */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                <span className="font-medium">Estimated Flight Time</span>
              </div>
              <div className="text-xl font-bold text-accent">{flightTime}</div>
            </div>

            {/* Aircraft Details */}
            {selectedAircraftData && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {selectedAircraftData.category}
                  </h3>
                  <Badge variant="outline">{selectedAircraftData.passengers} passengers</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cruise Speed:</span>
                    <div className="font-medium">{selectedAircraftData.speed} kts</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Runway:</span>
                    <div className="font-medium">{selectedAircraftData.minRunway.toLocaleString()} ft</div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Popular Aircraft:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAircraftData.examples.map((aircraft) => (
                      <Badge key={aircraft} variant="secondary" className="text-xs">
                        {aircraft}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Runway Compatibility */}
                {departure && arrival && selectedAircraftData && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <h4 className="text-sm font-medium">Runway Compatibility</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{departure.code}</span>
                        <Badge 
                          variant={checkRunwayCompatibility(departure.runway, selectedAircraftData.minRunway) ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {departure.runway}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{arrival.code}</span>
                        <Badge 
                          variant={checkRunwayCompatibility(arrival.runway, selectedAircraftData.minRunway) ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {arrival.runway}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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