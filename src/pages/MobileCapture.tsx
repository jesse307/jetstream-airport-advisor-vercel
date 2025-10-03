import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MobileCapture() {
  const [leadData, setLeadData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCapture = async (mode: 'push-to-site' | 'complete-workflow') => {
    if (!leadData.trim()) {
      toast({
        title: "No data",
        description: "Please paste the lead data or URL",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = mode === 'complete-workflow' 
        ? 'process-lead-complete'
        : 'receive-lead-webhook';

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { rawData: leadData }
      });

      if (error) throw error;

      if (mode === 'push-to-site') {
        toast({
          title: "Success",
          description: "Lead data captured! Redirecting to imports...",
        });
        setTimeout(() => navigate('/leads/import'), 1000);
      } else {
        toast({
          title: "Complete",
          description: "Lead processed and sent to Make.com!",
        });
        setLeadData("");
      }
    } catch (error: any) {
      console.error('Capture error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process lead data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Mobile Lead Capture</h1>
          <p className="text-muted-foreground">
            Paste Salesforce lead data or URL below
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <Textarea
            placeholder="Paste lead information here...&#10;&#10;Example:&#10;- Full Salesforce lead URL&#10;- Contact Name: John Doe&#10;- Email: john@example.com&#10;- Departure: LAX&#10;- Arrival: JFK&#10;- Date: 2025-11-01"
            value={leadData}
            onChange={(e) => setLeadData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />

          <div className="space-y-3">
            <Button
              onClick={() => handleCapture('push-to-site')}
              disabled={isProcessing || !leadData.trim()}
              className="w-full h-12 text-base"
              variant="default"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Push to Site
            </Button>

            <Button
              onClick={() => handleCapture('complete-workflow')}
              disabled={isProcessing || !leadData.trim()}
              className="w-full h-12 text-base"
              variant="secondary"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Zap className="mr-2 h-5 w-5" />
              )}
              Complete Workflow
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p><strong>Push to Site:</strong> Send to pending imports for manual review</p>
            <p><strong>Complete Workflow:</strong> Auto-process and send to Make.com</p>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>💡 Tip: Add this page to your home screen for quick access</p>
        </div>
      </div>
    </div>
  );
}
