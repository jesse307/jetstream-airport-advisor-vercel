import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Plane, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AircraftData() {
  const [tailNumber, setTailNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [aircraftData, setAircraftData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  const handlePushToWeb = () => {
    // Generate a standalone HTML version
    const htmlContent = document.getElementById('aircraft-display')?.outerHTML || '';
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aircraftData?.aircraft_type?.name || 'Aircraft'} - Stratos Jets</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body * { visibility: hidden; }
      #aircraft-display, #aircraft-display * { visibility: visible; }
      #aircraft-display { position: absolute; left: 0; top: 0; width: 100%; }
    }
  </style>
</head>
<body class="bg-gray-50">
  ${htmlContent}
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${aircraftData?.registration_number || 'aircraft'}-showcase.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Web Page Downloaded",
      description: "Upload this HTML file to workatrip.com to publish"
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
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
        @page {
          size: letter;
          margin: 0.5in;
        }
      `}</style>
      
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Aircraft detail"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
      
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
                    <Button variant="outline" size="sm" onClick={handlePushToWeb}>
                      <Globe className="mr-2 h-4 w-4" />
                      Export Web Page
                    </Button>
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
          <div id="aircraft-display" className="max-w-6xl mx-auto mt-8 bg-background rounded-2xl overflow-hidden shadow-2xl">
            {/* Hero Image */}
            {aircraftData.images?.[0] && (
              <div className="relative h-[500px] overflow-hidden">
                <img 
                  src={aircraftData.images[0].media.path} 
                  alt="Aircraft exterior"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Stratos Jets Logo */}
                <div className="absolute top-8 left-8">
                  <img 
                    src="/images/stratos_logo.png" 
                    alt="Stratos Jets"
                    className="h-16 w-auto"
                  />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-12">
                  <div className="flex items-end gap-4 mb-3">
                    <Plane className="h-12 w-12 text-white" />
                    <h1 className="text-6xl font-light tracking-wider text-white">{aircraftData.aircraft_type?.name || 'Luxury Aircraft'}</h1>
                  </div>
                  {aircraftData.aircraft_type?.aircraft_class?.name && (
                    <p className="text-xl font-light text-white/80 tracking-wide uppercase">{aircraftData.aircraft_type.aircraft_class.name} Jet</p>
                  )}
                </div>
              </div>
            )}

            <div className="p-12 space-y-12">
              {/* Key Stats - What matters to a flyer */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {aircraftData.passengers_max && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.passengers_max}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Passengers</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.sleeping_places && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.aircraft_extension.sleeping_places}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Sleeping Places</p>
                  </div>
                )}
                {aircraftData.year_of_production && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.year_of_production}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Year Built</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.refurbishment && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.aircraft_extension.refurbishment}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Refurbished</p>
                  </div>
                )}
              </div>

              {/* Cabin Gallery */}
              {aircraftData.images && aircraftData.images.some((img: any) => img.tag?.value === 'cabin') && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-4xl font-light tracking-wide mb-8 text-foreground">Interior Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {aircraftData.images
                        .filter((img: any) => img.tag?.value === 'cabin')
                        .map((image: any) => (
                          <div 
                            key={image.media.id} 
                            className="aspect-[4/3] overflow-hidden rounded-xl border shadow-md hover:shadow-xl transition-all cursor-pointer"
                            onClick={() => setSelectedImage(image.media.path)}
                          >
                            <img 
                              src={image.media.path} 
                              alt="Aircraft interior"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* Floor Plan */}
              {aircraftData.images?.find((img: any) => img.tag?.value === 'plan') && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-4xl font-light tracking-wide mb-8 text-foreground">Aircraft Layout</h2>
                    <div 
                      className="bg-card p-8 rounded-xl border shadow-lg cursor-pointer hover:shadow-2xl transition-shadow"
                      onClick={() => setSelectedImage(aircraftData.images.find((img: any) => img.tag?.value === 'plan').media.path)}
                    >
                      <img 
                        src={aircraftData.images.find((img: any) => img.tag?.value === 'plan').media.path}
                        alt="Aircraft floor plan"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Amenities - The Experience */}
              {aircraftData.aircraft_extension && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-4xl font-light tracking-wide mb-8 text-foreground">Premium Amenities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aircraftData.aircraft_extension.wireless_internet && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Complimentary WiFi</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.entertainment_system && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Entertainment System</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.shower && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Private Shower</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.pets_allowed && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Pet Friendly</span>
                        </div>
                      )}
                      {aircraftData.aircraft_extension.divan_seats && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">{aircraftData.aircraft_extension.divan_seats} Divan Seats</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="pt-8 border-t text-center">
                <p className="text-sm text-muted-foreground font-light tracking-wide">
                  Report generated on {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
