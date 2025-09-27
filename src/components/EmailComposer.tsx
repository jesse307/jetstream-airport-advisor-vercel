import { useState } from "react";
import { X, Send, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  leadData: {
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
    notes?: string;
  };
}

export function EmailComposer({ isOpen, onClose, leadData }: EmailComposerProps) {
  const [subject, setSubject] = useState(`Private Jet Charter Quote - ${leadData.departure_airport} to ${leadData.arrival_airport}`);
  const [emailContent, setEmailContent] = useState("");
  const [makeWebhookUrl, setMakeWebhookUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: {
          leadData,
          flightAnalysis: {
            distance: 0, // Would come from actual calculator
            recommendedAircraft: ["Citation CJ3+", "Phenom 300"],
            estimatedCost: "$15,000 - $18,000",
            flightTime: "2h 45m"
          }
        }
      });

      if (error) {
        console.error('Error generating email:', error);
        toast.error("Failed to generate email. Please try again.");
        return;
      }

      if (data.success) {
        setEmailContent(data.email);
        setSubject(data.subject);
        toast.success("Email generated successfully!");
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while generating the email.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!makeWebhookUrl) {
      toast.error("Please enter your Make.com webhook URL");
      return;
    }

    if (!emailContent.trim()) {
      toast.error("Please generate or write email content");
      return;
    }

    setIsSending(true);
    try {
      // Send to Make.com webhook for Gmail integration
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          to: leadData.email,
          subject: subject,
          body: emailContent,
          leadData: {
            id: leadData.id,
            name: `${leadData.first_name} ${leadData.last_name}`,
            phone: leadData.phone,
            trip_details: {
              type: leadData.trip_type,
              route: `${leadData.departure_airport} → ${leadData.arrival_airport}`,
              departure: `${leadData.departure_date} at ${leadData.departure_time}`,
              return: leadData.return_date ? `${leadData.return_date} at ${leadData.return_time}` : null,
              passengers: leadData.passengers
            }
          },
          timestamp: new Date().toISOString(),
          source: "Charter Pro Lead System"
        }),
      });

      // Since we're using no-cors, we won't get response status
      toast.success("Email sent to Make.com! Check your Gmail and Make.com logs to confirm delivery.");
      
      // Update lead status to 'contacted'
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', leadData.id);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
      }

      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email to Make.com. Please check your webhook URL.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Generate & Send Email Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Sending to:</h3>
              <span className="text-sm text-muted-foreground">
                Lead #{leadData.id.slice(0, 8)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{leadData.first_name} {leadData.last_name}</span>
                <br />
                <span className="text-muted-foreground">{leadData.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {leadData.departure_airport} → {leadData.arrival_airport}
                  <br />
                  {leadData.passengers} passenger{leadData.passengers !== 1 ? 's' : ''} • {leadData.trip_type}
                </span>
              </div>
            </div>
          </div>

          {/* Email Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">Email Subject</Label>
              <Button
                onClick={generateEmail}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          {/* Email Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Email content will appear here after generation, or write your own..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              HTML formatting is supported. The AI will generate a professional email with your branding.
            </p>
          </div>

          {/* Make.com Integration */}
          <div className="space-y-2">
            <Label htmlFor="webhook">Make.com Webhook URL</Label>
            <Input
              id="webhook"
              type="url"
              value={makeWebhookUrl}
              onChange={(e) => setMakeWebhookUrl(e.target.value)}
              placeholder="https://hook.us1.make.com/your-webhook-url"
            />
            <p className="text-xs text-muted-foreground">
              Enter your Make.com webhook URL that connects to Gmail. The email will be sent through your Gmail account.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={sendEmail} 
              disabled={isSending || !emailContent.trim()}
              className="flex items-center gap-2"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}