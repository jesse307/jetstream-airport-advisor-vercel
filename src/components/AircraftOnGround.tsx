import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plane, MapPin, Clock, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Aircraft {
  registration: string;
  callsign?: string;
  aircraftType: string;
  operator?: string;
  position: {
    lat: number;
    lon: number;
  };
  altitude: number;
  speed: number;
  heading: number;
  lastSeen?: string;
  origin?: string;
  destination?: string;
  lastFlight?: {
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    callsign?: string;
  } | null;
  nextFlight?: {
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    callsign?: string;
  } | null;
}

interface AircraftOnGroundProps {
  defaultAirport?: string;
}

export const AircraftOnGround = ({ defaultAirport }: AircraftOnGroundProps) => {
  const [airport, setAirport] = useState(defaultAirport || "");
  const [loading, setLoading] = useState(false);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [stats, setStats] = useState<{
    airport: string;
    totalFlights: number;
    onGroundCount: number;
  } | null>(null);

  const fetchAircraftOnGround = async () => {
    if (!airport.trim()) {
      toast.error("Please enter an airport code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-aircraft-on-ground', {
        body: { airportIcao: airport.trim().toUpperCase() }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAircraft(data.aircraft || []);
      setStats({
        airport: data.airport,
        totalFlights: data.totalFlights,
        onGroundCount: data.onGroundCount
      });

      if (data.onGroundCount === 0) {
        toast.info(`No aircraft currently on ground at ${data.airport}`);
      } else {
        toast.success(`Found ${data.onGroundCount} aircraft on ground`);
      }
    } catch (error: any) {
      console.error('Error fetching aircraft:', error);
      toast.error(error.message || "Failed to fetch aircraft data");
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatFlightTime = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Aircraft on Ground (ADS-B Live Data)
          </CardTitle>
          <CardDescription>
            See which aircraft are currently on the ground at any airport using real-time ADS-B data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter airport ICAO code (e.g., KJFK, KLAX)"
              value={airport}
              onChange={(e) => setAirport(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchAircraftOnGround()}
              className="flex-1"
            />
            <Button 
              onClick={fetchAircraftOnGround}
              disabled={loading || !airport.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Plane className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {stats && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Airport</div>
                  <div className="font-semibold text-lg">{stats.airport}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Flights</div>
                  <div className="font-semibold text-lg">{stats.totalFlights}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">On Ground</div>
                  <div className="font-semibold text-lg text-primary">{stats.onGroundCount}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {aircraft.length > 0 && (
        <div className="grid gap-4">
          {aircraft.map((ac, index) => (
            <Card key={`${ac.registration}-${index}`} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Plane className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-lg">{ac.registration}</div>
                        {ac.callsign && (
                          <div className="text-sm text-muted-foreground">{ac.callsign}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Aircraft Type</div>
                        <div className="font-medium">{ac.aircraftType}</div>
                      </div>
                      
                      {ac.operator && (
                        <div>
                          <div className="text-muted-foreground">Operator</div>
                          <div className="font-medium">{ac.operator}</div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Position
                        </div>
                        <div className="font-mono text-xs">
                          {ac.position.lat.toFixed(4)}°, {ac.position.lon.toFixed(4)}°
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Seen
                        </div>
                        <div className="font-medium">{formatLastSeen(ac.lastSeen)}</div>
                      </div>
                    </div>

                    {(ac.origin || ac.destination || ac.lastFlight || ac.nextFlight) && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {ac.lastFlight && (
                          <div className="text-sm">
                            <div className="text-muted-foreground font-medium mb-1">Previous Flight:</div>
                            <div className="flex items-center gap-2 pl-2">
                              <Badge variant="outline">{ac.lastFlight.from}</Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="outline">{ac.lastFlight.to}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Arrived {formatFlightTime(ac.lastFlight.arrivalTime)}
                              </span>
                            </div>
                            {ac.lastFlight.callsign && (
                              <div className="text-xs text-muted-foreground pl-2 mt-1">
                                Flight: {ac.lastFlight.callsign}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {ac.nextFlight && (
                          <div className="text-sm">
                            <div className="text-muted-foreground font-medium mb-1">Next Scheduled:</div>
                            <div className="flex items-center gap-2 pl-2">
                              <Badge variant="outline">{ac.nextFlight.from}</Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="outline">{ac.nextFlight.to}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Departs {formatFlightTime(ac.nextFlight.departureTime)}
                              </span>
                            </div>
                            {ac.nextFlight.callsign && (
                              <div className="text-xs text-muted-foreground pl-2 mt-1">
                                Flight: {ac.nextFlight.callsign}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {(ac.origin || ac.destination) && !ac.lastFlight && !ac.nextFlight && (
                          <div className="flex gap-4 text-sm">
                            {ac.origin && (
                              <div>
                                <span className="text-muted-foreground">From: </span>
                                <Badge variant="outline">{ac.origin}</Badge>
                              </div>
                            )}
                            {ac.destination && (
                              <div>
                                <span className="text-muted-foreground">To: </span>
                                <Badge variant="outline">{ac.destination}</Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      On Ground
                    </Badge>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{ac.altitude}ft</div>
                      <div>{ac.speed}kt</div>
                      <div>{ac.heading}°</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
