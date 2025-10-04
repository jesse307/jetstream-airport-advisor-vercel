import { Plane } from "lucide-react";
import { CHARTER_AIRCRAFT } from "@/data/aircraftDatabase";

interface AircraftClassRecommendationsProps {
  distance: number;
  passengers: number;
  minRunway: number;
}

interface ClassSummary {
  category: string;
  avgSpeed: number;
  flightTime: string;
  canComplete: boolean;
  runwayCompatible: boolean;
  passengerCompatible: boolean;
}

export function AircraftClassRecommendations({ 
  distance, 
  passengers,
  minRunway 
}: AircraftClassRecommendationsProps) {
  // Define category order for progression
  const categoryOrder = [
    'Light Jet',
    'Super Light Jet', 
    'Mid Jet',
    'Super Mid Jet',
    'Heavy Jet',
    'Ultra Long Range'
  ];

  // Calculate summary for each category
  const categorySummaries: ClassSummary[] = categoryOrder.map(category => {
    const aircraftInCategory = CHARTER_AIRCRAFT.filter(a => a.category === category);
    
    if (aircraftInCategory.length === 0) {
      return {
        category,
        avgSpeed: 0,
        flightTime: 'N/A',
        canComplete: false,
        runwayCompatible: false,
        passengerCompatible: false
      };
    }

    const avgSpeed = Math.round(
      aircraftInCategory.reduce((sum, a) => sum + a.speed, 0) / aircraftInCategory.length
    );

    const canComplete = aircraftInCategory.some(a => a.range >= distance * 1.1); // 10% reserve
    const runwayCompatible = aircraftInCategory.some(a => a.minRunway <= minRunway);
    const passengerCompatible = aircraftInCategory.some(a => a.passengers >= passengers);

    const flightTimeHours = distance / avgSpeed;
    const hours = Math.floor(flightTimeHours);
    const minutes = Math.round((flightTimeHours - hours) * 60);
    const flightTime = `${hours}h ${minutes}m`;

    return {
      category,
      avgSpeed,
      flightTime,
      canComplete,
      runwayCompatible,
      passengerCompatible
    };
  });

  // Find minimum capable class
  const capableClasses = categorySummaries.filter(c => 
    c.canComplete && c.runwayCompatible && c.passengerCompatible
  );

  if (capableClasses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No suitable aircraft classes found for this route.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Distance: {distance.toLocaleString()} NM | Passengers: {passengers} | Min Runway: {minRunway.toLocaleString()}ft
        </p>
      </div>
    );
  }

  const minClass = capableClasses[0];
  const nextClass = capableClasses[1];

  return (
    <div className="space-y-4">
      {/* Minimum Capable Class */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{minClass.category}</div>
            <div className="text-xs text-muted-foreground">Minimum Required Class</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{minClass.flightTime}</div>
          <div className="text-xs text-muted-foreground">Est. Flight Time</div>
        </div>
      </div>

      {/* Next Logical Class */}
      {nextClass && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{nextClass.category}</div>
              <div className="text-xs text-muted-foreground">Enhanced Comfort & Performance</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{nextClass.flightTime}</div>
            <div className="text-xs text-muted-foreground">Est. Flight Time</div>
          </div>
        </div>
      )}

      {/* Additional Classes Available */}
      {capableClasses.length > 2 && (
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          +{capableClasses.length - 2} additional class{capableClasses.length - 2 > 1 ? 'es' : ''} available
        </div>
      )}

      {/* Route Requirements Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Distance</div>
          <div className="font-semibold text-sm">{distance.toLocaleString()} NM</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Passengers</div>
          <div className="font-semibold text-sm">{passengers}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Min Runway</div>
          <div className="font-semibold text-sm">{minRunway.toLocaleString()}ft</div>
        </div>
      </div>
    </div>
  );
}
