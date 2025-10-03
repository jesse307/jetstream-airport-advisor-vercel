import { MapPin, Plane, Clock, Users, ChevronDown, ChevronUp, Navigation, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { type Airport } from "@/data/privateAirports";

interface AlternativeAirport extends Airport {
  distance: string;
  reason: string;
  advantages: string[];
}

interface AirportDropdownProps {
  airport: Airport | null;
  onSelect: (airport: Airport) => void;
  type: "departure" | "arrival";
}

// Enhanced airport data for detailed view
const getAirportDetails = (airport: Airport | null) => {
  if (!airport) return null;

  // Mock detailed data - in real app this would come from aviation API
  const details: Record<string, any> = {
    "KTEB": {
      ...airport,
      elevation: "9 ft",
      runways: [
        { number: "01/19", length: "7000 ft", width: "150 ft", surface: "Asphalt" },
        { number: "06/24", length: "6013 ft", width: "150 ft", surface: "Asphalt" }
      ],
      hours: "24/7",
      fbos: [
        { name: "Atlantic Aviation", services: ["Fuel", "Hangar", "Catering", "Ground Transport"], phone: "+1-201-288-1771" },
        { name: "Meridian", services: ["Fuel", "Maintenance", "Hangar", "Catering"], phone: "+1-201-288-5040" }
      ],
      customs: true,
      slots: true
    },
    "KVAN": {
      ...airport,
      elevation: "802 ft", 
      runways: [
        { number: "16R/34L", length: "8001 ft", width: "150 ft", surface: "Asphalt" },
        { number: "16L/34R", length: "4003 ft", width: "75 ft", surface: "Asphalt" }
      ],
      hours: "6:00 AM - 10:00 PM",
      fbos: [
        { name: "Atlantic Aviation", services: ["Fuel", "Hangar", "Catering", "Ground Transport"], phone: "+1-818-785-5920" },
        { name: "Clay Lacy Aviation", services: ["Fuel", "Maintenance", "Charter", "Management"], phone: "+1-818-989-2900" }
      ],
      customs: false,
      slots: false
    },
    "KJFK": {
      ...airport,
      elevation: "13 ft",
      runways: [
        { number: "04L/22R", length: "14511 ft", width: "150 ft", surface: "Asphalt" },
        { number: "04R/22L", length: "12079 ft", width: "150 ft", surface: "Asphalt" }
      ],
      hours: "24/7",
      fbos: [
        { name: "Jet Aviation", services: ["Fuel", "Hangar", "Catering", "Customs"], phone: "+1-718-995-4300" },
        { name: "Ross Aviation", services: ["Fuel", "Ground Support", "Catering"], phone: "+1-718-995-9500" }
      ],
      customs: true,
      slots: true
    }
  };

  return details[airport.code] || {
    ...airport,
    elevation: "N/A",
    runways: [{ number: "N/A", length: airport.runway, width: "N/A", surface: "N/A" }],
    hours: "N/A",
    fbos: [{ name: airport.fbo, services: ["Standard Services"], phone: "N/A" }],
    customs: false,
    slots: false
  };
};

// Generate NOTAM URL for airport
const getNotamUrl = (airportCode: string): string => {
  // For US airports (K prefix), use FAA NOTAM Search
  if (airportCode.startsWith("K")) {
    return `https://www.notams.faa.gov/search/landing?formatType=DOMESTIC&reportType=RAW&actionType=notamReportAction&searchType=0&icaoId=${airportCode}`;
  }
  // For international airports, use generic ICAO search
  return `https://www.icao.int/safety/iStars/Pages/NOTAMs.aspx`;
};

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
        state: "NJ",
        runway: "4997 ft",
        fbo: "Meridian",
        type: "Public",
        distance: "15 NM",
        reason: "Lower costs, less congestion",
        advantages: ["Lower landing fees", "Less air traffic", "Shorter taxi times"]
      },
      {
        code: "KHPN",
        name: "Westchester County Airport", 
        city: "White Plains, NY",
        state: "NY",
        runway: "6549 ft",
        fbo: "Million Air",
        type: "Public",
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
        state: "CA",
        runway: "6886 ft",
        fbo: "Atlantic Aviation",
        type: "Public",
        distance: "12 NM",
        reason: "Less congestion, closer to Hollywood",
        advantages: ["Less busy airspace", "Closer to entertainment district", "Good fuel prices"]
      },
      {
        code: "KSMO",
        name: "Santa Monica Airport",
        city: "Santa Monica, CA",
        state: "CA",
        runway: "4973 ft",
        fbo: "Atlantic Aviation",
        type: "Public", 
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
        state: "NJ",
        runway: "7000 ft", 
        fbo: "Atlantic Aviation, Meridian",
        type: "Public",
        distance: "20 NM",
        reason: "Business aviation focused",
        advantages: ["No airline traffic", "Faster service", "Multiple FBO options"]
      },
      {
        code: "KLGA",
        name: "LaGuardia Airport",
        city: "New York, NY",
        state: "NY",
        runway: "7003 ft",
        fbo: "Atlantic Aviation",
        type: "Public",
        distance: "15 NM", 
        reason: "Closer to Manhattan",
        advantages: ["Shorter drive to city", "Good ground transport", "Airline backup options"]
      }
    ]
  };

  return alternatives[airport.code] || [];
};

export function AirportDropdown({ airport, onSelect, type }: AirportDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = getAirportDetails(airport);
  const alternatives = getAlternatives(airport, type);

  if (!airport || !details) {
    return null;
  }

  return (
    <div className="mt-2 border border-border rounded-lg bg-card shadow-card-custom">
      {/* Dropdown Header */}
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-secondary/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-lg">{details.code}</span>
            <Badge 
              variant={details.type === "Public" ? "secondary" : details.type === "Private" ? "outline" : "destructive"}
              className="text-xs"
            >
              {details.type}
            </Badge>
            {details.customs && <Badge variant="default" className="text-xs">Customs</Badge>}
            {details.slots && <Badge variant="outline" className="text-xs">Slots</Badge>}
          </div>
          <div className="text-left">
            <div className="font-medium text-sm">{details.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {details.city} • Elevation: {details.elevation}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4 animate-fade-in">
          {/* Runway Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Plane className="h-4 w-4 text-primary" />
              Runways
            </h3>
            <div className="space-y-2">
              {details.runways.map((runway: any, index: number) => (
                <div key={index} className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Runway:</span>
                      <div className="font-medium">{runway.number}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Length:</span>
                      <div className="font-medium">{runway.length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Width:</span>
                      <div className="font-medium">{runway.width}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Surface:</span>
                      <div className="font-medium">{runway.surface}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                Operating Hours
              </h3>
              <a
                href={getNotamUrl(details.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                NOTAMs
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-sm font-medium">{details.hours}</div>
          </div>

          {/* FBO Services */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              FBO Services
            </h3>
            <div className="space-y-2">
              {details.fbos.map((fbo: any, index: number) => (
                <div key={index} className="rounded-md border border-border bg-card p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-primary text-sm">{fbo.name}</h4>
                      <Badge variant="outline" className="text-xs">{fbo.phone}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {fbo.services.map((service: string, serviceIndex: number) => (
                        <Badge key={serviceIndex} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Airports */}
          {alternatives.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-primary" />
                  Alternative {type === "departure" ? "Departure" : "Arrival"} Airports
                </h3>
                <div className="space-y-3">
                  {alternatives.map((altAirport) => (
                    <div 
                      key={altAirport.code}
                      className="border border-border rounded-md p-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="space-y-2">
                        {/* Alternative Airport Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary text-sm">{altAirport.code}</span>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {altAirport.distance}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-xs">{altAirport.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {altAirport.city}
                            </p>
                          </div>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => onSelect(altAirport)}
                          >
                            Select
                          </Button>
                        </div>

                        {/* Alternative Airport Details */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Runway:</span>
                            <div className="font-medium">{altAirport.runway}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">FBO:</span>
                            <div className="font-medium">{altAirport.fbo}</div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="text-xs">
                          <span className="text-muted-foreground">Why consider:</span>
                          <div className="font-medium text-accent">{altAirport.reason}</div>
                        </div>

                        {/* Advantages */}
                        <div>
                          <span className="text-muted-foreground text-xs">Key advantages:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {altAirport.advantages.map((advantage, index) => (
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}