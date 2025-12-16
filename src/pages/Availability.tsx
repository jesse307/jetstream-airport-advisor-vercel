import { useState, useEffect } from "react";
import { Plane, Calendar, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, parseISO, formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AirportSearch } from "@/components/AirportSearch";

interface OpenLeg {
  id: string;
  operator_name: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  route: string | null;
  departure_date: string | null;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  availability_start_date: string | null;
  availability_end_date: string | null;
  passengers: number | null;
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

const Availability = () => {
  const [openLegs, setOpenLegs] = useState<OpenLeg[]>([]);
  const [filteredLegs, setFilteredLegs] = useState<OpenLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOpenLegs();
  }, []);

  useEffect(() => {
    filterLegs();
  }, [openLegs, startDate, endDate, fromAirport, toAirport]);

  const fetchOpenLegs = async () => {
    try {
      // Fetch from database
      const { data: dbData, error: dbError } = await supabase
        .from("open_legs")
        .select("*, updated_at")
        .order("availability_start_date", { ascending: true, nullsFirst: false })
        .order("departure_date", { ascending: true, nullsFirst: false });

      if (dbError) throw dbError;

      // Fetch from Aviapages API
      let aviapagesLegs: any[] = [];
      try {
        const { data: aviapagesData, error: aviapagesError } = await supabase.functions.invoke(
          'fetch-aviapages-openlegs'
        );

        if (aviapagesError) {
          console.error("Error fetching Aviapages data:", aviapagesError);
        } else if (aviapagesData?.success) {
          aviapagesLegs = aviapagesData.openLegs || [];
          console.log(`Fetched ${aviapagesLegs.length} open legs from Aviapages`);
        }
      } catch (aviapagesError) {
        console.error("Error calling Aviapages function:", aviapagesError);
      }

      // Merge data: Use email-based deduplication
      // If same operator email exists, prefer database version (email source)
      const dbLegsMap = new Map();
      (dbData || []).forEach((leg: OpenLeg) => {
        const key = `${leg.operator_name}-${leg.departure_airport}-${leg.arrival_airport}-${leg.departure_date}`;
        dbLegsMap.set(key, leg);
      });

      // Add Aviapages legs that don't conflict with database legs
      const mergedLegs = [...(dbData || [])];
      aviapagesLegs.forEach((apiLeg: any) => {
        const key = `${apiLeg.operator_name}-${apiLeg.departure_airport}-${apiLeg.arrival_airport}-${apiLeg.departure_date}`;

        // If this leg is not in database, add it
        if (!dbLegsMap.has(key)) {
          // Generate a unique ID for API legs
          const uniqueId = `aviapages-${apiLeg.external_id || Math.random().toString(36).substr(2, 9)}`;
          mergedLegs.push({
            id: uniqueId,
            ...apiLeg,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });

      setOpenLegs(mergedLegs);
    } catch (error: any) {
      console.error("Error fetching open legs:", error);
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    try {
      // Parse as local date to avoid timezone shifts
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, "MMM dd, yyyy");
    } catch {
      return date;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const hour = parseInt(time.substring(0, 2));
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const parseRoute = (route: string | null): string => {
    if (!route) return "—";

    // Try to extract airport codes from various formats
    // Examples: "TETERBORO - MIAMI", "TEB-MIA", "TEB to MIA", "KTEB → KMIA"
    const cleanRoute = route.toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Split by common delimiters
    const parts = cleanRoute.split(/[-–—>→TO]+/i).map(p => p.trim());

    if (parts.length >= 2) {
      // Extract first 3-4 characters that look like airport codes
      const fromCode = parts[0].match(/[A-Z]{3,4}/)?.[0] || parts[0].substring(0, 4);
      const toCode = parts[1].match(/[A-Z]{3,4}/)?.[0] || parts[1].substring(0, 4);
      return `${fromCode} → ${toCode}`;
    }

    return route;
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return "—";
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true })
        .replace('about ', '')
        .replace('less than ', '<')
        .replace('minute', 'min')
        .replace('hour', 'hr')
        .replace('day', 'd')
        .replace('month', 'mo')
        .replace('year', 'yr');
    } catch {
      return "—";
    }
  };

  const filterLegs = () => {
    let filtered = [...openLegs];

    // Filter out expired availability (past end date)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

    filtered = filtered.filter((leg) => {
      // Use availability_end_date if available, otherwise use departure_date
      const dateToCheck = leg.availability_end_date || leg.departure_date;
      if (!dateToCheck) return true; // Keep legs without dates

      try {
        const [year, month, day] = dateToCheck.split('-').map(Number);
        const legDate = new Date(year, month - 1, day);
        legDate.setHours(23, 59, 59, 999); // Set to end of day
        return legDate >= today; // Only show if end date is today or in the future
      } catch {
        return true; // Keep if date parsing fails
      }
    });

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((leg) => {
        if (!leg.departure_date) return false;
        try {
          // Parse as local date
          const [year, month, day] = leg.departure_date.split('-').map(Number);
          const legDate = new Date(year, month - 1, day);
          if (startDate && endDate) {
            return isWithinInterval(legDate, { start: startDate, end: endDate });
          } else if (startDate) {
            return legDate >= startDate;
          } else if (endDate) {
            return legDate <= endDate;
          }
        } catch {
          return false;
        }
        return true;
      });
    }

    // Filter by airport routes
    if (fromAirport || toAirport) {
      filtered = filtered.filter((leg) => {
        const parsedRoute = parseRoute(leg.route).toLowerCase();
        const routeParts = parsedRoute.split('→').map(p => p.trim());

        const fromMatch = fromAirport ? routeParts[0]?.includes(fromAirport.toLowerCase()) : true;
        const toMatch = toAirport ? routeParts[1]?.includes(toAirport.toLowerCase()) : true;

        return fromMatch && toMatch;
      });
    }

    setFilteredLegs(filtered);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFromAirport("");
    setToAirport("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary p-2">
                  <Plane className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Charter Pro</h1>
                  <p className="text-xs text-muted-foreground">Open Legs & Availability</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Real-time aircraft availability
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Available Aircraft</h2>
              <p className="text-muted-foreground">
                Browse available private jets and empty leg flights. Updated in real-time from our trusted operator network.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {openLegs.length} {openLegs.length === 1 ? "Aircraft" : "Aircraft"} Available
            </Badge>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label>From</Label>
                  <div className="mt-1.5">
                    <AirportSearch
                      value={fromAirport}
                      onChange={(value) => setFromAirport(value)}
                      placeholder="Departure airport"
                    />
                  </div>
                </div>

                <div>
                  <Label>To</Label>
                  <div className="mt-1.5">
                    <AirportSearch
                      value={toAirport}
                      onChange={(value) => setToAirport(value)}
                      placeholder="Arrival airport"
                    />
                  </div>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1.5",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1.5",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                    disabled={!startDate && !endDate && !fromAirport && !toAirport}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLegs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {openLegs.length === 0 ? "No availability data yet" : "No results found"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {openLegs.length === 0
                    ? "Open legs will appear here when received from operators"
                    : "Try adjusting your filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aircraft Type</TableHead>
                      <TableHead>Availability Period</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Tail Number</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLegs.map((leg) => (
                      <TableRow key={leg.id}>
                        <TableCell className="font-medium">
                          {leg.aircraft_type || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {leg.availability_start_date && leg.availability_end_date ? (
                              <>
                                <span className="font-medium">
                                  {formatDate(leg.availability_start_date)}
                                  {leg.availability_start_date !== leg.availability_end_date && (
                                    <> - {formatDate(leg.availability_end_date)}</>
                                  )}
                                </span>
                                {leg.departure_time && (
                                  <span className="text-sm text-muted-foreground">
                                    {formatTime(leg.departure_time)}
                                  </span>
                                )}
                              </>
                            ) : leg.departure_date ? (
                              <>
                                <span className="font-medium">
                                  {formatDate(leg.departure_date)}
                                </span>
                                {leg.departure_time && (
                                  <span className="text-sm text-muted-foreground">
                                    {formatTime(leg.departure_time)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {parseRoute(leg.route)}
                          </span>
                        </TableCell>
                        <TableCell>{leg.operator_name || "—"}</TableCell>
                        <TableCell>
                          {leg.tail_number ? (
                            <Badge variant="outline">{leg.tail_number}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {leg.price ? `$${leg.price.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(leg.updated_at || leg.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {leg.notes || "—"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Availability;
