import { MapPin, Plane, Radio, Clock, Users, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Airport {
  code: string;
  name: string;
  city: string;
  runway: string;
  fbo: string;
}

interface AirportDetailsProps {
  airport: Airport | null;
  title: string;
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
      slots: true,
      fees: { landing: "$5.50/1000 lbs", overnight: "$50", handling: "$295" }
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
      slots: false,
      fees: { landing: "$7.25/1000 lbs", overnight: "$75", handling: "$350" }
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
    slots: false,
    fees: { landing: "N/A", overnight: "N/A", handling: "N/A" }
  };
};

export function AirportDetails({ airport, title }: AirportDetailsProps) {
  const details = getAirportDetails(airport);

  if (!details) {
    return (
      <Card className="shadow-aviation">
        <CardHeader className="bg-gradient-horizon">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select an airport to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Airport Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">{details.code}</span>
            {details.customs && <Badge variant="default">Customs</Badge>}
            {details.slots && <Badge variant="outline">Slots Required</Badge>}
          </div>
          <h2 className="text-lg font-semibold">{details.name}</h2>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {details.city} • Elevation: {details.elevation}
          </p>
        </div>

        <Separator />

        {/* Runway Information */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Runways
          </h3>
          <div className="space-y-2">
            {details.runways.map((runway: any, index: number) => (
              <div key={index} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Runway:</span>
                    <div className="font-semibold">{runway.number}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <div className="font-semibold">{runway.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Width:</span>
                    <div className="font-semibold">{runway.width}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surface:</span>
                    <div className="font-semibold">{runway.surface}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Radio Frequencies */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            Radio Frequencies
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Tower:</span>
              <div className="font-semibold">{details.tower}</div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Ground:</span>
              <div className="font-semibold">{details.ground}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Operating Hours */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Operating Hours
          </h3>
          <div className="text-sm font-medium">{details.hours}</div>
        </div>

        <Separator />

        {/* FBO Services */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            FBO Services
          </h3>
          <div className="space-y-3">
            {details.fbos.map((fbo: any, index: number) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-primary">{fbo.name}</h4>
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

        <Separator />

        {/* Fees */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Fees & Charges
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Landing Fee:</span>
              <span className="font-medium">{details.fees.landing}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overnight Fee:</span>
              <span className="font-medium">{details.fees.overnight}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Handling Fee:</span>
              <span className="font-medium">{details.fees.handling}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}