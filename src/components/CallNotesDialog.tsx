import { useState, useRef, useEffect } from "react";
import { Phone, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [showEmailComposer, setShowEmailComposer] = useState(false);
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
        if (onUpdateItinerary) {
          onUpdateItinerary(data.changes);
          toast.success("Itinerary changes detected and applied!");
        } else {
          toast.success("Itinerary changes detected!");
        }
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
    setShowEmailComposer(true);
  };

  const handleContinue = () => {
    const conversationNotes = messages
      .map((m) => `${m.role === "user" ? "Rep" : "AI"}: ${m.content}`)
      .join("\n");
    
    const allNotes = [conversationNotes, genericNotes].filter(Boolean).join("\n\n---\n\n");
    onContinue(allNotes);
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
        <div className="relative overflow-hidden rounded-xl mb-4 bg-gradient-to-br from-[#1a3a4a] via-[#2d5165] to-[#1a3a4a] p-6 shadow-xl">
          {/* Subtle animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
          
          <div className="relative">
            <h3 className="text-white/90 text-sm font-semibold mb-4 tracking-wide">LEAD INFORMATION TO CONFIRM</h3>
            
            {/* Route Graphic */}
            <div className="flex items-center justify-center gap-6 mb-6 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              {/* Departure */}
              <div className="text-center">
                <div className="bg-[#ff6b35] text-white text-2xl font-bold px-5 py-3 rounded-lg min-w-[100px] shadow-lg">
                  {leadData.departure_airport.split(' - ')[0] || leadData.departure_airport}
                </div>
                <div className="text-white/80 text-xs mt-2 font-medium">
                  {new Date(leadData.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {leadData.departure_time && <><br />{leadData.departure_time}</>}
                </div>
              </div>
              
              {/* Arrow & Info */}
              <div className="text-center min-w-[120px]">
                <div className="text-3xl mb-2">✈️</div>
                <div className="h-0.5 bg-gradient-to-r from-[#ff6b35] via-white/40 to-[#ff6b35] w-20 mx-auto"></div>
                <div className="bg-white/95 text-[#2d5165] text-sm font-bold px-4 py-2 rounded-full mt-3 inline-block shadow-md">
                  👥 {leadData.passengers} PAX
                </div>
              </div>
              
              {/* Arrival */}
              <div className="text-center">
                <div className="bg-[#ff6b35] text-white text-2xl font-bold px-5 py-3 rounded-lg min-w-[100px] shadow-lg">
                  {leadData.arrival_airport.split(' - ')[0] || leadData.arrival_airport}
                </div>
                {leadData.return_date && (
                  <div className="text-white/80 text-xs mt-2 font-medium">
                    {new Date(leadData.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {leadData.return_time && <><br />{leadData.return_time}</>}
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Trip Details Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/8 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Contact</p>
                <p className="text-white font-semibold">{leadData.first_name} {leadData.last_name}</p>
                <p className="text-white/80 text-xs mt-1">{leadData.email}</p>
                <p className="text-white/80 text-xs">{leadData.phone}</p>
              </div>
              
              <div className="bg-white/8 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Trip Type</p>
                <p className="text-white font-semibold capitalize">{leadData.trip_type}</p>
              </div>
              
              {leadData.notes && (
                <div className="bg-white/8 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Form Notes</p>
                  <p className="text-white/90 text-xs line-clamp-3">{leadData.notes}</p>
                </div>
              )}
            </div>
          </div>
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
    </>
  );
}
