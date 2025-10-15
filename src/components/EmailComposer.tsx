import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Mail, Loader2 } from "lucide-react";

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
        .is('user_id', null)
        .eq('name', 'Default Lead Response')
        .order('created_at', { ascending: false })
        .limit(1)
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

  const copyToClipboard = () => {
    const html = generatedEmail;
    
    const textArea = document.createElement('textarea');
    textArea.value = html;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      navigator.clipboard.write(data).then(() => {
        toast.success("Email copied! Paste directly into Gmail");
      }).catch(() => {
        document.execCommand('copy');
        toast.success("Email HTML copied!");
      });
    } catch (error) {
      document.execCommand('copy');
      toast.success("Email HTML copied!");
    }
    
    document.body.removeChild(textArea);
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
              <Label>Email Preview</Label>
              <div 
                className="border rounded-lg p-4 bg-white min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: generatedEmail }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={copyToClipboard} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy HTML for Gmail
              </Button>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-4">
              <p className="font-semibold mb-2">To use in Gmail:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click "Copy HTML for Gmail" button above</li>
                <li>Open Gmail and compose a new email</li>
                <li>Paste the subject line into the subject field</li>
                <li>Click in the compose area and press Ctrl+V (or Cmd+V on Mac)</li>
                <li>The formatted email will appear with all styling intact</li>
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
