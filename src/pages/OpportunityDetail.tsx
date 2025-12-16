import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Calendar, Plane, Users, MapPin, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AirportSearch } from "@/components/AirportSearch";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  name: string;
  account_id: string;
  stage: string;
  amount: number | null;
  probability: number | null;
  expected_close_date: string | null;
  description: string | null;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_datetime?: string;
  return_datetime?: string;
  return_date?: string;
  passengers: number;
  trip_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface Account {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
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

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [departureAirportData, setDepartureAirportData] = useState<Airport | null>(null);
  const [arrivalAirportData, setArrivalAirportData] = useState<Airport | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOpportunity, setEditedOpportunity] = useState<Partial<Opportunity>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOpportunity(id);
    }
  }, [id]);

  const extractAirportCode = async (airportString: string): Promise<string | null> => {
    try {
      // Try simple extraction first - match 3-4 letter uppercase codes anywhere in string
      // Handles formats: "SEA", "JFK (New York)", "Teterboro - TEB", "KJFK", etc.
      const simpleMatch = airportString.match(/\b([A-Z]{3,4})\b/);
      if (simpleMatch) {
        return simpleMatch[1];
      }

      // If that doesn't work, use AI to extract
      console.log('Using AI to extract airport code from:', airportString);
      const { data, error } = await supabase.functions.invoke('extract-airports', {
        body: { text: `Extract airport code from: ${airportString}` }
      });

      if (error || data.error) {
        console.error('Error extracting airport code:', error || data.error);
        return null;
      }

      // Return the first code extracted (departure or arrival, doesn't matter which)
      return data.departure || data.arrival || null;
    } catch (error) {
      console.error('Error extracting airport code:', error);
      return null;
    }
  };

  const fetchAirportData = async (airportString: string): Promise<Airport | null> => {
    try {
      // Extract clean airport code using AI if needed
      const airportCode = await extractAirportCode(airportString);

      if (!airportCode) {
        console.error('Could not extract airport code from:', airportString);
        return null;
      }

      console.log('Extracted airport code:', airportCode, 'from:', airportString);

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

  const fetchOpportunity = async (opportunityId: string) => {
    try {
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .single();

      if (oppError) {
        console.error("Error fetching opportunity:", oppError);
        toast.error("Failed to load opportunity information");
        setLoading(false);
        return;
      }

      setOpportunity(oppData as Opportunity);

      // Fetch account data
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", oppData.account_id)
        .single();

      if (accountError) {
        console.error("Error fetching account:", accountError);
      } else {
        setAccount(accountData as Account);
      }

      // Fetch airport data
      try {
        const [depAirport, arrAirport] = await Promise.all([
          oppData.departure_airport ? fetchAirportData(oppData.departure_airport) : Promise.resolve(null),
          oppData.arrival_airport ? fetchAirportData(oppData.arrival_airport) : Promise.resolve(null)
        ]);

        if (depAirport) setDepartureAirportData(depAirport);
        if (arrAirport) setArrivalAirportData(arrAirport);

        // Calculate distance if we have both airports with coordinates
        if (depAirport && arrAirport &&
            depAirport.latitude && depAirport.longitude &&
            arrAirport.latitude && arrAirport.longitude) {
          const R = 3440.065; // Earth's radius in nautical miles
          const dLat = (arrAirport.latitude - depAirport.latitude) * Math.PI / 180;
          const dLon = (arrAirport.longitude - depAirport.longitude) * Math.PI / 180;

          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(depAirport.latitude * Math.PI / 180) * Math.cos(arrAirport.latitude * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const calculatedDistance = Math.round(R * c);
          setDistance(calculatedDistance);
        }
      } catch (airportError) {
        console.error("Error fetching airport data:", airportError);
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while loading the opportunity");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!opportunity) return;

    setIsSaving(true);
    try {
      const updates: any = {};

      // Only update fields that have been edited
      if (editedOpportunity.departure_airport !== undefined) {
        updates.departure_airport = editedOpportunity.departure_airport;
      }
      if (editedOpportunity.arrival_airport !== undefined) {
        updates.arrival_airport = editedOpportunity.arrival_airport;
      }
      if (editedOpportunity.departure_date !== undefined) {
        updates.departure_date = editedOpportunity.departure_date;
      }
      if (editedOpportunity.departure_datetime !== undefined) {
        updates.departure_datetime = editedOpportunity.departure_datetime;
      }
      if (editedOpportunity.return_date !== undefined) {
        updates.return_date = editedOpportunity.return_date;
      }
      if (editedOpportunity.return_datetime !== undefined) {
        updates.return_datetime = editedOpportunity.return_datetime;
      }
      if (editedOpportunity.passengers !== undefined) {
        updates.passengers = editedOpportunity.passengers;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditMode(false);
        return;
      }

      const { error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', opportunity.id);

      if (error) throw error;

      // Update local state
      setOpportunity({ ...opportunity, ...updates });
      setEditedOpportunity({});
      setIsEditMode(false);
      toast.success('Trip information updated successfully');

      // Refetch airport data if airports changed
      if (updates.departure_airport || updates.arrival_airport) {
        const [depAirport, arrAirport] = await Promise.all([
          updates.departure_airport ? fetchAirportData(updates.departure_airport) : Promise.resolve(departureAirportData),
          updates.arrival_airport ? fetchAirportData(updates.arrival_airport) : Promise.resolve(arrivalAirportData)
        ]);

        if (depAirport) setDepartureAirportData(depAirport);
        if (arrAirport) setArrivalAirportData(arrAirport);
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast.error('Failed to update trip information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedOpportunity({});
    setIsEditMode(false);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "prospecting": return "bg-blue-100 text-blue-800";
      case "qualification": return "bg-yellow-100 text-yellow-800";
      case "proposal": return "bg-purple-100 text-purple-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed_won": return "bg-green-100 text-green-800";
      case "closed_lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString + 'T00:00:00'), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatFlightTime = () => {
    if (distance > 0) {
      const flightTimeHours = distance / 450; // Average speed of 450 knots
      const hours = Math.floor(flightTimeHours);
      const minutes = Math.round((flightTimeHours - hours) * 60);
      return `~${hours}h ${minutes}m`;
    }
    return 'Calculating...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading opportunity information...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Opportunity Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested opportunity could not be found.</p>
          <Button asChild>
            <Link to="/accounts">Return to Accounts</Link>
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
          <Link to="/accounts" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Accounts
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge className={getStageColor(opportunity.stage)}>
              {opportunity.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Opportunity #{opportunity.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Opportunity Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-heading font-semibold text-xl text-primary">
                    {account?.name || "Unknown Account"}
                  </p>
                  {account?.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4" />
                      {account.company}
                    </p>
                  )}
                </div>
                {account?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${account.email}`} className="hover:underline">
                      {account.email}
                    </a>
                  </div>
                )}
                {account?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${account.phone}`} className="hover:underline">
                      {account.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Information */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Trip Information
                </CardTitle>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditMode) {
                      handleSaveChanges();
                    } else {
                      setIsEditMode(true);
                      setEditedOpportunity({
                        departure_airport: opportunity.departure_airport,
                        arrival_airport: opportunity.arrival_airport,
                        departure_date: opportunity.departure_date,
                        departure_datetime: opportunity.departure_datetime,
                        return_date: opportunity.return_date,
                        return_datetime: opportunity.return_datetime,
                        passengers: opportunity.passengers,
                      });
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Edit"}
                </Button>
                {isEditMode && (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {/* Route Visualization */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {departureAirportData?.code || (opportunity.departure_airport.includes(' - ')
                        ? opportunity.departure_airport.split(' - ')[0]
                        : opportunity.departure_airport)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {departureAirportData?.city || 'Departure'}
                    </div>
                    {departureAirportData?.runwayLength && (
                      <div className={`text-xs font-semibold mt-1 ${
                        departureAirportData.runwayLength >= 6000
                          ? 'text-green-600'
                          : departureAirportData.runwayLength >= 5000
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        RWY: {departureAirportData.runwayLength.toLocaleString()}ft
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center px-4">
                    <Badge variant="outline" className="mb-3">
                      {opportunity.trip_type === 'one-way' ? 'One Way' : opportunity.trip_type === 'round-trip' ? 'Round Trip' : 'Multi-Leg'}
                    </Badge>
                    <div className="w-full h-px bg-border relative mb-2">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Plane className="h-4 w-4 text-primary rotate-90" />
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xl font-bold text-foreground">
                        {distance > 0 ? distance.toLocaleString() : '---'}
                      </div>
                      <div className="text-xs text-muted-foreground">nautical miles</div>
                      {distance > 0 && (
                        <div className="text-sm font-semibold text-primary mt-2">
                          {formatFlightTime()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {arrivalAirportData?.code || (opportunity.arrival_airport.includes(' - ')
                        ? opportunity.arrival_airport.split(' - ')[0]
                        : opportunity.arrival_airport)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {arrivalAirportData?.city || 'Arrival'}
                    </div>
                    {arrivalAirportData?.runwayLength && (
                      <div className={`text-xs font-semibold mt-1 ${
                        arrivalAirportData.runwayLength >= 6000
                          ? 'text-green-600'
                          : arrivalAirportData.runwayLength >= 5000
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        RWY: {arrivalAirportData.runwayLength.toLocaleString()}ft
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Trip Details */}
                {!isEditMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Departure</p>
                      <p className="font-semibold">
                        {formatDate(opportunity.departure_date)}
                        {opportunity.departure_datetime && (
                          <span className="text-sm text-muted-foreground ml-2">
                            @ {format(new Date(opportunity.departure_datetime), 'h:mm a')}
                          </span>
                        )}
                      </p>
                    </div>
                    {opportunity.trip_type === "round-trip" && opportunity.return_date && (
                      <div>
                        <p className="text-muted-foreground text-xs">Return</p>
                        <p className="font-semibold">
                          {formatDate(opportunity.return_date)}
                          {opportunity.return_datetime && (
                            <span className="text-sm text-muted-foreground ml-2">
                              @ {format(new Date(opportunity.return_datetime), 'h:mm a')}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-xs">Passengers</p>
                      <p className="font-semibold">{opportunity.passengers} Passenger{opportunity.passengers !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Departure Airport</Label>
                        <AirportSearch
                          value={editedOpportunity.departure_airport || opportunity.departure_airport}
                          onChange={(value, airport) => {
                            setEditedOpportunity({
                              ...editedOpportunity,
                              departure_airport: airport?.code || value
                            });
                          }}
                          placeholder="Search departure airport"
                        />
                      </div>
                      <div>
                        <Label>Arrival Airport</Label>
                        <AirportSearch
                          value={editedOpportunity.arrival_airport || opportunity.arrival_airport}
                          onChange={(value, airport) => {
                            setEditedOpportunity({
                              ...editedOpportunity,
                              arrival_airport: airport?.code || value
                            });
                          }}
                          placeholder="Search arrival airport"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Departure Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={editedOpportunity.departure_datetime || opportunity.departure_datetime || ''}
                          onChange={(e) => {
                            const datetime = e.target.value;
                            setEditedOpportunity({
                              ...editedOpportunity,
                              departure_datetime: datetime,
                              departure_date: datetime.split('T')[0]
                            });
                          }}
                        />
                      </div>
                      {opportunity.trip_type === 'round-trip' && (
                        <div>
                          <Label>Return Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={editedOpportunity.return_datetime || opportunity.return_datetime || ''}
                            onChange={(e) => {
                              const datetime = e.target.value;
                              setEditedOpportunity({
                                ...editedOpportunity,
                                return_datetime: datetime,
                                return_date: datetime.split('T')[0]
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Passengers</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editedOpportunity.passengers !== undefined ? editedOpportunity.passengers : opportunity.passengers}
                          onChange={(e) => {
                            setEditedOpportunity({
                              ...editedOpportunity,
                              passengers: parseInt(e.target.value)
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {opportunity.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{opportunity.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Deal Info & Actions */}
          <div className="space-y-6">
            {/* Deal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opportunity Name</p>
                  <p className="text-sm font-semibold">{opportunity.name}</p>
                </div>
                {opportunity.amount && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-lg font-bold text-primary flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {opportunity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {opportunity.probability !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Probability</p>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {opportunity.probability}%
                    </p>
                  </div>
                )}
                {opportunity.expected_close_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDate(opportunity.expected_close_date)}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">
                    {format(new Date(opportunity.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stage</p>
                  <Badge className={getStageColor(opportunity.stage)}>
                    {opportunity.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
