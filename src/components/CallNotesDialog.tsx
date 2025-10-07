import { useState, useEffect } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmailComposer } from "./EmailComposer";

interface CallNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  leadData: any;
  onContinue: (notes: string, updatedData?: any) => void;
  onUpdateItinerary?: (changes: any) => void;
}

export function CallNotesDialog({
  open,
  onOpenChange,
  phoneNumber,
  leadData,
  onContinue,
  onUpdateItinerary,
}: CallNotesDialogProps) {
  const [genericNotes, setGenericNotes] = useState("");
  const [extractedChanges, setExtractedChanges] = useState<any>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Auto-analyze notes for itinerary changes when user pauses typing
    const timeoutId = setTimeout(() => {
      if (genericNotes.trim() && !isAnalyzing) {
        analyzeNotes();
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [genericNotes]);

  const analyzeNotes = async () => {
    if (!genericNotes.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-call-notes", {
        body: {
          messages: [{ role: "user", content: genericNotes }],
          leadData: {
            firstName: leadData.first_name,
            lastName: leadData.last_name,
            email: leadData.email,
            phone: leadData.phone,
            tripType: leadData.trip_type,
            departureAirport: leadData.departure_airport,
            arrivalAirport: leadData.arrival_airport,
            departureDate: leadData.departure_date,
            passengers: leadData.passengers,
          },
        },
      });

      if (error) throw error;

      if (data.changes) {
        setExtractedChanges(data.changes);
        toast.success("Itinerary changes detected!");
      }
    } catch (error) {
      console.error("Error analyzing notes:", error);
      // Silently fail - don't interrupt user's note-taking
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseNotesToUpdate = () => {
    if (!extractedChanges) {
      toast.error("No itinerary changes detected in notes");
      return;
    }
    
    if (onUpdateItinerary) {
      onUpdateItinerary(extractedChanges);
      toast.success("Itinerary updated from notes");
    }
  };

  const handleContinue = () => {
    onContinue(genericNotes);
  };

  const handleNoAnswer = () => {
    setShowEmailComposer(true);
  };

  return (
    <>
      <EmailComposer
        isOpen={showEmailComposer}
        onClose={() => {
          setShowEmailComposer(false);
          onContinue("No answer - email sent via composer", null);
        }}
        leadData={leadData}
        webhookUrl="https://hook.us2.make.com/YOUR_NO_ANSWER_WEBHOOK_URL"
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Notes - {phoneNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Lead Information Reference */}
        <div className="bg-muted/30 rounded-lg p-4 mb-4 border">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Lead Information to Confirm</h3>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Contact Info */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contact</p>
              <p className="font-medium">{leadData.first_name} {leadData.last_name}</p>
              <p className="text-xs text-muted-foreground">{leadData.email}</p>
              <p className="text-xs text-muted-foreground">{leadData.phone}</p>
            </div>
            
            {/* Route Info */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Route</p>
              <p className="font-medium">
                {leadData.departure_airport.includes(' - ') 
                  ? leadData.departure_airport.split(' - ')[0] 
                  : leadData.departure_airport} → {leadData.arrival_airport.includes(' - ')
                  ? leadData.arrival_airport.split(' - ')[0]
                  : leadData.arrival_airport}
              </p>
              <p className="text-xs text-muted-foreground">
                Depart: {leadData.departure_datetime 
                  ? new Date(leadData.departure_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : new Date(leadData.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {(leadData.departure_datetime || leadData.departure_time) && 
                  ` at ${leadData.departure_datetime 
                    ? new Date(leadData.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : leadData.departure_time}`}
              </p>
              {(leadData.return_datetime || leadData.return_date) && (
                <p className="text-xs text-muted-foreground">
                  Return: {leadData.return_datetime
                    ? new Date(leadData.return_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : new Date(leadData.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {(leadData.return_datetime || leadData.return_time) &&
                    ` at ${leadData.return_datetime
                      ? new Date(leadData.return_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : leadData.return_time}`}
                </p>
              )}
            </div>
            
            {/* Trip Details */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trip Details</p>
              <p className="font-medium capitalize">{leadData.trip_type}</p>
              <p className="text-xs text-muted-foreground">{leadData.passengers} passenger{leadData.passengers !== 1 ? 's' : ''}</p>
              {leadData.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={leadData.notes}>
                  Notes: {leadData.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Unified Notes Area */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Call Notes</h3>
              {extractedChanges && (
                <Badge variant="outline" className="text-xs">
                  Itinerary changes detected
                </Badge>
              )}
            </div>
            
            <Textarea
              value={genericNotes}
              onChange={(e) => setGenericNotes(e.target.value)}
              placeholder="Type your call notes here. The AI will automatically detect any itinerary changes you mention (e.g., 'changed to 8 passengers' or 'moved departure to LAX')..."
              className="flex-1 resize-none min-h-[300px]"
            />
            
            <div className="text-xs text-muted-foreground">
              <p className="mb-1">💡 <strong>Tip:</strong> Just type naturally about the conversation.</p>
              <p>The AI will automatically detect changes like passenger count, airports, dates, or times.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t">
          <Button 
            onClick={handleUseNotesToUpdate} 
            variant="default"
            disabled={!extractedChanges}
          >
            {isAnalyzing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Changes to Itinerary
          </Button>
          <Button onClick={handleNoAnswer} variant="outline">
            No Answer (Email)
          </Button>
          <Button onClick={handleContinue} variant="outline">
            Save & Continue
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
