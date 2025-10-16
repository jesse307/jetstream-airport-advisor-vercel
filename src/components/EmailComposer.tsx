import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';

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
    analysis_data?: any;
  };
  webhookUrl?: string;
}

export function EmailComposer({ isOpen, onClose, leadData }: EmailComposerProps) {
  const [loading, setLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(leadData.email);

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(leadData.email);
      generateEmail();
    }
  }, [isOpen]);

  const generateEmail = async () => {
    console.log('[EmailComposer] Starting email generation...');
    setLoading(true);
    try {
      // Fetch the default template
      console.log('[EmailComposer] Fetching default template...');
      const { data: templates, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      console.log('[EmailComposer] Template query result:', { templates, templateError });

      if (templateError) {
        console.error('[EmailComposer] Template error:', templateError);
        throw templateError;
      }
      if (!templates) {
        console.error('[EmailComposer] No template found');
        toast.error("No default template found");
        setLoading(false);
        return;
      }

      console.log('[EmailComposer] Template found, calling generate-email function...');
      // Generate email using the template
      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: {
          leadData: {
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            email: leadData.email,
            phone: leadData.phone || '',
            trip_type: leadData.trip_type,
            departure_airport: leadData.departure_airport,
            arrival_airport: leadData.arrival_airport,
            departure_date: leadData.departure_date,
            departure_time: leadData.departure_time || '',
            return_date: leadData.return_date,
            return_time: leadData.return_time,
            passengers: leadData.passengers,
            notes: leadData.notes
          },
          template: templates.template_content,
          flightAnalysis: leadData.analysis_data
        }
      });

      console.log('[EmailComposer] Function response:', { data, error });

      if (error) {
        console.error('[EmailComposer] Function error:', error);
        throw error;
      }

      if (!data || !data.email) {
        console.error('[EmailComposer] No email in response:', data);
        throw new Error('No email content returned');
      }

      console.log('[EmailComposer] Email generated successfully');
      setGeneratedEmail(data.email);
      
      // Replace variables in subject line
      let subject = templates.subject;
      subject = subject.replace(/\{\{route\}\}/g, `${leadData.departure_airport} → ${leadData.arrival_airport}`);
      subject = subject.replace(/\{\{first_name\}\}/g, leadData.first_name);
      subject = subject.replace(/\{\{last_name\}\}/g, leadData.last_name);
      
      setEmailSubject(subject);
      toast.success("Email generated successfully");
    } catch (error) {
      console.error('[EmailComposer] Error generating email:', error);
      toast.error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendToMake = async () => {
    try {
      const webhookUrl = "https://hook.us2.make.com/kylqoo8ozkxhxaqi07n33998rmt2tzl4";
      
      const payload = {
        to: recipientEmail,
        subject: emailSubject,
        html: generatedEmail,
        lead: {
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          departure_airport: leadData.departure_airport,
          arrival_airport: leadData.arrival_airport,
          departure_date: leadData.departure_date,
          passengers: leadData.passengers,
          trip_type: leadData.trip_type
        },
        timestamp: new Date().toISOString()
      };

      console.log("Sending email data to Make.com webhook:", webhookUrl);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Email sent to Make.com successfully!");
        onClose();
      } else {
        throw new Error(`Webhook returned status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send to Make.com:', error);
      toast.error("Failed to send email. Please try again.");
    }
  };

  const sendEmailAndText = async () => {
    try {
      // Send email first
      const webhookUrl = "https://hook.us2.make.com/kylqoo8ozkxhxaqi07n33998rmt2tzl4";
      
      const payload = {
        to: recipientEmail,
        subject: emailSubject,
        html: generatedEmail,
        lead: {
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          departure_airport: leadData.departure_airport,
          arrival_airport: leadData.arrival_airport,
          departure_date: leadData.departure_date,
          passengers: leadData.passengers,
          trip_type: leadData.trip_type
        },
        timestamp: new Date().toISOString()
      };

      console.log("Sending email data to Make.com webhook:", webhookUrl);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status: ${response.status}`);
      }

      toast.success("Email sent to Make.com successfully!");

      // Then trigger text message
      const firstName = leadData.first_name || 'there';
      
      // Format date as "today", "tomorrow", or actual date
      let dateText = 'your requested date';
      if (leadData.departure_date) {
        // Parse date in local time to avoid timezone issues
        const [year, month, day] = leadData.departure_date.split('-').map(Number);
        const depDate = new Date(year, month - 1, day);
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Reset hours for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        
        if (depDate.getTime() === today.getTime()) {
          dateText = 'today';
        } else if (depDate.getTime() === tomorrow.getTime()) {
          dateText = 'tomorrow';
        } else {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          dateText = `${monthNames[depDate.getMonth()]} ${depDate.getDate()}`;
        }
      }
      
      const message = `Hi ${firstName} - Jesse from Stratos Jets. Received your request for a flight on ${dateText}. I just sent an email confirming the flight details. Please take a look when able and we'll get rolling.`;
      window.open(`sms:${leadData.phone}?body=${encodeURIComponent(message)}`, '_self');
      
      onClose();
    } catch (error) {
      console.error('Failed to send to Make.com:', error);
      toast.error("Failed to send email. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Lead - {leadData.first_name} {leadData.last_name}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Generating email...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Content</Label>
              <Editor
                apiKey="bh5y77uhl5utzv5u5zmjnmj002o26rj877w1i486g5wnexn6"
                value={generatedEmail}
                onEditorChange={(content) => setGeneratedEmail(content)}
                init={{
                  height: 500,
                  menubar: false,
                  plugins: [
                    'lists', 'link', 'image', 'charmap', 'preview',
                    'searchreplace', 'code', 'fullscreen',
                    'insertdatetime', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | formatselect | bold italic | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | removeformat | help',
                  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px }'
                }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={sendToMake} className="gap-2" variant="outline">
                <Mail className="h-4 w-4" />
                Send to Gmail
              </Button>
              <Button onClick={sendEmailAndText} className="gap-2">
                <Mail className="h-4 w-4" />
                Send + Text
              </Button>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-4">
              <p className="font-semibold mb-2">How it works:</p>
              <p className="ml-2">
                Click "Send Email" to deliver this email via your Make.com automation workflow.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
