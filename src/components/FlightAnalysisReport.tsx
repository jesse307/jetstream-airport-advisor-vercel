import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlightAnalysisReportProps {
  departureAirport: any;
  arrivalAirport: any;
  passengers: number;
}

export function FlightAnalysisReport({ 
  departureAirport, 
  arrivalAirport, 
  passengers 
}: FlightAnalysisReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = async () => {
    if (!departureAirport || !arrivalAirport) {
      toast.error("Please select both departure and arrival airports");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-flight-options', {
        body: {
          departureCode: departureAirport.code,
          arrivalCode: arrivalAirport.code,
          passengers,
          departureAirport,
          arrivalAirport,
        }
      });

      if (error) throw error;

      if (data.success) {
        setReportHtml(data.html);
        setShowPreview(true);
        toast.success("Flight analysis report generated successfully!");
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportHtml) return;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-analysis-${departureAirport.code}-${arrivalAirport.code}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const copyHtmlToClipboard = () => {
    if (!reportHtml) return;

    navigator.clipboard.writeText(reportHtml).then(() => {
      toast.success("HTML copied to clipboard!");
    }).catch((error) => {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy HTML");
    });
  };

  return (
    <Card className="shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Flight Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Generate a comprehensive HTML report analyzing distance, runways, and proposing 3-4 suitable aircraft 
          with Aviapages verification. Perfect for embedding in email templates.
        </p>

        <div className="flex gap-2">
          <Button 
            onClick={generateReport} 
            disabled={isGenerating || !departureAirport || !arrivalAirport}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>

          {reportHtml && (
            <>
              <Button 
                onClick={downloadReport}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
              <Button 
                onClick={copyHtmlToClipboard}
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Copy HTML
              </Button>
            </>
          )}
        </div>

        {showPreview && reportHtml && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Report Preview</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Hide Preview
              </Button>
            </div>
            <div 
              className="border border-border rounded-lg overflow-hidden"
              style={{ height: '600px' }}
            >
              <iframe
                srcDoc={reportHtml}
                title="Flight Analysis Report"
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
