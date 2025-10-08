import { useState, useEffect } from "react";
import { Plane, Calendar, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  passengers: number | null;
  price: number | null;
  notes: string | null;
  created_at: string;
}

const Availability = () => {
  const [openLegs, setOpenLegs] = useState<OpenLeg[]>([]);
  const [filteredLegs, setFilteredLegs] = useState<OpenLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOpenLegs();
  }, []);

  useEffect(() => {
    filterLegs();
  }, [openLegs, startDate, endDate, searchTerm]);

  const fetchOpenLegs = async () => {
    try {
      const { data, error } = await supabase
        .from("open_legs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOpenLegs(data || []);
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
      return format(new Date(date), "MMM dd, yyyy");
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

  const filterLegs = () => {
    let filtered = [...openLegs];

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((leg) => {
        if (!leg.departure_date) return false;
        try {
          const legDate = parseISO(leg.departure_date);
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

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (leg) =>
          leg.aircraft_type?.toLowerCase().includes(search) ||
          leg.operator_name?.toLowerCase().includes(search) ||
          leg.route?.toLowerCase().includes(search) ||
          leg.tail_number?.toLowerCase().includes(search) ||
          leg.notes?.toLowerCase().includes(search)
      );
    }

    setFilteredLegs(filtered);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-primary p-2">
                    <Plane className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">Charter Pro</h1>
                    <p className="text-xs text-muted-foreground">Open Legs & Availability</p>
                  </div>
                </div>
              </Link>
            </div>
            <Button asChild variant="outline">
              <Link to="/">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Open Legs & Availability</h2>
              <p className="text-muted-foreground">
                Aircraft availability from operator emails
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {openLegs.length} {openLegs.length === 1 ? "Aircraft" : "Aircraft"}
            </Badge>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Aircraft, operator, route..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
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
                    disabled={!startDate && !endDate && !searchTerm}
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
                      <TableHead>Availability</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Tail Number</TableHead>
                      <TableHead>Price</TableHead>
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
                            <span className="font-medium">
                              {leg.departure_date ? formatDate(leg.departure_date) : "N/A"}
                            </span>
                            {leg.departure_time && (
                              <span className="text-sm text-muted-foreground">
                                {formatTime(leg.departure_time)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {leg.route || "—"}
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
