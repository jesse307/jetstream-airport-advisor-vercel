import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, Plane, Users, MapPin } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FlightCalculator } from "@/components/FlightCalculator";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  trip_type: "one-way" | "round-trip";
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  return_date?: string;
  return_time?: string;
  passengers: number;
  status: string;
  notes?: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

interface Airport {
  code: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  type: string;
  runwayLength?: number | null;
  fbo?: string[] | string | null;
  latitude?: number;
  longitude?: number;
}

export default function LeadAnalysis() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [departureAirportData, setDepartureAirportData] = useState<Airport | null>(null);
  const [arrivalAirportData, setArrivalAirportData] = useState<Airport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleStartProcess = async () => {
    if (!lead) return;
    
    setIsExporting(true);
    try {
      // Prepare data for Make webhook
      const exportData = {
        // Contact Information
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email,
        phone: lead.phone || '',
        
        // Flight Details
        tripType: lead.trip_type,
        departureAirport: lead.departure_airport,
        arrivalAirport: lead.arrival_airport,
        departureDate: format(new Date(lead.departure_date), "MM/dd/yyyy"),
        departureTime: lead.departure_time,
        returnDate: lead.return_date ? format(new Date(lead.return_date), "MM/dd/yyyy") : '',
        returnTime: lead.return_time || '',
        passengers: lead.passengers,
        notes: lead.notes || '',
        
        // Meta Information
        leadId: lead.id,
        createdAt: format(new Date(lead.created_at), "MM/dd/yyyy hh:mm a"),
        status: lead.status
      };

      const { data, error } = await supabase.functions.invoke('trigger-make-webhook', {
        body: { leadData: exportData }
      });

      if (error) {
        console.error('Process error:', error);
        toast.error('Failed to start process');
        return;
      }

      console.log('Make webhook response:', data);
      toast.success('Process started successfully!');
    } catch (error) {
      console.error('Process error:', error);
      toast.error('Failed to start process');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLead(id);
    }
  }, [id]);

  const fetchAirportData = async (airportString: string): Promise<Airport | null> => {
    try {
      // Extract airport code from format "TEB - Teterboro, Teterboro"
      const airportCode = airportString.split(' - ')[0].trim();
      
      const { data, error } = await supabase.functions.invoke('search-airports', {
        body: { query: airportCode }
      });

      if (error) {
        console.error('Error fetching airport data:', error);
        return null;
      }

      // Find the matching airport from results
      const airports = data.airports || [];
      const matchingAirport = airports.find((airport: Airport) => 
        airport.code === airportCode || 
        airport.code === `K${airportCode}` ||
        airport.code.replace('K', '') === airportCode
      );

      return matchingAirport || null;
    } catch (error) {
      console.error('Error fetching airport data:', error);
      return null;
    }
  };

  const fetchLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (error) {
        console.error("Error fetching lead:", error);
        toast.error("Failed to load lead information");
        return;
      }

      setLead(data as Lead);

      // Fetch airport data with coordinates
      if (data.departure_airport) {
        const depAirport = await fetchAirportData(data.departure_airport);
        if (depAirport) {
          setDepartureAirportData(depAirport);
        }
      }

      if (data.arrival_airport) {
        const arrAirport = await fetchAirportData(data.arrival_airport);
        if (arrAirport) {
          setArrivalAirportData(arrAirport);
        }
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while loading the lead");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "quoted": return "bg-purple-100 text-purple-800";
      case "booked": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lead information...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Lead Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested lead could not be found.</p>
          <Button asChild>
            <Link to="/">Return to Calculator</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Calculator
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Lead #{lead.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Lead Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-heading font-semibold text-xl text-primary">
                    {lead.first_name} {lead.last_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="hover:underline">
                    {lead.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.passengers} passenger{lead.passengers !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>

            {/* Flight Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Flight Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {lead.trip_type === "round-trip" ? "Round Trip" : "One Way"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">From:</span>
                    <span>{lead.departure_airport}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">To:</span>
                    <span>{lead.arrival_airport}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Departure:</span>
                    <span>{format(new Date(lead.departure_date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span>{lead.departure_time}</span>
                  </div>
                </div>
                {lead.trip_type === "round-trip" && lead.return_date && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Return:</span>
                        <span>{format(new Date(lead.return_date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span>{lead.return_time}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lead Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Created</p>
                  <p className="text-sm">
                    {format(new Date(lead.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </div>
                {lead.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{lead.notes}</p>
                  </div>
                )}
                <div className="pt-4 space-y-2">
                  <Button 
                    className="w-full" 
                    variant="aviation"
                    onClick={handleStartProcess}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Starting...' : 'Start Process'}
                  </Button>
                  <Button className="w-full" variant="outline">
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flight Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Flight Analysis & Aircraft Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on the route and passenger requirements
              </p>
            </CardHeader>
            <CardContent>
              {departureAirportData && arrivalAirportData ? (
                <FlightCalculator 
                  departure={lead.departure_airport} 
                  arrival={lead.arrival_airport}
                  initialPassengers={lead.passengers}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading airport data for analysis...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
}