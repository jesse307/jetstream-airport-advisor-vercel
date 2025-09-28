import { useState, useEffect } from "react";
import { Calculator, Clock, Plane, MapPin, Route, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateFlightTimeWithAviapages } from "@/lib/aviapages";
import { toast } from "sonner";

interface Airport {
  code: string;
  name: string;
  city: string;
  state?: string;
  runway: string | number; // Support both string format and numeric runway length
  fbo: string;
  type: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  icao?: string;
}

interface AircraftType {
  category: string;
  speed: number; // knots
  examples: string[];
  minRunway: number; // feet
  passengers: string;
  hourlyRate: number; // USD per hour
  maxRange: number; // nautical miles
  maxPayload: number; // pounds
  fuelCapacity: number; // pounds
  fuelConsumption: number; // pounds per hour
  emptyWeight: number; // pounds
  maxTakeoffWeight: number; // pounds
}

const AIRCRAFT_TYPES: AircraftType[] = [
  {
    category: "Very Light Jet",
    speed: 290,
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
    speed: 220,
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
    speed: 320,
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
    speed: 350,
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
    speed: 360,
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
    speed: 390,
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
    speed: 410,
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
    speed: 430,
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
  initialPassengers?: number;
}

export function FlightCalculator({ departure, arrival, initialPassengers }: FlightCalculatorProps) {
  const [distance, setDistance] = useState<number>(0);
  const [passengers, setPassengers] = useState<number>(initialPassengers || 1);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [aviapagesResult, setAviapagesResult] = useState<any>(null);
  const [isLoadingAviapages, setIsLoadingAviapages] = useState(false);

  // Parse airport string to extract code and create minimal Airport object
  const parseAirportString = (airportString: string): Airport | null => {
    if (!airportString) return null;
    
    // Expected format: "KJFK - John F. Kennedy International, New York"
    const parts = airportString.split(' - ');
    if (parts.length < 2) return null;
    
    const code = parts[0].trim();
    const rest = parts[1];
    
    // Split by comma to get name and city
    const nameAndCity = rest.split(', ');
    const name = nameAndCity[0] || '';
    const city = nameAndCity.slice(1).join(', ') || '';
    
    return {
      code,
      name,
      city,
      runway: "8000 ft", // Default runway length - should work for all aircraft
      fbo: "Various",
      type: "Public"
    };
  };

  const departureAirport = parseAirportString(departure);
  const arrivalAirport = parseAirportString(arrival);

  // Use coordinates from airport data if available, otherwise lookup table
  const getCoordinates = (airport: Airport) => {
    // First try to use coordinates from airport data
    if (airport.latitude && airport.longitude) {
      console.log(`Using API coordinates for ${airport.code}: [${airport.latitude}, ${airport.longitude}]`);
      return [airport.latitude, airport.longitude];
    }
    
    // Fallback to coordinate lookup table for major airports (both IATA and ICAO codes)
    const coords: { [key: string]: [number, number] } = {
        // Major US Hubs - ICAO Codes
        'KJFK': [40.6413, -73.7781], // JFK
        'KLAX': [33.9425, -118.4081], // LAX
        'KORD': [41.9742, -87.9073], // ORD Chicago O'Hare
        'KATL': [33.6407, -84.4277], // ATL Hartsfield-Jackson
        'KDFW': [32.8998, -97.0403], // DFW Dallas/Fort Worth
        'KDEN': [39.8561, -104.6737], // DEN Denver
        'KSFO': [37.6213, -122.3790], // SFO San Francisco
        'KLAS': [36.0840, -115.1537], // LAS Las Vegas
        'KMIA': [25.7959, -80.2870], // MIA Miami
        'KBOS': [42.3656, -71.0096], // BOS Boston Logan
        'KSEA': [47.4502, -122.3088], // SEA Seattle
        'KPHX': [33.4484, -112.0740], // PHX Phoenix
        'KIAH': [29.9902, -95.3368], // IAH Houston
        'KMCO': [28.4312, -81.3081], // MCO Orlando
        'KCLT': [35.2144, -80.9473], // CLT Charlotte
        'KPHL': [39.8744, -75.2424], // PHL Philadelphia
        'KBWI': [39.1754, -76.6683], // BWI Baltimore
        'KDCA': [38.8512, -77.0402], // DCA Reagan National
        'KIAD': [38.9445, -77.4558], // IAD Dulles
        'KMSP': [44.8848, -93.2223], // MSP Minneapolis
        'KSTL': [38.7487, -90.3700], // St. Louis
        'KCVG': [39.0488, -84.6678], // Cincinnati
        'KCLE': [41.4117, -81.8498], // Cleveland
        'KPIT': [40.4915, -80.2329], // Pittsburgh
        'KPDX': [45.5898, -122.5951], // Portland
        'KEWR': [40.6925, -74.1687], // Newark Liberty
        
        // Major US Hubs - IATA Codes
        'JFK': [40.6413, -73.7781], // JFK
        'LAX': [33.9425, -118.4081], // LAX
        'ORD': [41.9742, -87.9073], // Chicago O'Hare
        'ATL': [33.6407, -84.4277], // Hartsfield-Jackson
        'DFW': [32.8998, -97.0403], // Dallas/Fort Worth
        'DEN': [39.8561, -104.6737], // Denver
        'SFO': [37.6213, -122.3790], // San Francisco
        'LAS': [36.0840, -115.1537], // Las Vegas
        'MIA': [25.7959, -80.2870], // Miami
        'BOS': [42.3656, -71.0096], // Boston Logan
        'SEA': [47.4502, -122.3088], // Seattle
        'PHX': [33.4484, -112.0740], // Phoenix
        'IAH': [29.9902, -95.3368], // Houston
        'MCO': [28.4312, -81.3081], // Orlando
        'CLT': [35.2144, -80.9473], // Charlotte
        'PHL': [39.8744, -75.2424], // Philadelphia
        'BWI': [39.1754, -76.6683], // Baltimore
        'DCA': [38.8512, -77.0402], // Reagan National
        'IAD': [38.9445, -77.4558], // Dulles
        'MSP': [44.8848, -93.2223], // Minneapolis
        'STL': [38.7487, -90.3700], // St. Louis
        'CVG': [39.0488, -84.6678], // Cincinnati
        'CLE': [41.4117, -81.8498], // Cleveland
        'PIT': [40.4915, -80.2329], // Pittsburgh
        'PDX': [45.5898, -122.5951], // Portland
        'EWR': [40.6925, -74.1687], // Newark Liberty
        
        // International Airports - ICAO Codes
        'EGLL': [51.4706, -0.461941], // London Heathrow
        'EGKK': [51.1481, -0.1903], // London Gatwick
        'LFPG': [49.0128, 2.5500], // Paris Charles de Gaulle
        'EDDF': [50.0379, 8.5622], // Frankfurt
        'LIRF': [41.8003, 12.2389], // Rome Fiumicino
        'LEMD': [40.4719, -3.5626], // Madrid
        'EHAM': [52.3086, 4.7639], // Amsterdam
        'LOWW': [48.1103, 16.5697], // Vienna
        'LSZH': [47.4647, 8.5492], // Zurich
        
        // International Airports - IATA Codes
        'LHR': [51.4706, -0.461941], // London Heathrow
        'LGW': [51.1481, -0.1903], // London Gatwick
        'CDG': [49.0128, 2.5500], // Paris Charles de Gaulle
        'FRA': [50.0379, 8.5622], // Frankfurt
        'FCO': [41.8003, 12.2389], // Rome Fiumicino
        'MAD': [40.4719, -3.5626], // Madrid
        'AMS': [52.3086, 4.7639], // Amsterdam
        'VIE': [48.1103, 16.5697], // Vienna
        'ZUR': [47.4647, 8.5492], // Zurich
        
        // Business Aviation Airports
        'KTEB': [40.8501, -74.0606], // Teterboro
        'TEB': [40.8501, -74.0606], // Teterboro
        'KHPN': [41.0674, -73.7063], // Westchester
        'KCDW': [40.8752, -74.2816], // Caldwell Essex County
        'KPDK': [33.8756, -84.3020], // DeKalb-Peachtree
        'KVNY': [34.2198, -118.4898], // Van Nuys
        'VNY': [34.2198, -118.4898], // Van Nuys
        'KBUR': [34.2007, -118.3591], // Burbank
        'KSMO': [34.0158, -118.4513], // Santa Monica
        'KSNA': [33.6757, -117.8681], // John Wayne Orange County
        'KORL': [28.5455, -81.3339], // Orlando Executive
        'KOPF': [25.9077, -80.2784], // Miami-Opa Locka Executive
        'KTMB': [25.6479, -80.4328], // Tamiami Executive
        'KPBI': [26.6832, -80.0956], // West Palm Beach
        'KFLL': [26.0742, -80.1506], // Fort Lauderdale
        'KTPA': [27.9755, -82.5332], // Tampa
        'KDAL': [32.8471, -96.8518], // Dallas Love Field
        'KADS': [32.9686, -96.8364], // Addison
        'KAUS': [30.1945, -97.6699], // Austin-Bergstrom
        'KPWK': [42.1142, -87.9015], // Chicago Executive Palwaukee
        'KDPA': [41.9077, -88.2484], // DuPage
        'KMDW': [41.7868, -87.7524], // Chicago Midway
        'KFTY': [33.7791, -84.5214], // Fulton County Atlanta
        'KSDL': [33.6228, -111.9105], // Scottsdale
        'KBDR': [41.1635, -73.1261], // Igor I. Sikorsky Memorial
        'KLGB': [33.8177, -118.1516], // Long Beach
        'KBHB': [44.4497, -68.3616], // Bar Harbor, Maine
        'KHOU': [29.6465, -95.2789], // Houston Hobby
        
        // Additional Business Aviation Airports  
        'HPN': [41.0674, -73.7063], // Westchester County
        'CDW': [40.8752, -74.2816], // Caldwell Essex County
        'PDK': [33.8756, -84.3020], // DeKalb-Peachtree
        'BUR': [34.2007, -118.3591], // Burbank
        'SMO': [34.0158, -118.4513], // Santa Monica
        'SNA': [33.6757, -117.8681], // John Wayne Orange County
        'ORL': [28.5455, -81.3339], // Orlando Executive
        'OPF': [25.9077, -80.2784], // Miami-Opa Locka Executive
        'TMB': [25.6479, -80.4328], // Tamiami Executive
        'PBI': [26.6832, -80.0956], // West Palm Beach
        'FLL': [26.0742, -80.1506], // Fort Lauderdale
        'TPA': [27.9755, -82.5332], // Tampa
        'DAL': [32.8471, -96.8518], // Dallas Love Field
        'ADS': [32.9686, -96.8364], // Addison
        'AUS': [30.1945, -97.6699], // Austin-Bergstrom
        'PWK': [42.1142, -87.9015], // Chicago Executive Palwaukee
        'DPA': [41.9077, -88.2484], // DuPage
        'MDW': [41.7868, -87.7524], // Chicago Midway
        'FTY': [33.7791, -84.5214], // Fulton County Atlanta
        'SDL': [33.6228, -111.9105], // Scottsdale
        'BDR': [41.1635, -73.1261], // Igor I. Sikorsky Memorial
        'LGB': [33.8177, -118.1516], // Long Beach
        'BHB': [44.4497, -68.3616], // Bar Harbor, Maine
        'HOU': [29.6465, -95.2789], // Houston Hobby
      };
      
      const coords_result = coords[airport.code];
      if (coords_result) {
        console.log(`Using fallback coordinates for ${airport.code}: [${coords_result[0]}, ${coords_result[1]}]`);
        return coords_result;
      } else {
        console.warn(`No coordinates found for airport ${airport.code}, using JFK default`);
        return [40.6413, -73.7781]; // Default to JFK if not found
      }
    };

  // Calculate great circle distance using Haversine formula
  const calculateDistance = (dep: Airport, arr: Airport): number => {
    const [lat1, lon1] = getCoordinates(dep);
    const [lat2, lon2] = getCoordinates(arr);

    console.log(`Calculating distance from ${dep.code} [${lat1}, ${lon1}] to ${arr.code} [${lat2}, ${lon2}]`);

    const R = 3440.065; // Earth's radius in nautical miles (more precise)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log(`Calculated distance: ${distance.toFixed(1)} NM`);
    return Math.round(distance);
  };

  // Get typical wind component for route
  const getWindComponent = (dep: Airport, arr: Airport): number => {
    const depCoords = getCoordinates(dep);
    const arrCoords = getCoordinates(arr);
    
    if (!depCoords || !arrCoords) return 0;
    
    // Calculate bearing (direction of flight)
    const lat1 = depCoords[0] * Math.PI / 180;
    const lat2 = arrCoords[0] * Math.PI / 180;
    const deltaLon = (arrCoords[1] - depCoords[1]) * Math.PI / 180;
    
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    // Typical wind patterns (prevailing westerlies in US)
    // Winds generally flow west to east at 15-25 kts at typical private jet altitudes
    const avgWindSpeed = 20; // knots
    const avgWindDirection = 270; // degrees (west wind)
    
    // Calculate wind component (headwind = negative, tailwind = positive)
    const windDiff = Math.abs(bearing - avgWindDirection);
    const normalizedDiff = windDiff > 180 ? 360 - windDiff : windDiff;
    const windComponent = avgWindSpeed * Math.cos(normalizedDiff * Math.PI / 180);
    
    console.log(`Route bearing: ${bearing.toFixed(0)}°, Wind component: ${windComponent.toFixed(1)} kts`);
    return windComponent;
  };

  const calculateFlightTime = (distance: number, aircraftSpeed: number, dep?: Airport, arr?: Airport): string => {
    let effectiveSpeed = aircraftSpeed;
    
    // Apply wind component if both airports are provided
    if (dep && arr) {
      const windComponent = getWindComponent(dep, arr);
      effectiveSpeed = aircraftSpeed + windComponent; // tailwind increases effective speed
      console.log(`Wind-adjusted speed: ${aircraftSpeed} + ${windComponent.toFixed(1)} = ${effectiveSpeed.toFixed(1)} kts`);
    }
    
    const timeInHours = distance / effectiveSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    console.log(`Flight time calculation: ${distance} NM ÷ ${effectiveSpeed.toFixed(1)} kts = ${timeInHours.toFixed(2)} hours = ${hours}h ${minutes}m`);
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const calculateFlightTimeInHours = (distance: number, aircraftSpeed: number, dep?: Airport, arr?: Airport): number => {
    let effectiveSpeed = aircraftSpeed;
    
    // Apply wind component if both airports are provided
    if (dep && arr) {
      const windComponent = getWindComponent(dep, arr);
      effectiveSpeed = aircraftSpeed + windComponent;
    }
    
    return distance / effectiveSpeed;
  };

  const calculateCostRange = (flightTimeHours: number, hourlyRate: number): { min: number; max: number } => {
    const baseCost = flightTimeHours * hourlyRate;
    const minCost = baseCost * 0.9; // -10%
    const maxCost = baseCost * 1.1; // +10%
    return { min: Math.round(minCost), max: Math.round(maxCost) };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const checkRunwayCompatibility = (runway: string | number, minRunway: number) => {
    let runwayLength: number;
    
    if (typeof runway === 'number') {
      runwayLength = runway;
    } else {
      runwayLength = parseInt(runway.replace(/[^\d]/g, ""));
    }
    
    return runwayLength >= minRunway;
  };

  const calculateAircraftCapability = (aircraft: AircraftType, distance: number, passengers: number) => {
    // Calculate weights
    const pilotWeight = 2 * 180; // 2 pilots at 180 lbs each
    const passengerWeight = passengers * 230; // 180 lbs + 50 lbs luggage per passenger
    const totalPersonWeight = pilotWeight + passengerWeight;
    
    // Calculate fuel needed (with 45 min reserve)
    const flightTimeHours = calculateFlightTimeInHours(distance, aircraft.speed, departureAirport, arrivalAirport);
    const fuelNeeded = (flightTimeHours + 0.75) * aircraft.fuelConsumption; // +45 min reserve
    
    // Calculate total weight
    const totalWeight = aircraft.emptyWeight + totalPersonWeight + fuelNeeded;
    
    // Debug logging for capability checks
    console.log(`${aircraft.category} capability check:`, {
      distance,
      maxRange: aircraft.maxRange,
      fuelNeeded: Math.round(fuelNeeded),
      fuelCapacity: aircraft.fuelCapacity,
      flightTimeHours: flightTimeHours.toFixed(2)
    });
    
    // Check all capabilities
    const rangeCapable = distance <= aircraft.maxRange;
    const weightCapable = totalWeight <= aircraft.maxTakeoffWeight;
    const payloadCapable = totalPersonWeight <= aircraft.maxPayload;
    const fuelCapable = fuelNeeded <= aircraft.fuelCapacity;
    
    return {
      capable: rangeCapable && weightCapable && payloadCapable && fuelCapable,
      pilotWeight,
      passengerWeight,
      totalPersonWeight,
      fuelNeeded: Math.round(fuelNeeded),
      totalWeight: Math.round(totalWeight),
      rangeCapable,
      weightCapable,
      payloadCapable,
      fuelCapable
    };
  };

  const getFlightLimitation = (aircraft: AircraftType, distance: number, passengers: number, departureAirport: Airport, arrivalAirport: Airport) => {
    const departureCompatible = checkRunwayCompatibility(departureAirport.runway, aircraft.minRunway);
    const arrivalCompatible = checkRunwayCompatibility(arrivalAirport.runway, aircraft.minRunway);
    const capability = calculateAircraftCapability(aircraft, distance, passengers);
    
    // Check limitations in order of importance
    if (!capability.rangeCapable) {
      return {
        compatible: false,
        reason: `Exceeds maximum range (${aircraft.maxRange} NM)`,
        type: 'range'
      };
    }
    
    if (!capability.fuelCapable) {
      return {
        compatible: false,
        reason: `Insufficient fuel capacity for this route`,
        type: 'fuel'
      };
    }
    
    if (!capability.payloadCapable) {
      return {
        compatible: false,
        reason: `Too many passengers (max payload: ${aircraft.maxPayload} lbs)`,
        type: 'payload'
      };
    }
    
    if (!capability.weightCapable) {
      return {
        compatible: false,
        reason: `Exceeds maximum takeoff weight`,
        type: 'weight'
      };
    }
    
    if (!departureCompatible) {
      return {
        compatible: false,
        reason: `Departure runway too short (needs ${aircraft.minRunway} ft)`,
        type: 'runway'
      };
    }
    
    if (!arrivalCompatible) {
      return {
        compatible: false,
        reason: `Arrival runway too short (needs ${aircraft.minRunway} ft)`,
        type: 'runway'
      };
    }
    
    return {
      compatible: true,
      reason: 'Flight possible',
      type: 'compatible'
    };
  };
  const getCapableAircraft = () => {
    if (!departureAirport || !arrivalAirport || distance === 0) return [];
    
    return AIRCRAFT_TYPES.filter(aircraft => {
      const limitation = getFlightLimitation(aircraft, distance, passengers, departureAirport, arrivalAirport);
      return limitation.compatible;
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

  // Call aviapages API when parameters change (removed automatic calls to avoid rate limiting)
  // Users now need to click the "Calculate with Aviapages" button manually

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
            <Users className="h-4 w-4 text-primary" />
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
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-muted-foreground">Aircraft:</Label>
                <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                  <SelectTrigger className="w-64 bg-card border-border z-50">
                    <SelectValue placeholder="Select capable aircraft" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg z-50">
                    {getCapableAircraft().length === 0 ? (
                      <SelectItem value="none" disabled>No aircraft can complete this trip nonstop</SelectItem>
                    ) : (
                      getCapableAircraft().map(aircraft => 
                        aircraft.examples.map(example => (
                          <SelectItem key={`${aircraft.category}-${example}`} value={`${aircraft.category}-${example}`}>
                            <div className="flex items-center gap-2">
                              <Plane className="h-3 w-3" />
                              <span className="font-medium">{example}</span>
                              <Badge variant="outline" className="text-xs">{aircraft.category}</Badge>
                            </div>
                          </SelectItem>
                        ))
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              Total weight: <span className="font-medium text-foreground">{passengers * 230} lbs</span>
              <span className="text-xs block mt-1">180 lbs per passenger + 50 lbs luggage</span>
            </div>
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

            {/* Aviapages API Results */}
            {departureAirport && arrivalAirport && selectedAircraft && (
              <div className="rounded-lg bg-secondary/20 border border-secondary p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Professional Flight Calculation</span>
                  </div>
                  <Button
                    onClick={() => {
                      const fetchAviapagesData = async () => {
                        setIsLoadingAviapages(true);
                        try {
                          const result = await calculateFlightTimeWithAviapages(
                            departureAirport.code,
                            arrivalAirport.code,
                            selectedAircraft,
                            passengers
                          );
                          
                          if (result.success) {
                            setAviapagesResult(result.flightTime);
                            toast.success("Flight time calculated with aviapages API");
                          } else {
                            console.warn("Aviapages API failed:", result.error);
                            if (result.error?.includes("throttled")) {
                              toast.error("Aviapages API rate limited. Please wait and try again.");
                            } else {
                              toast.error("Failed to get aviapages data");
                            }
                            setAviapagesResult(null);
                          }
                        } catch (error) {
                          console.error("Error calling aviapages:", error);
                          setAviapagesResult(null);
                        } finally {
                          setIsLoadingAviapages(false);
                        }
                      };
                      fetchAviapagesData();
                    }}
                    disabled={isLoadingAviapages}
                    size="sm"
                    variant="outline"
                  >
                    {isLoadingAviapages ? "Calculating..." : "Calculate with Aviapages"}
                  </Button>
                </div>
                
                {aviapagesResult ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Aircraft:</span>
                        <div className="font-medium">{aviapagesResult.aircraft || selectedAircraft}</div>
                      </div>
                      {aviapagesResult.distance?.great_circle && (
                        <div>
                          <span className="text-muted-foreground">Aviapages Distance:</span>
                          <div className="font-bold text-primary">{Math.round(aviapagesResult.distance.great_circle * 0.539957)} NM</div>
                        </div>
                      )}
                      {aviapagesResult.time?.great_circle && (
                        <div>
                          <span className="text-muted-foreground">Flight Time:</span>
                          <div className="font-bold text-primary">{Math.floor(aviapagesResult.time.great_circle / 60)}h {aviapagesResult.time.great_circle % 60}m</div>
                        </div>
                      )}
                      {aviapagesResult.time?.airway && (
                        <div>
                          <span className="text-muted-foreground">Airway Flight Time:</span>
                          <div className="font-bold text-primary">{Math.floor(aviapagesResult.time.airway / 60)}h {aviapagesResult.time.airway % 60}m</div>
                        </div>
                      )}
                      {aviapagesResult.fuel?.great_circle && (
                        <div>
                          <span className="text-muted-foreground">Fuel Required:</span>
                          <div className="font-medium">{aviapagesResult.fuel.great_circle} lbs</div>
                        </div>
                      )}
                      {aviapagesResult.fuel?.airway && (
                        <div>
                          <span className="text-muted-foreground">Airway Fuel:</span>
                          <div className="font-medium">{aviapagesResult.fuel.airway} lbs</div>
                        </div>
                      )}
                    </div>

                    {aviapagesResult.errors && aviapagesResult.errors.length > 0 ? (
                      (() => {
                        // Check if errors are fuel/weight related
                        const fuelErrors = aviapagesResult.errors.filter((error: any) => 
                          error.message.toLowerCase().includes('weight exceeded') ||
                          error.message.toLowerCase().includes('fuel') ||
                          error.message.toLowerCase().includes('payload')
                        );
                        
                        const otherErrors = aviapagesResult.errors.filter((error: any) => 
                          !error.message.toLowerCase().includes('weight exceeded') &&
                          !error.message.toLowerCase().includes('fuel') &&
                          !error.message.toLowerCase().includes('payload')
                        );

                        return (
                          <div className="space-y-4">
                            {/* Show fuel stops needed if fuel-related errors */}
                            {fuelErrors.length > 0 && (
                              <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                                <div className="flex items-center gap-2 text-destructive mb-2">
                                  <span className="text-sm font-medium">⚠️ Aircraft Limitations:</span>
                                </div>
                                {fuelErrors.map((error: any, index: number) => (
                                  <div key={index} className="text-sm text-destructive mb-1">
                                    {error.message}
                                  </div>
                                ))}
                                <div className="mt-2">
                                  <span className="text-muted-foreground text-sm">Fuel Stop Needed:</span>
                                  <div className="font-medium text-destructive">Yes</div>
                                </div>
                                {aviapagesResult.airport?.techstop && aviapagesResult.airport.techstop.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-muted-foreground text-sm">📍 Suggested Fuel Stop Options:</span>
                                    <div className="text-sm font-medium mt-1">
                                      {aviapagesResult.airport.techstop.join(', ')}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Typically requires 1 fuel stop - choose from above options
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Show other non-fuel errors */}
                            {otherErrors.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-destructive">
                                  <span className="text-sm font-medium">⚠️ Other Aviapages Errors:</span>
                                </div>
                                {otherErrors.map((error: any, index: number) => (
                                  <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                    {error.message}
                                  </div>
                                ))}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Try using a different aircraft type or simpler aircraft names like "Citation X", "Hawker 900XP", "Embraer Legacy 650", etc.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Aircraft:</span>
                          <div className="font-medium">{aviapagesResult.aircraft || selectedAircraft}</div>
                        </div>
                        {aviapagesResult.time?.airway && (
                          <div>
                            <span className="text-muted-foreground">Flight Time:</span>
                            <div className="font-bold text-primary">{Math.floor(aviapagesResult.time.airway / 60)}h {aviapagesResult.time.airway % 60}m</div>
                          </div>
                        )}
                        {aviapagesResult.distance?.airway && (
                          <div>
                            <span className="text-muted-foreground">Distance:</span>
                            <div className="font-medium">{Math.round(aviapagesResult.distance.airway * 0.539957)} NM</div>
                          </div>
                        )}
                        {aviapagesResult.fuel?.airway && (
                          <div>
                            <span className="text-muted-foreground">Fuel:</span>
                            <div className="font-medium">{aviapagesResult.fuel.airway} lbs</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Fuel Stop Needed:</span>
                          <div className={`font-medium ${(aviapagesResult.airport?.techstop && aviapagesResult.airport.techstop.length > 0) ? 'text-destructive' : 'text-green-600'}`}>
                            {(aviapagesResult.airport?.techstop && aviapagesResult.airport.techstop.length > 0) ? 'Yes' : 'No'}
                          </div>
                        </div>
                        {aviapagesResult.warnings && aviapagesResult.warnings.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">⚠️ Warnings:</span>
                            <div className="text-sm text-amber-600 mt-1">
                              {aviapagesResult.warnings.map((warning: any, index: number) => (
                                <div key={index}>{warning.message}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {aviapagesResult.airport?.techstop && aviapagesResult.airport.techstop.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">📍 Suggested Fuel Stops:</span>
                            <div className="text-sm font-medium mt-1">
                              {aviapagesResult.airport.techstop.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Calculate with Aviapages" to get professional flight time, distance, and fuel calculations using real airway routing.
                  </p>
                )}
              </div>
            )}

            {/* Flight Times for All Aircraft Types */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Flight Times & Cost Estimates by Aircraft Type
              </h3>
              
              <div className="grid gap-3">
                {AIRCRAFT_TYPES.map((aircraft) => {
                  const flightTime = calculateFlightTime(distance, aircraft.speed, departureAirport, arrivalAirport);
                  const flightTimeHours = calculateFlightTimeInHours(distance, aircraft.speed, departureAirport, arrivalAirport);
                  const costRange = calculateCostRange(flightTimeHours, aircraft.hourlyRate);
                  const limitation = getFlightLimitation(aircraft, distance, passengers, departureAirport, arrivalAirport);
                  const isCompatible = limitation.compatible;

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
                                {limitation.reason}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Cruise Speed:</span>
                              <div className="font-medium">{aircraft.speed} kts</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Min Runway:</span>
                              <div className="font-medium">{aircraft.minRunway.toLocaleString()} ft</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Hourly Rate:</span>
                              <div className="font-medium">{formatCurrency(aircraft.hourlyRate)}/hr</div>
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

                        <div className="text-right space-y-3">
                          <div>
                            <div className="text-sm text-muted-foreground">Flight Time</div>
                            <div className={`text-xl font-bold ${isCompatible ? "text-accent" : "text-muted-foreground"}`}>
                              {flightTime}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Estimated Cost (±10%)
                            </div>
                            <div className={`text-lg font-bold ${isCompatible ? "text-primary" : "text-muted-foreground"}`}>
                              {formatCurrency(costRange.min)} - {formatCurrency(costRange.max)}
                            </div>
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
                    <span className="text-muted-foreground">{departureAirport.code}:</span>
                    <div className="font-medium">
                      {typeof departureAirport.runway === 'number' ? `${departureAirport.runway} ft` : departureAirport.runway}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{arrivalAirport.code}:</span>
                    <div className="font-medium">
                      {typeof arrivalAirport.runway === 'number' ? `${arrivalAirport.runway} ft` : arrivalAirport.runway}
                    </div>
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