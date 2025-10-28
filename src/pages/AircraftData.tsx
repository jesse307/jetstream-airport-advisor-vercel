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
          <div id="aircraft-display" className="max-w-6xl mx-auto mt-8 bg-gradient-to-br from-background to-muted/20 rounded-xl overflow-hidden border shadow-2xl">
            {/* Hero Image */}
            {aircraftData.images?.[0] && (
              <div className="relative h-96 overflow-hidden">
                <img 
                  src={aircraftData.images[0].media.path} 
                  alt="Aircraft exterior"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Plane className="h-8 w-8" />
                    <h1 className="text-5xl font-bold tracking-tight">{aircraftData.registration_number}</h1>
                  </div>
                  <p className="text-2xl font-light">{aircraftData.aircraft_type?.name}</p>
                </div>
              </div>
            )}

            <div className="p-8 space-y-8">
              {/* Key Stats - What matters to a flyer */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {aircraftData.passengers_max && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{aircraftData.passengers_max}</p>
                    <p className="text-sm text-muted-foreground mt-1">Passengers</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.sleeping_places && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{aircraftData.aircraft_extension.sleeping_places}</p>
                    <p className="text-sm text-muted-foreground mt-1">Sleeping Places</p>
                  </div>
                )}
                {aircraftData.year_of_production && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{aircraftData.year_of_production}</p>
                    <p className="text-sm text-muted-foreground mt-1">Year Built</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.refurbishment && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{aircraftData.aircraft_extension.refurbishment}</p>
                    <p className="text-sm text-muted-foreground mt-1">Last Refurbished</p>
                  </div>
                )}
              </div>

              {/* Amenities - The Experience */}
              {aircraftData.aircraft_extension && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Premium Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {aircraftData.aircraft_extension.wireless_internet && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">Complimentary WiFi</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.entertainment_system && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">Entertainment System</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.shower && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">Private Shower</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.view_360 && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">360° Virtual Tour</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.pets_allowed && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">Pet Friendly</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.divan_seats && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold">{aircraftData.aircraft_extension.divan_seats} Divan Seats</span>
                        </div>
                      )}
                    </div>

                    {aircraftData.aircraft_extension.description && (
                      <div className="mt-6 p-6 bg-muted/20 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-3">About This Aircraft</h3>
                        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                          {aircraftData.aircraft_extension.description}
                        </p>
                      </div>
                    )}

                    {aircraftData.aircraft_extension.view_360 && (
                      <div className="mt-6">
                        <Button asChild className="w-full md:w-auto" size="lg">
                          <a href={aircraftData.aircraft_extension.view_360} target="_blank" rel="noopener noreferrer">
                            Take a 360° Virtual Tour
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cabin Gallery */}
              {aircraftData.images && aircraftData.images.length > 1 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Aircraft Layout & Interior</h2>
                    
                    {/* Floor Plan - Featured */}
                    {aircraftData.images.find((img: any) => img.tag?.value === 'plan') && (
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Floor Plan</h3>
                        <div className="bg-white p-4 rounded-lg border shadow-lg">
                          <img 
                            src={aircraftData.images.find((img: any) => img.tag?.value === 'plan').media.path}
                            alt="Aircraft floor plan"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cabin Photos */}
                    {aircraftData.images.some((img: any) => img.tag?.value === 'cabin') && (
                      <>
                        <h3 className="text-xl font-semibold mb-4">Cabin Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {aircraftData.images
                            .filter((img: any) => img.tag?.value === 'cabin')
                            .map((image: any) => (
                              <div key={image.media.id} className="aspect-video overflow-hidden rounded-lg border shadow-md hover:shadow-xl transition-shadow">
                                <img 
                                  src={image.media.path} 
                                  alt="Aircraft interior"
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Location & Operator */}
              <Separator />
              <div className="grid md:grid-cols-2 gap-6">
                {aircraftData.base_airport && (
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Home Base</h3>
                    <p className="text-2xl font-bold text-primary">
                      {aircraftData.base_airport.name}
                    </p>
                    <p className="text-muted-foreground">
                      {aircraftData.base_airport.city?.name}
                    </p>
                  </div>
                )}
                {aircraftData.company && (
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Operated By</h3>
                    <p className="text-2xl font-bold text-primary">
                      {aircraftData.company.name}
                    </p>
                    {aircraftData.company.website && (
                      <p className="text-muted-foreground">{aircraftData.company.website}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t text-center text-sm text-muted-foreground">
                <p>Report generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
