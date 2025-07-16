import { MapPin, Navigation, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Airport {
  code: string;
  name: string;
  city: string;
  runway: string;
  fbo: string;
}

interface AlternativeAirport extends Airport {
  distance: string;
  reason: string;
  advantages: string[];
}

interface AlternativeAirportsProps {
  selectedAirport: Airport | null;
  onSelect: (airport: Airport) => void;
  type: "departure" | "arrival";
}

// Mock alternative airports data
const getAlternatives = (airport: Airport | null, type: string): AlternativeAirport[] => {
  if (!airport) return [];

  // Sample alternatives based on selected airport
  const alternatives: Record<string, AlternativeAirport[]> = {
    "KTEB": [
      {
        code: "KCDW",
        name: "Essex County Airport",
        city: "Caldwell, NJ",
        runway: "4997 ft",
        fbo: "Meridian",
        distance: "15 NM",
        reason: "Lower costs, less congestion",
        advantages: ["Lower landing fees", "Less air traffic", "Shorter taxi times"]
      },
      {
        code: "KHPN",
        name: "Westchester County Airport", 
        city: "White Plains, NY",
        runway: "6549 ft",
        fbo: "Million Air",
        distance: "25 NM",
        reason: "Longer runway, customs available",
        advantages: ["International customs", "Longer runway", "Premium FBO services"]
      }
    ],
    "KVAN": [
      {
        code: "KBUR",
        name: "Hollywood Burbank Airport",
        city: "Burbank, CA", 
        runway: "6886 ft",
        fbo: "Atlantic Aviation",
        distance: "12 NM",
        reason: "Less congestion, closer to Hollywood",
        advantages: ["Less busy airspace", "Closer to entertainment district", "Good fuel prices"]
      },
      {
        code: "KSMO",
        name: "Santa Monica Airport",
        city: "Santa Monica, CA",
        runway: "4973 ft",
        fbo: "Atlantic Aviation", 
        distance: "18 NM",
        reason: "Coastal location, premium services",
        advantages: ["Ocean proximity", "Luxury FBO", "Less noise restrictions"]
      }
    ],
    "KJFK": [
      {
        code: "KTEB",
        name: "Teterboro Airport",
        city: "Teterboro, NJ",
        runway: "7000 ft", 
        fbo: "Atlantic Aviation, Meridian",
        distance: "20 NM",
        reason: "Business aviation focused",
        advantages: ["No airline traffic", "Faster service", "Multiple FBO options"]
      },
      {
        code: "KLGA",
        name: "LaGuardia Airport",
        city: "New York, NY",
        runway: "7003 ft",
        fbo: "Atlantic Aviation",
        distance: "15 NM", 
        reason: "Closer to Manhattan",
        advantages: ["Shorter drive to city", "Good ground transport", "Airline backup options"]
      }
    ]
  };

  return alternatives[airport.code] || [
    {
      code: "KALT",
      name: "Alternative Regional Airport",
      city: "Alternative City",
      runway: "5500 ft",
      fbo: "Regional Aviation Services",
      distance: "35 NM",
      reason: "Cost-effective alternative",
      advantages: ["Lower fees", "Less congestion", "Good services"]
    }
  ];
};

export function AlternativeAirports({ selectedAirport, onSelect, type }: AlternativeAirportsProps) {
  const alternatives = getAlternatives(selectedAirport, type);

  if (!selectedAirport || alternatives.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Alternative {type === "departure" ? "Departure" : "Arrival"} Airports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {alternatives.map((airport) => (
            <div 
              key={airport.code}
              className="border-b border-border last:border-b-0 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="space-y-3">
                {/* Airport Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-lg">{airport.code}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {airport.distance}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{airport.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {airport.city}
                    </p>
                  </div>
                  <Button 
                    variant="aviation" 
                    size="sm"
                    onClick={() => onSelect(airport)}
                  >
                    Select
                  </Button>
                </div>

                {/* Airport Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Runway:</span>
                    <div className="font-medium">{airport.runway}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">FBO:</span>
                    <div className="font-medium text-xs">{airport.fbo}</div>
                  </div>
                </div>

                {/* Reason */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Why consider:</span>
                  <div className="font-medium text-accent">{airport.reason}</div>
                </div>

                {/* Advantages */}
                <div>
                  <span className="text-muted-foreground text-sm">Key advantages:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {airport.advantages.map((advantage, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}