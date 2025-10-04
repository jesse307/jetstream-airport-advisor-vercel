import { useState, useRef, useEffect } from "react";
import { Phone, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CallNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  leadData: any;
  onContinue: (notes: string, updatedData?: any) => void;
  onUpdateItinerary?: (changes: any) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function CallNotesDialog({
  open,
  onOpenChange,
  phoneNumber,
  leadData,
  onContinue,
  onUpdateItinerary,
}: CallNotesDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [genericNotes, setGenericNotes] = useState("");
  const [extractedChanges, setExtractedChanges] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-call-notes", {
        body: {
          messages: [...messages, userMessage],
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

      if (data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }

      if (data.changes) {
        setExtractedChanges(data.changes);
        toast.success("Itinerary changes detected!");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to process message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseNotesToUpdate = () => {
    if (!extractedChanges) {
      toast.error("No itinerary changes detected in conversation");
      return;
    }
    
    if (onUpdateItinerary) {
      onUpdateItinerary(extractedChanges);
      toast.success("Itinerary updated");
    }
  };

  const handleAddToNotes = () => {
    const conversationNotes = messages
      .map((m) => `${m.role === "user" ? "Rep" : "AI"}: ${m.content}`)
      .join("\n");
    
    const allNotes = [conversationNotes, genericNotes].filter(Boolean).join("\n\n---\n\n");
    onContinue(allNotes);
  };

  const handleNoAnswer = () => {
    onContinue("No answer - attempted call", null);
  };

  const handleContinue = () => {
    const conversationNotes = messages
      .map((m) => `${m.role === "user" ? "Rep" : "AI"}: ${m.content}`)
      .join("\n");
    
    const allNotes = [conversationNotes, genericNotes].filter(Boolean).join("\n\n---\n\n");
    onContinue(allNotes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Notes - {phoneNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Lead Information Reference */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Lead Information to Confirm</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Contact</p>
              <p className="font-medium">{leadData.first_name} {leadData.last_name}</p>
              <p className="text-xs">{leadData.email}</p>
              <p className="text-xs">{leadData.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Trip Details</p>
              <p className="font-medium">{leadData.trip_type}</p>
              <p className="text-xs">{leadData.passengers} passenger{leadData.passengers !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Route</p>
              <p className="font-medium">{leadData.departure_airport} → {leadData.arrival_airport}</p>
              <p className="text-xs">Depart: {leadData.departure_date} {leadData.departure_time || ''}</p>
              {leadData.return_date && (
                <p className="text-xs">Return: {leadData.return_date} {leadData.return_time || ''}</p>
              )}
            </div>
          </div>
          {leadData.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-muted-foreground text-xs mb-1">Form Notes:</p>
              <p className="text-xs">{leadData.notes}</p>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* AI Chat Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">AI Call Assistant</h3>
            <ScrollArea className="flex-1 border rounded-md p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Start taking notes about your call. I'll help you track any changes to the itinerary.
                  </p>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm break-words ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your notes..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Generic Notes Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Additional Notes</h3>
            <Textarea
              value={genericNotes}
              onChange={(e) => setGenericNotes(e.target.value)}
              placeholder="Any additional notes that don't affect the itinerary..."
              className="flex-1 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          <Button onClick={handleUseNotesToUpdate} variant="default">
            Use Notes to Update Itinerary
          </Button>
          <Button onClick={handleAddToNotes} variant="secondary">
            Add Notes to Notes Box
          </Button>
          <Button onClick={handleNoAnswer} variant="outline">
            No Answer
          </Button>
          <Button onClick={handleContinue} variant="outline">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
