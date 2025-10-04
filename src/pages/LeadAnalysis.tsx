import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, Plane, Users, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CallNotesDialog } from "@/components/CallNotesDialog";
import { AircraftSuggestions } from "@/components/AircraftSuggestions";
import { EmailComposer } from "@/components/EmailComposer";
import { LeadChatbot } from "@/components/LeadChatbot";
import { AircraftClassRecommendations } from "@/components/AircraftClassRecommendations";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  trip_type: "One Way" | "Round Trip";
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
  email_valid?: boolean | null;
  phone_valid?: boolean | null;
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
  const [distance, setDistance] = useState<number>(0);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean | null; loading: boolean }>({
    isValid: null,
    loading: false
  });
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean | null; loading: boolean }>({
    isValid: null,
    loading: false
  });
  const [showCallNotesDialog, setShowCallNotesDialog] = useState(false);
  const [isSpam, setIsSpam] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const handleStartProcess = async () => {
    if (!lead || !departureAirportData || !arrivalAirportData) return;
    
    // Get validation status from database or state
    const phoneIsValid = lead.phone_valid ?? phoneValidation.isValid;
    const emailIsValid = lead.email_valid ?? emailValidation.isValid;
    
    // Check if both are invalid → SPAM
    if (phoneIsValid === false && emailIsValid === false) {
      setIsSpam(true);
      toast.error("Cannot process: Invalid contact information");
      return;
    }
    
    // If phone is invalid but email is valid → skip call notes and proceed
    if (phoneIsValid === false && emailIsValid === true) {
      toast.info("Skipping call - proceeding with email contact only");
      handleCallNotesContinue("Phone invalid - email contact only", null);
      return;
    }
    
    // If phone is valid → show call notes dialog
    if (phoneIsValid === true) {
      setShowCallNotesDialog(true);
      return;
    }
    
    // If validation still in progress
    toast.error("Validation in progress, please wait");
  };

  const handleUpdateItinerary = async (updatedData: any) => {
    if (!lead) return;
    
    const leadUpdates: any = {};
    if (updatedData.departureAirport) leadUpdates.departure_airport = updatedData.departureAirport;
    if (updatedData.arrivalAirport) leadUpdates.arrival_airport = updatedData.arrivalAirport;
    if (updatedData.departureDate) leadUpdates.departure_date = updatedData.departureDate;
    if (updatedData.departureTime) leadUpdates.departure_time = updatedData.departureTime;
    if (updatedData.returnDate) leadUpdates.return_date = updatedData.returnDate;
    if (updatedData.returnTime) leadUpdates.return_time = updatedData.returnTime;
    if (updatedData.passengers) leadUpdates.passengers = updatedData.passengers;

    const { error: updateError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      toast.error('Failed to update itinerary');
    } else {
      // Refresh lead data
      const { data: updatedLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single();
      
      if (updatedLead) {
        setLead(updatedLead as Lead);
      }
    }
  };

  const handleCallNotesContinue = async (callNotes: string, updatedData?: any) => {
    if (!lead || !departureAirportData || !arrivalAirportData) return;
    
    setShowCallNotesDialog(false);
    setIsExporting(true);
    try {
      // Calculate distance
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3440.065; // Earth's radius in nautical miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
      };

      const calculatedDistance = calculateDistance(
        departureAirportData.latitude || 0,
        departureAirportData.longitude || 0,
        arrivalAirportData.latitude || 0,
        arrivalAirportData.longitude || 0
      );

      // Estimate flight time (using average speed of 450 knots)
      const flightTimeHours = calculatedDistance / 450;
      const hours = Math.floor(flightTimeHours);
      const minutes = Math.round((flightTimeHours - hours) * 60);
      const flightTimeStr = `${hours}h ${minutes}m`;

      console.log('Generating AI analysis...');
      // Generate AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('generate-flight-analysis', {
        body: {
          departure: lead.departure_airport,
          arrival: lead.arrival_airport,
          distance: calculatedDistance,
          passengers: lead.passengers,
          flightTime: flightTimeStr
        }
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        toast.error('Failed to generate analysis');
        setIsExporting(false);
        return;
      }

      const aiAnalysis = analysisData?.analysis || '';
      console.log('AI Analysis generated:', aiAnalysis);

      // Update lead with call notes and any changes
      const leadUpdates: any = {
        notes: callNotes
      };

      if (updatedData) {
        if (updatedData.departureAirport) leadUpdates.departure_airport = updatedData.departureAirport;
        if (updatedData.arrivalAirport) leadUpdates.arrival_airport = updatedData.arrivalAirport;
        if (updatedData.departureDate) leadUpdates.departure_date = updatedData.departureDate;
        if (updatedData.departureTime) leadUpdates.departure_time = updatedData.departureTime;
        if (updatedData.returnDate) leadUpdates.return_date = updatedData.returnDate;
        if (updatedData.returnTime) leadUpdates.return_time = updatedData.returnTime;
        if (updatedData.passengers) leadUpdates.passengers = updatedData.passengers;
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(leadUpdates)
        .eq('id', lead.id);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        toast.error('Failed to save call notes');
      }

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
        
        // Analysis Data
        distance: calculatedDistance,
        flightTime: flightTimeStr,
        aiAnalysis: aiAnalysis,
        
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

  useEffect(() => {
    const validateEmail = async () => {
      if (!lead?.email) return;
      
      // If we already have validation from database, use it
      if (lead.email_valid !== null && lead.email_valid !== undefined) {
        setEmailValidation({ isValid: lead.email_valid, loading: false });
        return;
      }
      
      setEmailValidation({ isValid: null, loading: true });
      
      try {
        const { data, error } = await supabase.functions.invoke('validate-email', {
          body: { email: lead.email }
        });

        if (error) {
          console.error('Email validation error:', error);
          // On error, assume valid (benefit of the doubt)
          setEmailValidation({ isValid: true, loading: false });
          return;
        }

        const isValid = data?.isValid ?? true; // Default to true if validation fails
        setEmailValidation({ 
          isValid, 
          loading: false 
        });

        // Check if both email and phone are invalid
        const phoneIsValid = lead.phone_valid ?? phoneValidation.isValid;
        if (isValid === false && phoneIsValid === false) {
          setIsSpam(true);
        }

        // Update database with validation result
        await supabase
          .from('leads')
          .update({ email_valid: isValid })
          .eq('id', lead.id);
      } catch (error) {
        console.error('Email validation error:', error);
        // On error, assume valid (benefit of the doubt)
        setEmailValidation({ isValid: true, loading: false });
      }
    };

    validateEmail();
  }, [lead?.email, lead?.id, lead?.email_valid]);

  useEffect(() => {
    const validatePhone = async () => {
      if (!lead?.phone) return;
      
      // If we already have validation from database, use it
      if (lead.phone_valid !== null && lead.phone_valid !== undefined) {
        setPhoneValidation({ isValid: lead.phone_valid, loading: false });
        return;
      }
      
      setPhoneValidation({ isValid: null, loading: true });
      
      try {
        const { data, error } = await supabase.functions.invoke('validate-phone', {
          body: { phone: lead.phone }
        });

        if (error) {
          console.error('Phone validation error:', error);
          // On error, assume valid (benefit of the doubt)
          setPhoneValidation({ isValid: true, loading: false });
          return;
        }

        const isValid = data?.isValid ?? true; // Default to true if validation fails
        setPhoneValidation({ 
          isValid, 
          loading: false 
        });

        // Check if both email and phone are invalid
        const emailIsValid = lead.email_valid ?? emailValidation.isValid;
        if (isValid === false && emailIsValid === false) {
          setIsSpam(true);
        }

        // Update database with validation result
        await supabase
          .from('leads')
          .update({ phone_valid: isValid })
          .eq('id', lead.id);
      } catch (error) {
        console.error('Phone validation error:', error);
        // On error, assume valid (benefit of the doubt)
        setPhoneValidation({ isValid: true, loading: false });
      }
    };

    validatePhone();
  }, [lead?.phone, lead?.id, lead?.phone_valid]);

  const extractAirportCode = async (airportString: string): Promise<string | null> => {
    try {
      // Try simple extraction first - common formats: "SEA (Seattle)", "JFK - New York", etc.
      const simpleMatch = airportString.match(/^([A-Z]{3})/);
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

      // Check for spam on load
      if (data.email_valid === false && data.phone_valid === false) {
        setIsSpam(true);
      }

      // Fetch both airports in parallel
      try {
        const [depAirport, arrAirport] = await Promise.all([
          data.departure_airport ? fetchAirportData(data.departure_airport) : Promise.resolve(null),
          data.arrival_airport ? fetchAirportData(data.arrival_airport) : Promise.resolve(null)
        ]);

        if (depAirport) {
          setDepartureAirportData(depAirport);
        } else if (data.departure_airport) {
          console.warn('Could not fetch departure airport data for:', data.departure_airport);
        }

        if (arrAirport) {
          setArrivalAirportData(arrAirport);
        } else if (data.arrival_airport) {
          console.warn('Could not fetch arrival airport data for:', data.arrival_airport);
        }

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
          console.log('Distance calculated:', calculatedDistance, 'NM');
        }
      } catch (airportError) {
        console.error("Error fetching airport data:", airportError);
        toast.error("Could not load airport information");
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while loading the lead");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    // Parse time string (format: "HH:mm:ss" or "HH:mm")
    const timeParts = timeString.split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${hours}:${minutes} ${ampm}`;
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
            {isSpam && (
              <span className="text-red-600 font-bold text-lg mr-4">SPAM</span>
            )}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {emailValidation.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : emailValidation.isValid === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : emailValidation.isValid === false ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                  {phoneValidation.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : phoneValidation.isValid === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : phoneValidation.isValid === false ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : null}
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
                    {lead.trip_type}
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
                    <span>{formatTime(lead.departure_time)}</span>
                  </div>
                </div>
                {lead.trip_type === "Round Trip" && lead.return_date && (
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
                        <span>{formatTime(lead.return_time || '')}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            </div>

            {/* Route Overview with Distance */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Route Overview
                </CardTitle>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border-2 border-primary/20">
                  <div className="flex gap-1">
                    {lead.trip_type === "Round Trip" ? (
                      <>
                        <Plane className="h-5 w-5 text-primary rotate-90" />
                        <Plane className="h-5 w-5 text-primary -rotate-90" />
                      </>
                    ) : (
                      <Plane className="h-5 w-5 text-primary rotate-90" />
                    )}
                  </div>
                  <span className="font-semibold text-primary text-sm">
                    {lead.trip_type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {departureAirportData?.code || lead.departure_airport.split(' ')[0]}
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
                    <div className="text-center mb-3">
                      <div className="text-lg font-bold text-foreground mb-1">
                        {format(new Date(lead.departure_date), "MMM dd, yyyy")}
                      </div>
                      {lead.departure_time && (
                        <div className="text-base font-semibold text-primary">
                          {formatTime(lead.departure_time)}
                        </div>
                      )}
                    </div>
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
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round(distance * 1.15).toLocaleString()} statute mi
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {arrivalAirportData?.code || lead.arrival_airport.split(' ')[0]}
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

                {/* Return Route for Round Trips */}
                {lead.trip_type === "Round Trip" && lead.return_date && (
                  <div className="flex items-center justify-between mb-6 pt-4 border-t">
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {arrivalAirportData?.code || lead.arrival_airport.split(' ')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Return From
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center px-4">
                      <div className="text-center mb-3">
                        <div className="text-lg font-bold text-foreground mb-1">
                          {format(new Date(lead.return_date), "MMM dd, yyyy")}
                        </div>
                        {lead.return_time && (
                          <div className="text-base font-semibold text-secondary">
                            {formatTime(lead.return_time)}
                          </div>
                        )}
                      </div>
                      <div className="w-full h-px bg-border relative mb-2">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Plane className="h-4 w-4 text-secondary -rotate-90" />
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <div className="text-xl font-bold text-foreground">
                          {distance > 0 ? distance.toLocaleString() : '---'}
                        </div>
                        <div className="text-xs text-muted-foreground">nautical miles</div>
                      </div>
                    </div>
                    
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {departureAirportData?.code || lead.departure_airport.split(' ')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Return To
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Passengers</div>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {lead.passengers}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Departure Date</div>
                    <div className="text-sm font-medium">
                      {format(new Date(lead.departure_date), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aircraft Class Recommendations */}
            <Card>
            <CardHeader>
              <CardTitle>Aircraft Class Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Minimum and optimal aircraft classes for this route
              </p>
            </CardHeader>
            <CardContent>
              {!loading && (!departureAirportData || !arrivalAirportData || distance === 0) ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Could not load complete airport data. Please check the airport codes.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Departure: {lead.departure_airport} {departureAirportData ? '✓' : '✗'}<br/>
                    Arrival: {lead.arrival_airport} {arrivalAirportData ? '✓' : '✗'}
                  </p>
                </div>
              ) : departureAirportData && arrivalAirportData && distance > 0 ? (
                <AircraftClassRecommendations
                  distance={distance}
                  passengers={lead.passengers}
                  minRunway={Math.min(
                    departureAirportData?.runwayLength || 10000,
                    arrivalAirportData?.runwayLength || 10000
                  )}
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

          {/* Right Column - Chatbot & Actions */}
          <div className="space-y-6">
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
                    variant="default"
                    onClick={handleStartProcess}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Starting...' : 'Start Process'}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setShowEmailComposer(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Compose Email
                  </Button>
                  <Button className="w-full" variant="outline">
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Chatbot */}
            <div className="h-[600px]">
              <LeadChatbot
                lead={lead}
                departureAirport={departureAirportData}
                arrivalAirport={arrivalAirportData}
                distance={distance}
                onUpdateLead={(updates) => {
                  // Handle lead updates from chatbot
                  console.log('Lead updates from chatbot:', updates);
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <CallNotesDialog
        open={showCallNotesDialog}
        onOpenChange={setShowCallNotesDialog}
        phoneNumber={lead.phone}
        leadData={lead}
        onContinue={handleCallNotesContinue}
        onUpdateItinerary={handleUpdateItinerary}
      />

      {lead && (
        <EmailComposer
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          leadData={{
            ...lead,
            trip_type: lead.trip_type === "Round Trip" ? "round-trip" : "one-way"
          }}
        />
      )}
    </div>
  );
}