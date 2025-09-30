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
  category: string;
  speed: number;
  examples: string[];
  minRunway: number;
  passengers: string;
  hourlyRate: number;
  maxRange: number;
  maxPayload: number;
  fuelCapacity: number;
  fuelConsumption: number;
  emptyWeight: number;
  maxTakeoffWeight: number;
}

const AIRCRAFT_TYPES: AircraftType[] = [
  {
    category: "Very Light Jet",
    speed: 340,
    examples: ["Eclipse 550", "Phenom 100", "Citation M2"],
    minRunway: 3200,
    passengers: "4-6",
    hourlyRate: 5500,
    maxRange: 1200,
    maxPayload: 1800,
    fuelCapacity: 3500,
    fuelConsumption: 180,
    emptyWeight: 8500,
    maxTakeoffWeight: 12500
  },
  {
    category: "Turboprop",
    speed: 280,
    examples: ["King Air 350", "TBM 940", "PC-12"],
    minRunway: 3000,
    passengers: "6-10",
    hourlyRate: 6500,
    maxRange: 1200,
    maxPayload: 2500,
    fuelCapacity: 2100,
    fuelConsumption: 280,
    emptyWeight: 9000,
    maxTakeoffWeight: 15000
  },
  {
    category: "Light Jet", 
    speed: 464,
    examples: ["Citation CJ3+", "Phenom 300", "Learjet 75"],
    minRunway: 4000,
    passengers: "6-8",
    hourlyRate: 8100,
    maxRange: 2000,
    maxPayload: 2200,
    fuelCapacity: 5200,
    fuelConsumption: 230,
    emptyWeight: 11500,
    maxTakeoffWeight: 17110
  },
  {
    category: "Super Light Jet",
    speed: 451,
    examples: ["Citation CJ4", "Phenom 300E", "Learjet 45XR"],
    minRunway: 4500,
    passengers: "7-9",
    hourlyRate: 9200,
    maxRange: 2400,
    maxPayload: 2600,
    fuelCapacity: 6800,
    fuelConsumption: 270,
    emptyWeight: 13000,
    maxTakeoffWeight: 19500
  },
  {
    category: "Mid Jet",
    speed: 460,
    examples: ["Citation XLS+", "Hawker 900XP", "Learjet 60XR"],
    minRunway: 5000,
    passengers: "8-10",
    hourlyRate: 8600,
    maxRange: 2100,
    maxPayload: 2800,
    fuelCapacity: 8500,
    fuelConsumption: 310,
    emptyWeight: 16000,
    maxTakeoffWeight: 23000
  },
  {
    category: "Super Mid Jet",
    speed: 525,
    examples: ["Citation X+", "Challenger 350", "G280"],
    minRunway: 5500,
    passengers: "9-12",
    hourlyRate: 11000,
    maxRange: 3200,
    maxPayload: 3500,
    fuelCapacity: 12000,
    fuelConsumption: 350,
    emptyWeight: 18500,
    maxTakeoffWeight: 28100
  },
  {
    category: "Heavy Jet",
    speed: 516,
    examples: ["Falcon 7X", "G650", "Global 6000"],
    minRunway: 6000,
    passengers: "12-16",
    hourlyRate: 13000,
    maxRange: 5500,
    maxPayload: 4200,
    fuelCapacity: 24000,
    fuelConsumption: 450,
    emptyWeight: 25000,
    maxTakeoffWeight: 42000
  },
  {
    category: "Ultra Long Range",
    speed: 520,
    examples: ["G700", "Global 7500", "Falcon 8X"],
    minRunway: 6500,
    passengers: "14-19",
    hourlyRate: 18000,
    maxRange: 7700,
    maxPayload: 5000,
    fuelCapacity: 32000,
    fuelConsumption: 500,
    emptyWeight: 35000,
    maxTakeoffWeight: 54000
  }
];

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
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [aviapagesResult, setAviapagesResult] = useState<any>(null);
  const [isLoadingAviapages, setIsLoadingAviapages] = useState(false);

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

  const getCapableAircraft = () => {
    if (!departureAirport || !arrivalAirport || distance === 0) return [];
    
    return AIRCRAFT_TYPES.filter(aircraft => {
      // 1. Runway compatibility (check both runway and runwayLength properties)
      const depRunway = departureAirport.runway || departureAirport.runwayLength;
      const arrRunway = arrivalAirport.runway || arrivalAirport.runwayLength;
      const departureCompatible = checkRunwayCompatibility(depRunway, aircraft.minRunway);
      const arrivalCompatible = checkRunwayCompatibility(arrRunway, aircraft.minRunway);
      
      // 2. Calculate required fuel for this trip
      const flightTimeHours = distance / aircraft.speed;
      const fuelNeededLbs = flightTimeHours * aircraft.fuelConsumption;
      const fuelWithReserve = fuelNeededLbs * 1.15; // 15% reserve
      
      // 3. Check if aircraft can carry passengers + fuel
      const passengerWeight = passengers * 230;
      const totalWeight = aircraft.emptyWeight + passengerWeight + fuelWithReserve;
      const weightCapable = totalWeight <= aircraft.maxTakeoffWeight;
      
      // 4. Check payload capacity
      const payloadCapable = passengerWeight <= aircraft.maxPayload;
      
      // 5. Check fuel capacity
      const fuelCapacityOk = fuelWithReserve <= aircraft.fuelCapacity;
      
      // 6. Check practical range (85% of theoretical max)
      const actualRange = (aircraft.fuelCapacity / aircraft.fuelConsumption) * aircraft.speed;
      const rangeCapable = distance <= actualRange * 0.85;
      
      // 7. Check passenger capacity
      const maxPassengers = parseInt(aircraft.passengers.split('-')[1]);
      const passengerCapable = passengers <= maxPassengers;
      
      return departureCompatible && arrivalCompatible && rangeCapable && 
             weightCapable && payloadCapable && fuelCapacityOk && passengerCapable;
    });
  };

  useEffect(() => {
    if (departureAirport && arrivalAirport) {
      const dist = calculateDistance(departureAirport, arrivalAirport);
      setDistance(dist);
    } else {
      setDistance(0);
    }
  }, [departureAirport, arrivalAirport]);

  // Manual calculation with button click
  const handleCalculate = async () => {
    if (!departureAirport || !arrivalAirport || !selectedAircraft) return;
    
    // First, do comprehensive local feasibility checks to avoid unnecessary API calls
    const aircraftCategory = selectedAircraft.split('-')[0];
    const aircraft = AIRCRAFT_TYPES.find(a => a.category === aircraftCategory);
    
    if (!aircraft) return;
    
    // 1. Runway compatibility check
    const depRunway = departureAirport.runway || departureAirport.runwayLength;
    const arrRunway = arrivalAirport.runway || arrivalAirport.runwayLength;
    const departureRunwayOk = checkRunwayCompatibility(depRunway, aircraft.minRunway);
    const arrivalRunwayOk = checkRunwayCompatibility(arrRunway, aircraft.minRunway);
    
    // 2. Calculate weights (lbs)
    const passengerWeight = passengers * 230; // Average passenger + luggage
    const flightTimeHours = distance / aircraft.speed;
    const fuelNeededLbs = flightTimeHours * aircraft.fuelConsumption;
    const fuelWithReserve = fuelNeededLbs * 1.15; // 15% reserve for safety, alternate, etc.
    
    // 3. Payload check - can we carry the passengers?
    const payloadNeeded = passengerWeight;
    const payloadAvailable = aircraft.maxPayload;
    const payloadOk = payloadNeeded <= payloadAvailable;
    
    // 4. Fuel capacity check - can we carry enough fuel?
    const fuelCapacityOk = fuelWithReserve <= aircraft.fuelCapacity;
    
    // 5. Total weight check - is takeoff weight within limits?
    const totalWeight = aircraft.emptyWeight + passengerWeight + fuelWithReserve;
    const weightOk = totalWeight <= aircraft.maxTakeoffWeight;
    
    // 6. Range check with actual fuel load
    const actualRange = (aircraft.fuelCapacity / aircraft.fuelConsumption) * aircraft.speed;
    const rangeOk = distance <= actualRange * 0.85; // Use 85% of theoretical max range
    
    // Collect all failures
    const failures = [];
    if (!departureRunwayOk) failures.push(`Departure runway too short (needs ${aircraft.minRunway} ft)`);
    if (!arrivalRunwayOk) failures.push(`Arrival runway too short (needs ${aircraft.minRunway} ft)`);
    if (!payloadOk) failures.push(`Payload exceeded: ${Math.round(payloadNeeded)} lbs needed, ${aircraft.maxPayload} lbs available`);
    if (!fuelCapacityOk) failures.push(`Fuel capacity exceeded: ${Math.round(fuelWithReserve)} lbs needed, ${aircraft.fuelCapacity} lbs capacity`);
    if (!weightOk) failures.push(`Takeoff weight exceeded: ${Math.round(totalWeight)} lbs total, ${aircraft.maxTakeoffWeight} lbs maximum`);
    if (!rangeOk) failures.push(`Range exceeded: ${distance} NM requested, ~${Math.round(actualRange * 0.85)} NM practical range`);
    
    // If any check fails, don't call API
    if (failures.length > 0) {
      console.log('Local feasibility checks failed:', failures);
      setAviapagesResult({
        errors: failures.map((msg, idx) => ({
          code: 9999 + idx,
          scope: 'local_check',
          message: msg
        }))
      });
      return;
    }
    
    // If feasible, call aviapages API
    setIsLoadingAviapages(true);
    setAviapagesResult(null);
    try {
      const result = await calculateFlightTimeWithAviapages(
        departureAirport.code,
        arrivalAirport.code,
        selectedAircraft,
        passengers
      );
      
      if (result.success) {
        setAviapagesResult(result.flightTime);
      } else {
        console.warn("Aviapages API failed:", result.error);
        if (result.error?.includes("throttled") || result.error?.includes("429")) {
          toast.error("Rate limited. Using local calculation instead.");
          // Fall back to local calculation
          setAviapagesResult({
            errors: [{
              code: 9998,
              scope: 'rate_limit',
              message: 'Aviapages API rate limited. Showing local estimate only.'
            }],
            distance: { great_circle: distance / 0.539957 },
            time: { airway: Math.round(distance / aircraft.speed * 60 * 1.08) },
            fuel: { airway: Math.round(distance / aircraft.speed * aircraft.fuelConsumption * 1.08) }
          });
        } else {
          toast.error("Failed to get aviapages data");
        }
      }
    } catch (error) {
      console.error("Error calling aviapages:", error);
    } finally {
      setIsLoadingAviapages(false);
    }
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
            
            {/* Aircraft Selection Dropdown */}
            {departureAirport && arrivalAirport && distance > 0 && (
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium text-muted-foreground">Aircraft:</Label>
                <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select capable aircraft" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg">
                    {getCapableAircraft().length === 0 ? (
                      <SelectItem value="none" disabled>No aircraft can complete this trip</SelectItem>
                    ) : (
                      getCapableAircraft().flatMap(aircraft => 
                        aircraft.examples.map(example => (
                          <SelectItem key={`${aircraft.category}-${example}`} value={`${aircraft.category}-${example}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{example}</span>
                              <Badge variant="outline" className="text-xs">{aircraft.category}</Badge>
                              <Badge variant="secondary" className="text-xs">{aircraft.maxRange} NM</Badge>
                            </div>
                          </SelectItem>
                        ))
                      )
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCalculate} 
                  disabled={!selectedAircraft || isLoadingAviapages}
                  className="shrink-0"
                >
                  {isLoadingAviapages ? "Calculating..." : "Calculate"}
                </Button>
              </div>
            )}
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
              </div>
            </div>

            {/* Aviapages Results */}
            {selectedAircraft && (
              <div className="rounded-lg bg-secondary/20 border border-secondary p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">Flight Details</span>
                </div>
                
                {aviapagesResult ? (
                  <>
                    {/* Check for errors first */}
                    {aviapagesResult.errors && aviapagesResult.errors.length > 0 ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-2">Aircraft Limitation Detected:</div>
                          {aviapagesResult.errors.map((error: any, index: number) => (
                            <div key={index} className="text-sm mb-1">
                              • {error.message}
                            </div>
                          ))}
                          <div className="mt-3 text-sm">
                            <strong>This aircraft cannot complete this flight nonstop.</strong> 
                            {aviapagesResult.airport?.techstop && aviapagesResult.airport.techstop.length > 0 && (
                              <div className="mt-2">
                                <strong>Suggested fuel stops:</strong> {aviapagesResult.airport.techstop.join(', ')}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      // Show successful calculation
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Aircraft:</span>
                          <div className="font-medium">{aviapagesResult.aircraft || selectedAircraft}</div>
                        </div>
                        {aviapagesResult.time?.airway && (
                          <div>
                            <span className="text-muted-foreground">Flight Time:</span>
                            <div className="font-bold text-primary">
                              {Math.floor(aviapagesResult.time.airway / 60)}h {aviapagesResult.time.airway % 60}m
                            </div>
                          </div>
                        )}
                        {aviapagesResult.distance?.airway && (
                          <div>
                            <span className="text-muted-foreground">Routing Distance:</span>
                            <div className="font-medium">{Math.round(aviapagesResult.distance.airway * 0.539957)} NM</div>
                          </div>
                        )}
                        {aviapagesResult.fuel?.airway && (
                          <div>
                            <span className="text-muted-foreground">Fuel Required:</span>
                            <div className="font-medium">{aviapagesResult.fuel.airway} lbs</div>
                          </div>
                        )}
                        
                        {/* Calculate cost estimate if we have flight time */}
                        {aviapagesResult.time?.airway && (() => {
                          const aircraftCategory = selectedAircraft.split('-')[0];
                          const aircraft = AIRCRAFT_TYPES.find(a => a.category === aircraftCategory);
                          if (!aircraft) return null;
                          
                          const flightTimeHours = aviapagesResult.time.airway / 60;
                          const estimatedCost = flightTimeHours * aircraft.hourlyRate;
                          const minCost = estimatedCost * 0.9;
                          const maxCost = estimatedCost * 1.1;
                          
                          return (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Estimated Cost:</span>
                              <div className="font-bold text-primary text-lg">
                                {formatCurrency(minCost)} - {formatCurrency(maxCost)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Based on {formatCurrency(aircraft.hourlyRate)}/hr ± 10%
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Runway compatibility info */}
                    {(() => {
                      const aircraftCategory = selectedAircraft.split('-')[0];
                      const aircraft = AIRCRAFT_TYPES.find(a => a.category === aircraftCategory);
                      if (!aircraft) return null;
                      
                      const departureCompatible = checkRunwayCompatibility(departureAirport.runway, aircraft.minRunway);
                      const arrivalCompatible = checkRunwayCompatibility(arrivalAirport.runway, aircraft.minRunway);
                      
                      if (!departureCompatible || !arrivalCompatible) {
                        return (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="font-medium mb-1">Runway Incompatibility:</div>
                              {!departureCompatible && (
                                <div className="text-sm">• Departure runway too short (needs {aircraft.minRunway} ft)</div>
                              )}
                              {!arrivalCompatible && (
                                <div className="text-sm">• Arrival runway too short (needs {aircraft.minRunway} ft)</div>
                              )}
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      
                      return (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <div className="text-sm text-green-800 dark:text-green-200">
                            ✅ Runway requirements met at both airports (min {aircraft.minRunway} ft)
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Select an aircraft to calculate flight details
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
