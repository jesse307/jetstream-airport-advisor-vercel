import { useState, useEffect } from "react";
import { Plane, Calendar, MapPin, Users, DollarSign, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OpenLeg {
  id: string;
  operator_name: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOpenLegs();
  }, []);

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
    return time.substring(0, 5);
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : openLegs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No availability data yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Open legs will appear here when received from operators
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openLegs.map((leg) => (
                <Card key={leg.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {leg.aircraft_type || "Unknown Aircraft"}
                        </CardTitle>
                        {leg.operator_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {leg.operator_name}
                          </p>
                        )}
                      </div>
                      {leg.tail_number && (
                        <Badge variant="outline">{leg.tail_number}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Route */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {leg.departure_airport || "N/A"} → {leg.arrival_airport || "N/A"}
                      </span>
                    </div>

                    {/* Departure Date/Time */}
                    {leg.departure_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(leg.departure_date)}
                          {leg.departure_time && ` at ${formatTime(leg.departure_time)}`}
                        </span>
                      </div>
                    )}

                    {/* Passengers */}
                    {leg.passengers && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leg.passengers} passengers</span>
                      </div>
                    )}

                    {/* Price */}
                    {leg.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          ${leg.price.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {leg.notes && (
                      <div className="flex items-start gap-2 pt-2 border-t">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {leg.notes}
                        </p>
                      </div>
                    )}

                    {/* Received timestamp */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Received {format(new Date(leg.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Availability;
