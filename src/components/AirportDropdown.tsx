import { MapPin, Plane, Radio, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Airport {
  code: string;
  name: string;
  city: string;
  runway: string;
  fbo: string;
}

interface AirportDropdownProps {
  airport: Airport | null;
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
      tower: "118.7 / 121.9",
      ground: "121.9",
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
      tower: "120.2",
      ground: "121.7",
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
      tower: "119.1 / 123.9",
      ground: "121.9",
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
    tower: "N/A",
    ground: "N/A", 
    fbos: [{ name: airport.fbo, services: ["Standard Services"], phone: "N/A" }],
    customs: false,
    slots: false
  };
};

export function AirportDropdown({ airport }: AirportDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = getAirportDetails(airport);

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

          {/* Radio Frequencies & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Radio className="h-4 w-4 text-primary" />
                Radio
              </h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Tower:</span>
                  <div className="font-medium">{details.tower}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ground:</span>
                  <div className="font-medium">{details.ground}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                Hours
              </h3>
              <div className="text-sm font-medium">{details.hours}</div>
            </div>
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
        </div>
      )}
    </div>
  );
}