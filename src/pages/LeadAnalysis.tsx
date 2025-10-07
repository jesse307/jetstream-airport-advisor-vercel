import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Phone, Mail, Calendar, Clock, Plane, Users, MapPin, CheckCircle2, XCircle, Settings, ClipboardList, Send, Trophy, Edit2, Save } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AirportSearch } from "@/components/AirportSearch";
import { CallNotesDialog } from "@/components/CallNotesDialog";
import { AircraftSuggestions } from "@/components/AircraftSuggestions";
import { EmailComposer } from "@/components/EmailComposer";
import { LeadChatbot } from "@/components/LeadChatbot";
import { AircraftClassRecommendations } from "@/components/AircraftClassRecommendations";
import { CharterQuoteRequest } from "@/components/CharterQuoteRequest";

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
  departure_datetime?: string;
  return_datetime?: string;
  // Legacy columns (kept for backward compatibility)
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
  const [flightTimeMinutes, setFlightTimeMinutes] = useState<number | null>(null);
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
  const [showAviapagesPreview, setShowAviapagesPreview] = useState(false);
  const [isPostingToAviapages, setIsPostingToAviapages] = useState(false);
  const [footballEvents, setFootballEvents] = useState<{ departure: any[], arrival: any[] }>({ departure: [], arrival: [] });
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    departureAirport: '',
    arrivalAirport: '',
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    passengers: 1
  });
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to format date from timestamp
  const formatDate = (datetime: string | undefined, fallbackDate?: string) => {
    if (datetime) {
      return format(new Date(datetime), "MMM dd, yyyy");
    }
    if (fallbackDate) {
      return format(new Date(fallbackDate + 'T00:00:00'), "MMM dd, yyyy");
    }
    return "N/A";
  };

  // Helper function to get time from timestamp
  const getTime = (datetime: string | undefined, fallbackTime?: string) => {
    if (datetime) {
      return format(new Date(datetime), "HH:mm:ss");
    }
    return fallbackTime || "12:00:00";
  };

  const handleAddToTripBoard = async () => {
    if (!lead) return;
    
    const { error } = await supabase
      .from('leads')
      .update({ status: 'qualified' })
      .eq('id', lead.id);
    
    if (error) {
      toast.error('Failed to add to trip board');
      return;
    }
    
    setLead({ ...lead, status: 'qualified' });
    toast.success('Added to trip board');
  };

  const handleOpenAviapagesPreview = () => {
    if (!lead || !departureAirportData || !arrivalAirportData) {
      toast.error('Missing airport data');
      return;
    }
    setShowAviapagesPreview(true);
  };

  const handleConfirmPostToAviapages = async () => {
    if (!lead || !departureAirportData || !arrivalAirportData) {
      return;
    }

    setIsPostingToAviapages(true);

    try {
      const legs = [];
      
      // Format datetime for Aviapages (local time without timezone)
      const formatDateTimeForAviapages = (date: string, time?: string | null) => {
        const timeStr = time || '12:00:00';
        // Remove seconds if present and format as HH:MM
        const formattedTime = timeStr.substring(0, 5);
        return `${date}T${formattedTime}`;
      };
      
      // Departure leg
      legs.push({
        departure_airport: { iata: departureAirportData.code },
        arrival_airport: { iata: arrivalAirportData.code },
        pax: lead.passengers,
        departure_datetime: formatDateTimeForAviapages(lead.departure_date, lead.departure_time)
      });

      // Return leg if round trip
      if (lead.trip_type === 'Round Trip' && lead.return_date) {
        legs.push({
          departure_airport: { iata: arrivalAirportData.code },
          arrival_airport: { iata: departureAirportData.code },
          pax: lead.passengers,
          departure_datetime: formatDateTimeForAviapages(lead.return_date, lead.return_time)
        });
      }

      const requestBody = {
        legs,
        contact_name: 'Jesse Marsh - Stratos Jets',
        contact_email: 'jesse@stratosjets.com',
        contact_phone: '973-784-8000',
        notes: lead.notes || '',
        currency_code: 'USD'
      };

      const { data, error } = await supabase.functions.invoke('request-charter-quotes', {
        body: requestBody
      });

      if (error) {
        console.error('Aviapages error:', error);
        toast.error('Failed to post to Aviapages');
        setIsPostingToAviapages(false);
        return;
      }

      if (!data.success) {
        console.error('Aviapages API error:', data);
        toast.error(`Failed to post: ${data.error || 'Unknown error'}`);
        setIsPostingToAviapages(false);
        return;
      }

      // Update lead status
      await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', lead.id);

      setLead({ ...lead, status: 'qualified' });
      setShowAviapagesPreview(false);
      setIsPostingToAviapages(false);
      
      // Show success message
      toast.success('🎉 Trip successfully posted to Aviapages!', {
        description: 'Charter operators will now be able to see your trip and provide quotes.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error posting to Aviapages:', error);
      toast.error('Failed to post to Aviapages');
      setIsPostingToAviapages(false);
    }
  };

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
    const airportsChanged = 
      (updatedData.departureAirport && updatedData.departureAirport !== lead.departure_airport) ||
      (updatedData.arrivalAirport && updatedData.arrivalAirport !== lead.arrival_airport);
    
    if (updatedData.departureAirport) leadUpdates.departure_airport = updatedData.departureAirport;
    if (updatedData.arrivalAirport) leadUpdates.arrival_airport = updatedData.arrivalAirport;
    
    // Handle datetime updates from chatbot (new format)
    if (updatedData.departureDatetime) {
      const dt = new Date(updatedData.departureDatetime);
      leadUpdates.departure_datetime = dt.toISOString();
      leadUpdates.departure_date = dt.toISOString().split('T')[0];
      leadUpdates.departure_time = dt.toTimeString().split(' ')[0];
    } else if (updatedData.departureDate || updatedData.departureTime) {
      // Handle legacy format (old columns)
      const date = updatedData.departureDate || lead.departure_date;
      const time = updatedData.departureTime || lead.departure_time;
      leadUpdates.departure_datetime = new Date(`${date}T${time}`).toISOString();
      leadUpdates.departure_date = date;
      leadUpdates.departure_time = time;
    }
    
    if (updatedData.returnDatetime) {
      const dt = new Date(updatedData.returnDatetime);
      leadUpdates.return_datetime = dt.toISOString();
      leadUpdates.return_date = dt.toISOString().split('T')[0];
      leadUpdates.return_time = dt.toTimeString().split(' ')[0];
    } else if (updatedData.returnDate || updatedData.returnTime) {
      // Handle legacy format (old columns)
      const date = updatedData.returnDate || lead.return_date;
      const time = updatedData.returnTime || lead.return_time;
      if (date && time) {
        leadUpdates.return_datetime = new Date(`${date}T${time}`).toISOString();
        leadUpdates.return_date = date;
        leadUpdates.return_time = time;
      }
    }
    
    if (updatedData.passengers) leadUpdates.passengers = updatedData.passengers;
    if (updatedData.tripType) leadUpdates.trip_type = updatedData.tripType;

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
        
        // If airports changed, refetch airport data
        if (airportsChanged) {
          const [depAirport, arrAirport] = await Promise.all([
            updatedLead.departure_airport ? fetchAirportData(updatedLead.departure_airport) : Promise.resolve(null),
            updatedLead.arrival_airport ? fetchAirportData(updatedLead.arrival_airport) : Promise.resolve(null)
          ]);

          if (depAirport) setDepartureAirportData(depAirport);
          if (arrAirport) setArrivalAirportData(arrAirport);

          // Recalculate distance if we have both airports with coordinates
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
        }
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
        departureDate: format(new Date(lead.departure_date + 'T00:00:00'), "MM/dd/yyyy"),
        departureTime: lead.departure_time,
        returnDate: lead.return_date ? format(new Date(lead.return_date + 'T00:00:00'), "MM/dd/yyyy") : '',
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

  // Initialize edit data when lead loads
  useEffect(() => {
    if (lead) {
      setEditedData({
        departureAirport: lead.departure_airport,
        arrivalAirport: lead.arrival_airport,
        departureDate: lead.departure_date,
        departureTime: lead.departure_time,
        returnDate: lead.return_date || '',
        returnTime: lead.return_time || '',
        passengers: lead.passengers
      });
    }
  }, [lead]);

  const handleSaveChanges = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      const updates: any = {};
      
      if (editedData.departureAirport !== lead.departure_airport) {
        updates.departureAirport = editedData.departureAirport;
      }
      if (editedData.arrivalAirport !== lead.arrival_airport) {
        updates.arrivalAirport = editedData.arrivalAirport;
      }
      if (editedData.departureDate !== lead.departure_date) {
        updates.departureDate = editedData.departureDate;
      }
      if (editedData.departureTime !== lead.departure_time) {
        updates.departureTime = editedData.departureTime;
      }
      if (editedData.returnDate !== (lead.return_date || '')) {
        updates.returnDate = editedData.returnDate;
      }
      if (editedData.returnTime !== (lead.return_time || '')) {
        updates.returnTime = editedData.returnTime;
      }
      if (editedData.passengers !== lead.passengers) {
        updates.passengers = editedData.passengers;
      }
      
      if (Object.keys(updates).length > 0) {
        await handleUpdateItinerary(updates);
        toast.success('Trip details updated successfully');
      }
      
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchFootballEvents = async () => {
      if (!departureAirportData?.latitude || !departureAirportData?.longitude ||
          !arrivalAirportData?.latitude || !arrivalAirportData?.longitude || !lead) return;
      
      setLoadingEvents(true);
      try {
        const startDate = lead.departure_datetime || lead.departure_date;
        const endDate = lead.return_datetime || lead.return_date || startDate;

        const [depEvents, arrEvents] = await Promise.all([
          supabase.functions.invoke('get-football-events', {
            body: { 
              airportLat: departureAirportData.latitude,
              airportLon: departureAirportData.longitude,
              startDate,
              endDate 
            }
          }),
          supabase.functions.invoke('get-football-events', {
            body: { 
              airportLat: arrivalAirportData.latitude,
              airportLon: arrivalAirportData.longitude,
              startDate,
              endDate 
            }
          })
        ]);

        setFootballEvents({
          departure: depEvents.data?.games || [],
          arrival: arrEvents.data?.games || []
        });
      } catch (error) {
        console.error('Error fetching football events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchFootballEvents();
  }, [departureAirportData, arrivalAirportData, lead]);

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
        
        // Check if it's a "not found" error
        if (error.code === 'PGRST116') {
          toast.error("Lead not found");
          setLoading(false);
          // Redirect to CRM page after a moment
          setTimeout(() => {
            window.location.href = '/crm';
          }, 2000);
          return;
        }
        
        toast.error("Failed to load lead information");
        setLoading(false);
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

          // Fetch accurate flight time from AeroDataBox
          try {
            const { data: flightTimeData } = await supabase.functions.invoke('search-airports', {
              body: {
                calculateFlightTime: true,
                departure: depAirport.code,
                arrival: arrAirport.code,
                aircraftType: 'Citation XLS+', // Use mid-size jet as default
                passengers: data.passengers
              }
            });

            if (flightTimeData?.success && flightTimeData?.flightTime?.time?.airway) {
              setFlightTimeMinutes(flightTimeData.flightTime.time.airway);
              console.log('Flight time from AeroDataBox:', flightTimeData.flightTime.time.airway, 'minutes');
            }
          } catch (flightTimeError) {
            console.error('Error fetching flight time:', flightTimeError);
            // Continue without flight time - will use estimation
          }
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

  const formatFlightTime = () => {
    if (flightTimeMinutes) {
      const hours = Math.floor(flightTimeMinutes / 60);
      const minutes = flightTimeMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    // Fallback to estimation
    if (distance > 0) {
      const flightTimeHours = distance / 450;
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
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
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
                
                <Separator />
                
                {/* Flight TL;DR */}
                <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Flight Summary</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        {departureAirportData?.code || (lead.departure_airport.includes(' - ') 
                          ? lead.departure_airport.split(' - ')[0] 
                          : lead.departure_airport)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-bold text-primary">
                        {arrivalAirportData?.code || (lead.arrival_airport.includes(' - ')
                          ? lead.arrival_airport.split(' - ')[0]
                          : lead.arrival_airport)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {lead.trip_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(lead.departure_datetime, lead.departure_date)} @ {formatTime(getTime(lead.departure_datetime, lead.departure_time))}</span>
                  </div>
                  {lead.trip_type === "Round Trip" && (lead.return_datetime || lead.return_date) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(lead.return_datetime, lead.return_date)} @ {formatTime(getTime(lead.return_datetime, lead.return_time))}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{lead.passengers} Passenger{lead.passengers !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Overview with Distance */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Route Overview
                </CardTitle>
              </CardHeader>
              <CardContent>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {departureAirportData?.code || (lead.departure_airport.includes(' - ')
                        ? lead.departure_airport.split(' - ')[0]
                        : lead.departure_airport)}
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
                        {formatDate(lead.departure_datetime, lead.departure_date)}
                      </div>
                      <div className="text-base font-semibold text-primary">
                        {lead.departure_time ? formatTime(getTime(lead.departure_datetime, lead.departure_time)) : 'TBD'}
                      </div>
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
                        <div className="text-sm font-semibold text-primary mt-2">
                          {formatFlightTime()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {arrivalAirportData?.code || (lead.arrival_airport.includes(' - ')
                        ? lead.arrival_airport.split(' - ')[0]
                        : lead.arrival_airport)}
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
                {lead.trip_type === "Round Trip" && (lead.return_datetime || lead.return_date) && (
                  <div className="flex items-center justify-between mb-6 pt-4 border-t">
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {arrivalAirportData?.code || (lead.arrival_airport.includes(' - ')
                          ? lead.arrival_airport.split(' - ')[0]
                          : lead.arrival_airport)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Return From
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center px-4">
                      <div className="text-center mb-3">
                        <div className="text-lg font-bold text-foreground mb-1">
                          {formatDate(lead.return_datetime, lead.return_date)}
                        </div>
                        <div className="text-base font-semibold text-secondary">
                          {lead.return_time ? formatTime(getTime(lead.return_datetime, lead.return_time)) : 'TBD'}
                        </div>
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
                        {distance > 0 && (
                          <div className="text-sm font-semibold text-secondary mt-2">
                            {formatFlightTime()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {departureAirportData?.code || (lead.departure_airport.includes(' - ')
                          ? lead.departure_airport.split(' - ')[0]
                          : lead.departure_airport)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Return To
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            </div>

            {/* Editable Trip Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Trip Details
                </CardTitle>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditMode) {
                      handleSaveChanges();
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                      Saving...
                    </>
                  ) : isEditMode ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditMode ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Departure Airport</Label>
                        <p className="font-semibold">{lead.departure_airport}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Arrival Airport</Label>
                        <p className="font-semibold">{lead.arrival_airport}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Departure Date</Label>
                        <p className="font-semibold">{formatDate(lead.departure_datetime, lead.departure_date)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Departure Time</Label>
                        <p className="font-semibold">{formatTime(getTime(lead.departure_datetime, lead.departure_time))}</p>
                      </div>
                    </div>
                    {lead.trip_type === "Round Trip" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Return Date</Label>
                          <p className="font-semibold">{lead.return_date ? formatDate(lead.return_datetime, lead.return_date) : 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Return Time</Label>
                          <p className="font-semibold">{lead.return_time ? formatTime(getTime(lead.return_datetime, lead.return_time)) : 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-xs">Passengers</Label>
                      <p className="font-semibold">{lead.passengers}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Departure Airport</Label>
                      <AirportSearch
                        value={editedData.departureAirport}
                        onChange={(value) => setEditedData({ ...editedData, departureAirport: value })}
                        placeholder="Search departure airport..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Arrival Airport</Label>
                      <AirportSearch
                        value={editedData.arrivalAirport}
                        onChange={(value) => setEditedData({ ...editedData, arrivalAirport: value })}
                        placeholder="Search arrival airport..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Departure Date</Label>
                        <Input
                          type="date"
                          value={editedData.departureDate}
                          onChange={(e) => setEditedData({ ...editedData, departureDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Departure Time</Label>
                        <Input
                          type="time"
                          value={editedData.departureTime}
                          onChange={(e) => setEditedData({ ...editedData, departureTime: e.target.value })}
                        />
                      </div>
                    </div>
                    {lead.trip_type === "Round Trip" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Return Date</Label>
                          <Input
                            type="date"
                            value={editedData.returnDate}
                            onChange={(e) => setEditedData({ ...editedData, returnDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Return Time</Label>
                          <Input
                            type="time"
                            value={editedData.returnTime}
                            onChange={(e) => setEditedData({ ...editedData, returnTime: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Passengers</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editedData.passengers}
                        onChange={(e) => setEditedData({ ...editedData, passengers: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setIsEditMode(false);
                        // Reset to original values
                        if (lead) {
                          setEditedData({
                            departureAirport: lead.departure_airport,
                            arrivalAirport: lead.arrival_airport,
                            departureDate: lead.departure_date,
                            departureTime: lead.departure_time,
                            returnDate: lead.return_date || '',
                            returnTime: lead.return_time || '',
                            passengers: lead.passengers
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Football Events */}
            {(footballEvents.departure.length > 0 || footballEvents.arrival.length > 0) && (
              <Card className="bg-gradient-to-br from-green-500/5 to-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    NFL Games Near Your Route
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Games within 50 miles of departure or arrival airports
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingEvents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading football events...</p>
                    </div>
                  ) : (
                    <>
                      {footballEvents.departure.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Near {departureAirportData?.city || 'Departure Airport'}
                          </h4>
                          <div className="space-y-2">
                            {footballEvents.departure.slice(0, 3).map((game: any, idx: number) => (
                              <div key={idx} className="bg-background p-3 rounded-lg border border-border/50">
                                <div className="font-semibold text-sm">
                                  {game.teams?.away?.name} @ {game.teams?.home?.name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {game.stadium_info && <div>📍 {game.stadium_info.name} ({game.stadium_info.distance_miles} mi from airport)</div>}
                                  {game.game?.date?.date && <div>🗓️ {new Date(game.game.date.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {footballEvents.arrival.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Near {arrivalAirportData?.city || 'Arrival Airport'}
                          </h4>
                          <div className="space-y-2">
                            {footballEvents.arrival.slice(0, 3).map((game: any, idx: number) => (
                              <div key={idx} className="bg-background p-3 rounded-lg border border-border/50">
                                <div className="font-semibold text-sm">
                                  {game.teams?.away?.name} @ {game.teams?.home?.name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {game.stadium_info && <div>📍 {game.stadium_info.name} ({game.stadium_info.distance_miles} mi from airport)</div>}
                                  {game.game?.date?.date && <div>🗓️ {new Date(game.game.date.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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

          {/* Charter Quote Request */}
          <CharterQuoteRequest leadData={lead} />
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
                    <Phone className="h-4 w-4 mr-2" />
                    {isExporting ? 'Starting...' : 'Call + Email'}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => setShowEmailComposer(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={handleOpenAviapagesPreview}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post to Aviapages
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleAddToTripBoard}
                    disabled={lead.status === 'qualified'}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {lead.status === 'qualified' ? 'On Trip Board' : 'Add to Trip Board'}
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
                onUpdateLead={handleUpdateItinerary}
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

      {/* Aviapages Preview Dialog */}
      <Dialog open={showAviapagesPreview} onOpenChange={setShowAviapagesPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Post to Aviapages Trip Board</DialogTitle>
            <DialogDescription>
              Review the trip details before posting to Aviapages. Charter operators will be able to see this information and provide quotes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contact Information (Your Business) */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Contact Information (Visible to Operators)</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> Jesse Marsh - Stratos Jets</p>
                <p><strong>Email:</strong> jesse@stratosjets.com</p>
                <p><strong>Phone:</strong> 973-784-8000</p>
              </div>
            </div>

            <Separator />

            {/* Flight Details */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Flight Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-base">{departureAirportData?.code || lead.departure_airport}</p>
                    <p className="text-xs text-muted-foreground">{departureAirportData?.name}</p>
                  </div>
                  <Plane className="h-5 w-5 text-primary" />
                  <div className="text-right">
                    <p className="font-semibold text-base">{arrivalAirportData?.code || lead.arrival_airport}</p>
                    <p className="text-xs text-muted-foreground">{arrivalAirportData?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Departure</p>
                    <p className="font-medium">{formatDate(lead.departure_datetime, lead.departure_date)}</p>
                    <p className="text-xs">{formatTime(getTime(lead.departure_datetime, lead.departure_time))}</p>
                  </div>
                  {lead.trip_type === 'Round Trip' && (
                    <div>
                      <p className="text-muted-foreground text-xs">Return</p>
                      <p className="font-medium">{formatDate(lead.return_datetime, lead.return_date)}</p>
                      <p className="text-xs">{formatTime(getTime(lead.return_datetime, lead.return_time))}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Passengers</p>
                    <p className="font-medium">{lead.passengers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Trip Type</p>
                    <p className="font-medium">{lead.trip_type}</p>
                  </div>
                </div>

                {distance > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs">Distance</p>
                    <p className="font-medium">{distance.toLocaleString()} nm</p>
                  </div>
                )}

                {lead.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs">Notes</p>
                    <p className="text-sm">{lead.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAviapagesPreview(false)}
              disabled={isPostingToAviapages}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPostToAviapages}
              disabled={isPostingToAviapages}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPostingToAviapages ? 'Posting...' : 'Confirm & Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}