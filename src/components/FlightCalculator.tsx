import { useState, useEffect } from "react";
import { Calculator, Clock, Plane, MapPin, Route, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateFlightTimeWithAviapages } from "@/lib/aviapages";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CHARTER_AIRCRAFT } from "@/data/aircraftDatabase";

interface Airport {
  code: string;
  name: string;
  city: string;
  state?: string;
  runway: string | number;
  fbo: string;
  type: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  icao?: string;
}

interface AircraftType {
  name: string;
  category: string;
  manufacturer: string;
  speed: number;
  range: number;
  passengers: number;
  minRunway: number;
  hourlyRate: number;
}

// Category hierarchy from smallest to largest
const CATEGORY_HIERARCHY = [
  'Light Jet',
  'Super Light Jet', 
  'Mid Jet',
  'Super Mid Jet',
  'Heavy Jet',
  'Ultra Long Range'
];

interface AviapagesFlightResult {
  aircraft: string;
  category: string;
  flightTime?: number;
  distance?: number;
  success: boolean;
  error?: string;
}

// Using the comprehensive charter aircraft database

interface FlightCalculatorProps {
  departure: string;
  arrival: string;
  departureAirport?: any;
  arrivalAirport?: any;
  initialPassengers?: number;
}

export function FlightCalculator({ departure, arrival, departureAirport: propDepartureAirport, arrivalAirport: propArrivalAirport, initialPassengers }: FlightCalculatorProps) {
  const [distance, setDistance] = useState<number>(0);
  const [passengers, setPassengers] = useState<number>(initialPassengers || 1);
  const [isLoadingAviapages, setIsLoadingAviapages] = useState(false);
  const [recommendedAircraft, setRecommendedAircraft] = useState<AviapagesFlightResult[]>([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnAircraft, setReturnAircraft] = useState<AviapagesFlightResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const parseAirportString = (airportString: string): Airport | null => {
    if (!airportString) return null;
    
    const parts = airportString.split(' - ');
    if (parts.length < 2) return null;
    
    const code = parts[0].trim();
    const rest = parts[1];
    
    const nameAndCity = rest.split(', ');
    const name = nameAndCity[0] || '';
    const city = nameAndCity.slice(1).join(', ') || '';
    
    return {
      code,
      name,
      city,
      runway: "8000 ft",
      fbo: "Various",
      type: "Public"
    };
  };

  // Use prop airports if available (they have coords), otherwise parse from string
  const departureAirport = propDepartureAirport || parseAirportString(departure);
  const arrivalAirport = propArrivalAirport || parseAirportString(arrival);

  const getCoordinates = (airport: Airport) => {
    if (airport.latitude && airport.longitude) {
      return [airport.latitude, airport.longitude];
    }
    
    const coords: { [key: string]: [number, number] } = {
      'KJFK': [40.6413, -73.7781], 'JFK': [40.6413, -73.7781],
      'KLAX': [33.9425, -118.4081], 'LAX': [33.9425, -118.4081],
      'KLAS': [36.0840, -115.1537], 'LAS': [36.0840, -115.1537],
      'KADS': [32.9686, -96.8364], 'ADS': [32.9686, -96.8364],
      'KTEB': [40.8501, -74.0606], 'TEB': [40.8501, -74.0606],
    };
      
    return coords[airport.code] || [40.6413, -73.7781];
  };

  const calculateDistance = (dep: Airport, arr: Airport): number => {
    const [lat1, lon1] = getCoordinates(dep);
    const [lat2, lon2] = getCoordinates(arr);

    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const checkRunwayCompatibility = (runway: string | number | undefined, minRunway: number) => {
    if (!runway) return false; // If runway info is missing, can't confirm compatibility
    
    let runwayLength: number;
    
    if (typeof runway === 'number') {
      runwayLength = runway;
    } else {
      runwayLength = parseInt(runway.replace(/[^\d]/g, ""));
    }
    
    return !isNaN(runwayLength) && runwayLength >= minRunway;
  };

  // Calculate distance when airports change
  useEffect(() => {
    if (departureAirport && arrivalAirport) {
      const dist = calculateDistance(departureAirport, arrivalAirport);
      console.log('Distance calculated:', dist, 'NM');
      setDistance(dist);
    } else {
      setDistance(0);
    }
  }, [departureAirport, arrivalAirport]);

  // Find minimum capable category and one above it, then get 2-3 popular models
  const getRecommendedAircraftModels = () => {
    if (!departureAirport || !arrivalAirport || distance === 0) return [];
    
    const capableAircraft = CHARTER_AIRCRAFT.filter(aircraft => {
      const depRunway = departureAirport.runway || departureAirport.runwayLength;
      const arrRunway = arrivalAirport.runway || arrivalAirport.runwayLength;
      const departureCompatible = checkRunwayCompatibility(depRunway, aircraft.minRunway);
      const arrivalCompatible = checkRunwayCompatibility(arrRunway, aircraft.minRunway);
      
      const passengerCapable = passengers <= aircraft.passengers;
      
      // Calculate payload (passengers + baggage)
      const passengerWeight = passengers * 180;
      const baggageWeight = passengers * 75;
      const totalPayload = passengerWeight + baggageWeight;
      const payloadCapable = totalPayload <= aircraft.maxPayload;
      
      // Calculate maximum fuel we can carry given the payload
      const maxFuelWithPayload = Math.min(
        aircraft.fuelCapacity,
        aircraft.maxTakeoffWeight - aircraft.emptyWeight - totalPayload
      );
      
      // Calculate fuel needed for this trip
      const flightTimeHours = distance / aircraft.speed;
      const cruiseFuelLbs = flightTimeHours * aircraft.fuelConsumption;
      const taxiFuel = (15 / 60) * aircraft.fuelConsumption * 0.5;
      const climbDescentFuel = cruiseFuelLbs * 0.2;
      const reserveFuel = (45 / 60) * aircraft.fuelConsumption;
      const alternateFuel = (30 / 60) * aircraft.fuelConsumption;
      
      const totalFuelNeeded = cruiseFuelLbs + taxiFuel + climbDescentFuel + reserveFuel + alternateFuel;
      
      // Check if we can carry enough fuel for this trip
      const fuelCapacityOk = totalFuelNeeded <= maxFuelWithPayload;
      
      // Calculate effective range with this payload
      // The stated range assumes full fuel tanks. Scale proportionally based on fuel we can actually carry.
      const fuelRatio = maxFuelWithPayload / aircraft.fuelCapacity;
      const effectiveRangeNM = aircraft.range * fuelRatio * 0.85; // 85% safety margin for reserves
      const rangeCapable = distance <= effectiveRangeNM;
      
      if (aircraft.name === "Phenom 100" || aircraft.name === "Citation M2") {
        console.log(`${aircraft.name} range check:`, {
          distance,
          maxFuelWithPayload,
          fuelCapacity: aircraft.fuelCapacity,
          fuelRatio,
          statedRange: aircraft.range,
          effectiveRangeNM,
          rangeCapable,
          totalPayload,
          passengers
        });
      }
      
      // Final weight check
      const totalWeight = aircraft.emptyWeight + totalPayload + totalFuelNeeded;
      const weightCapable = totalWeight <= aircraft.maxTakeoffWeight;
      
      const outboundCapable = departureCompatible && arrivalCompatible && rangeCapable && 
             weightCapable && payloadCapable && fuelCapacityOk && passengerCapable;
      
      // For round trips, also check the return leg
      if (isRoundTrip) {
        // Return leg has same distance and requirements, just reverse runways
        // Both runways already checked, so just need to confirm range works both ways
        return outboundCapable;
      }
      
      return outboundCapable;
    });

    if (capableAircraft.length === 0) return [];

    // Find minimum capable category
    let minCategory = null;
    for (const cat of CATEGORY_HIERARCHY) {
      if (capableAircraft.some(a => a.category === cat)) {
        minCategory = cat;
        break;
      }
    }

    if (!minCategory) return [];

    // Get this category and one above it
    const minIndex = CATEGORY_HIERARCHY.indexOf(minCategory);
    const categoriesToShow = [CATEGORY_HIERARCHY[minIndex]];
    if (minIndex + 1 < CATEGORY_HIERARCHY.length) {
      categoriesToShow.push(CATEGORY_HIERARCHY[minIndex + 1]);
    }

    // Get 2-3 popular models from each category
    const popularModels: typeof CHARTER_AIRCRAFT = [];
    
    for (const category of categoriesToShow) {
      const aircraftInCategory = CHARTER_AIRCRAFT.filter(a => a.category === category);
      // Sort by popularity (using hourly rate as proxy for popularity/demand)
      const sorted = aircraftInCategory.sort((a, b) => a.hourlyRate - b.hourlyRate);
      popularModels.push(...sorted.slice(0, 3));
    }

    return popularModels;
  };

  // Auto-calculate recommendations when distance/passengers change
  const handleCalculate = async () => {
    if (!departureAirport || !arrivalAirport || distance === 0) {
      console.log('Cannot calculate: missing data', { departureAirport: !!departureAirport, arrivalAirport: !!arrivalAirport, distance });
      toast.error("Please ensure both airports are selected");
      return;
    }

    const models = getRecommendedAircraftModels();
    console.log('Recommended models:', models.map(m => m.name));
    
    if (models.length === 0) {
      console.log('No capable aircraft found');
      setRecommendedAircraft([]);
      setReturnAircraft([]);
      setHasCalculated(true);
      return;
    }

    setIsLoadingAviapages(true);
    setHasCalculated(false);
    
    const results = await Promise.all(
      models.map(async (aircraft) => {
        try {
          const result = await calculateFlightTimeWithAviapages(
            departureAirport.code,
            arrivalAirport.code,
            aircraft.name,
            passengers
          );

          console.log(`Flight time result for ${aircraft.name}:`, result);

          return {
            aircraft: aircraft.name,
            category: aircraft.category,
            flightTime: result.success ? result.flightTime?.time?.airway : undefined,
            distance: result.success ? result.flightTime?.distance?.airway : undefined,
            success: result.success,
            error: result.error
          };
        } catch (error) {
          console.error(`Error for ${aircraft.name}:`, error);
          return {
            aircraft: aircraft.name,
            category: aircraft.category,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    console.log('All results:', results);
    setRecommendedAircraft(results);
    
    // If round trip, also calculate return leg
    if (isRoundTrip) {
      const returnResults = await Promise.all(
        models.map(async (aircraft) => {
          try {
            const result = await calculateFlightTimeWithAviapages(
              arrivalAirport.code,
              departureAirport.code,
              aircraft.name,
              passengers
            );

            console.log(`Return flight time result for ${aircraft.name}:`, result);

            return {
              aircraft: aircraft.name,
              category: aircraft.category,
              flightTime: result.success ? result.flightTime?.time?.airway : undefined,
              distance: result.success ? result.flightTime?.distance?.airway : undefined,
              success: result.success,
              error: result.error
            };
          } catch (error) {
            console.error(`Return error for ${aircraft.name}:`, error);
            return {
              aircraft: aircraft.name,
              category: aircraft.category,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      setReturnAircraft(returnResults);
    } else {
      setReturnAircraft([]);
    }
    
    setIsLoadingAviapages(false);
    setHasCalculated(true);
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
        {/* Number of Passengers */}
        <div className="space-y-3">
          <Label htmlFor="passengers" className="text-sm font-medium flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Number of Passengers
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="passengers"
              type="number"
              min="1"
              max="20"
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-24 bg-card shadow-card-custom"
            />
            <Button
              variant={isRoundTrip ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRoundTrip(!isRoundTrip)}
              className="gap-2"
            >
              <Route className="h-4 w-4" />
              {isRoundTrip ? "Round Trip" : "One Way"}
            </Button>
            <Button
              onClick={handleCalculate}
              disabled={isLoadingAviapages || !departureAirport || !arrivalAirport}
              className="ml-auto gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calculate Flight Options
            </Button>
          </div>
        </div>

        {/* Flight Route */}
        {departureAirport && arrivalAirport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg bg-gradient-sky p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{departureAirport.code}</div>
                  <div className="text-xs text-muted-foreground">{departureAirport.city}</div>
                </div>
                <Route className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{arrivalAirport.code}</div>
                  <div className="text-xs text-muted-foreground">{arrivalAirport.city}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="text-xl font-bold text-primary">{distance} NM</div>
                {hasCalculated && recommendedAircraft.length > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground mt-2">Avg Flight Time</div>
                    <div className="text-base font-semibold text-primary">
                      {(() => {
                        const validFlights = recommendedAircraft.filter(ac => ac.success && ac.flightTime);
                        if (validFlights.length === 0) return "N/A";
                        
                        const avgOutbound = validFlights.reduce((sum, ac) => sum + (ac.flightTime || 0), 0) / validFlights.length;
                        const outboundHours = Math.floor(avgOutbound / 60);
                        const outboundMins = Math.round(avgOutbound % 60);
                        
                        if (!isRoundTrip) {
                          return `${outboundHours}h ${outboundMins}m`;
                        }
                        
                        const validReturn = returnAircraft.filter(ac => ac.success && ac.flightTime);
                        if (validReturn.length === 0) return `${outboundHours}h ${outboundMins}m (outbound)`;
                        
                        const avgReturn = validReturn.reduce((sum, ac) => sum + (ac.flightTime || 0), 0) / validReturn.length;
                        const returnHours = Math.floor(avgReturn / 60);
                        const returnMins = Math.round(avgReturn % 60);
                        
                        return (
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">Out: {outboundHours}h {outboundMins}m</div>
                            <div className="text-xs text-muted-foreground">Return: {returnHours}h {returnMins}m</div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recommended Aircraft */}
            {isLoadingAviapages ? (
              <div className="rounded-lg bg-secondary/20 border border-secondary p-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Calculating flight times...</p>
              </div>
            ) : recommendedAircraft.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Recommended Aircraft</h3>
                </div>
                
                {/* Group aircraft by category */}
                {(() => {
                  const grouped = recommendedAircraft.reduce((acc, aircraft) => {
                    if (!acc[aircraft.category]) {
                      acc[aircraft.category] = [];
                    }
                    acc[aircraft.category].push(aircraft);
                    return acc;
                  }, {} as Record<string, AviapagesFlightResult[]>);

                  return Object.entries(grouped).map(([category, aircraft]) => (
                    <div key={category} className="space-y-2">
                      <Badge variant="outline" className="mb-2">{category}</Badge>
                      <div className="grid gap-3">
                        {aircraft.map((ac) => {
                          const returnAc = returnAircraft.find(r => r.aircraft === ac.aircraft);
                          return (
                            <div 
                              key={ac.aircraft}
                              className="rounded-lg bg-card border border-border p-4 hover:border-primary transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-primary">{ac.aircraft}</div>
                                  {ac.success && ac.flightTime ? (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <div>
                                        <span className="font-medium">Outbound:</span>{" "}
                                        <span className="font-bold text-primary">
                                          {Math.floor(ac.flightTime / 60)}h {Math.round(ac.flightTime % 60)}m
                                        </span>
                                      </div>
                                      {isRoundTrip && returnAc?.success && returnAc.flightTime && (
                                        <div>
                                          <span className="font-medium">Return:</span>{" "}
                                          <span className="font-bold text-primary">
                                            {Math.floor(returnAc.flightTime / 60)}h {Math.round(returnAc.flightTime % 60)}m
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-destructive mt-1">
                                      {ac.error || "Flight time unavailable"}
                                    </div>
                                  )}
                                </div>
                                {ac.success && (
                                  <Clock className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : hasCalculated && distance > 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No suitable aircraft found for this route with {passengers} passenger{passengers > 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}