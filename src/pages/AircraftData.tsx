import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Plane } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AircraftData() {
  const [tailNumber, setTailNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [aircraftData, setAircraftData] = useState<any>(null);
  const { toast } = useToast();

  const handleFetch = async () => {
    if (!tailNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tail number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setAircraftData(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-aviapages-aircraft', {
        body: {
          tailNumber: tailNumber.trim(),
          webhookUrl: webhookUrl.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch aircraft data');
      }

      // Extract the first aircraft from the results array
      const aircraft = data.data?.results?.[0] || null;
      
      if (!aircraft) {
        throw new Error('No aircraft found with that tail number');
      }

      setAircraftData(aircraft);
      
      toast({
        title: "Success",
        description: webhookUrl.trim() 
          ? "Aircraft data fetched and sent to webhook"
          : "Aircraft data fetched successfully"
      });
    } catch (error) {
      console.error('Error fetching aircraft data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch aircraft data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (aircraftData) {
      navigator.clipboard.writeText(JSON.stringify(aircraftData, null, 2));
      toast({
        title: "Copied",
        description: "JSON data copied to clipboard"
      });
    }
  };

  const handleExportPDF = () => {
    window.print();
    toast({
      title: "Export to PDF",
      description: "Use your browser's print dialog to save as PDF"
    });
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #aircraft-display, #aircraft-display * {
            visibility: visible;
          }
          #aircraft-display {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto no-print">
          <CardHeader>
            <CardTitle>Aircraft Data Lookup</CardTitle>
            <CardDescription>
              Fetch aircraft data from Aviapages and optionally export to n8n webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tailNumber">Tail Number</Label>
                <Input
                  id="tailNumber"
                  placeholder="e.g., N12345"
                  value={tailNumber}
                  onChange={(e) => setTailNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">n8n Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleFetch} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Aircraft Data'
                )}
              </Button>
            </div>

            {aircraftData && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">Aircraft Data</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyJson}>
                      Copy JSON
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {aircraftData && (
          <div id="aircraft-display" className="max-w-4xl mx-auto mt-8 bg-background p-8 rounded-lg border">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Plane className="h-12 w-12 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">{aircraftData.registration_number || 'N/A'}</h1>
              </div>
              <p className="text-xl text-muted-foreground">{aircraftData.aircraft_type?.name || 'Aircraft Data Report'}</p>
            </div>

            <Separator className="mb-8" />

            {/* Aircraft Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {aircraftData.aircraft_type?.name && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Aircraft Type</h3>
                  <p className="text-lg font-medium">{aircraftData.aircraft_type.name}</p>
                </div>
              )}
              
              {aircraftData.aircraft_type?.icao && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">ICAO Code</h3>
                  <p className="text-lg font-medium">{aircraftData.aircraft_type.icao}</p>
                </div>
              )}

              {aircraftData.year_of_production && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Year of Production</h3>
                  <p className="text-lg font-medium">{aircraftData.year_of_production}</p>
                </div>
              )}

              {aircraftData.serial_number && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Serial Number</h3>
                  <p className="text-lg font-medium">{aircraftData.serial_number}</p>
                </div>
              )}

              {aircraftData.aircraft_type?.aircraft_class?.name && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Aircraft Class</h3>
                  <p className="text-lg font-medium">{aircraftData.aircraft_type.aircraft_class.name}</p>
                </div>
              )}

              {aircraftData.base_airport && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Base Airport</h3>
                  <p className="text-lg font-medium">{aircraftData.base_airport.name} ({aircraftData.base_airport.icao})</p>
                </div>
              )}
            </div>

            {/* Specifications Section */}
            {(aircraftData.passengers_max || aircraftData.aircraft_extension) && (
              <>
                <Separator className="mb-8" />
                <div>
                  <h2 className="text-2xl font-bold mb-6">Specifications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aircraftData.passengers_max && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Max Passengers</h3>
                        <p className="text-2xl font-bold">{aircraftData.passengers_max}</p>
                      </div>
                    )}

                    {aircraftData.aircraft_extension?.sleeping_places && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sleeping Places</h3>
                        <p className="text-2xl font-bold">{aircraftData.aircraft_extension.sleeping_places}</p>
                      </div>
                    )}

                    {aircraftData.aircraft_extension?.refurbishment && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Last Refurbishment</h3>
                        <p className="text-2xl font-bold">{aircraftData.aircraft_extension.refurbishment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Operator Section */}
            {aircraftData.company && (
              <>
                <Separator className="my-8" />
                <div>
                  <h2 className="text-2xl font-bold mb-6">Operator Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aircraftData.company.name && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Company Name</h3>
                        <p className="text-lg font-medium">{aircraftData.company.name}</p>
                      </div>
                    )}

                    {aircraftData.company.phone && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Phone</h3>
                        <p className="text-lg font-medium">{aircraftData.company.phone}</p>
                      </div>
                    )}

                    {aircraftData.company.website && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Website</h3>
                        <p className="text-lg font-medium">{aircraftData.company.website}</p>
                      </div>
                    )}

                    {aircraftData.company.city && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Location</h3>
                        <p className="text-lg font-medium">{aircraftData.company.city.name}, {aircraftData.company.city.country?.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Additional Details */}
            <Separator className="my-8" />
            <div>
              <h2 className="text-2xl font-bold mb-6">Additional Details</h2>
              <div className="bg-muted/30 p-6 rounded-lg">
                <pre className="text-sm overflow-auto whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(aircraftData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
