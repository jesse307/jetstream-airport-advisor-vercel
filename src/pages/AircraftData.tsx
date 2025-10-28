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
    const aircraft = aircraftData;
    const logoUrl = `${window.location.origin}/images/stratos_logo.png`;
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aircraft?.aircraft_type?.name || 'Aircraft'} - Stratos Jets</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: #f9fafb; 
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .hero { 
      position: relative; 
      height: 400px; 
      background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)); 
      overflow: hidden;
    }
    .hero-bg { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      position: absolute; 
      top: 0; 
      left: 0; 
      z-index: 0; 
    }
    .logo { 
      position: absolute; 
      top: 30px; 
      left: 30px; 
      height: 60px; 
      z-index: 2;
    }
    .hero-text { 
      position: absolute; 
      bottom: 40px; 
      left: 40px; 
      color: white; 
      z-index: 2;
    }
    .hero h1 { font-size: 48px; font-weight: 300; letter-spacing: 2px; margin-bottom: 8px; }
    .hero p { font-size: 18px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 48px; }
    .stats { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 24px; 
      margin-bottom: 48px;
    }
    .stat { 
      text-align: center; 
      padding: 24px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px;
    }
    .stat-value { font-size: 36px; font-weight: 300; margin-bottom: 8px; color: #111827; }
    .stat-label { 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: #6b7280; 
      font-weight: 500;
    }
    h2 { 
      font-size: 32px; 
      font-weight: 300; 
      letter-spacing: 1px; 
      margin: 48px 0 24px; 
      color: #111827;
    }
    .gallery { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 16px; 
      margin-bottom: 48px;
    }
    .gallery img { 
      width: 100%; 
      height: 200px; 
      object-fit: cover; 
      border-radius: 12px; 
      cursor: pointer;
      transition: transform 0.3s;
    }
    .gallery img:hover { transform: scale(1.05); }
    .floorplan { 
      background: #f9fafb; 
      padding: 32px; 
      border-radius: 12px; 
      border: 1px solid #e5e7eb;
      margin-bottom: 48px;
    }
    .floorplan img { width: 100%; height: auto; border-radius: 8px; }
    .amenities { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 12px;
    }
    .amenity { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      padding: 16px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px;
    }
    .amenity-dot { 
      width: 8px; 
      height: 8px; 
      border-radius: 50%; 
      background: #3b82f6;
      flex-shrink: 0;
    }
    .amenity-text { font-size: 16px; font-weight: 300; letter-spacing: 0.5px; }
    .footer { 
      text-align: center; 
      padding: 32px 0; 
      border-top: 1px solid #e5e7eb; 
      margin-top: 48px;
      color: #6b7280;
      font-size: 13px;
    }
    @media print {
      @page { size: letter; margin: 0.5in; }
      body { padding: 0; background: white; }
      .hero { height: 300px; page-break-after: avoid; }
      .hero h1 { font-size: 36px; }
      .content { padding: 24px; }
      .stats { gap: 12px; margin-bottom: 24px; }
      .stat { padding: 16px; }
      .stat-value { font-size: 28px; }
      h2 { font-size: 24px; margin: 24px 0 16px; }
      .gallery { gap: 8px; margin-bottom: 24px; }
      .gallery img { height: 150px; }
      .floorplan { padding: 16px; margin-bottom: 24px; }
      .amenities { gap: 8px; }
      .amenity { padding: 12px; }
      .footer { padding: 16px 0; margin-top: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      ${aircraft.images?.[0] ? `<img src="${aircraft.images[0].media.path}" alt="Aircraft" class="hero-bg">` : ''}
      <img src="${logoUrl}" alt="Stratos Jets" class="logo">
      <div class="hero-text">
        <h1>${aircraft.aircraft_type?.name || 'Luxury Aircraft'}</h1>
        ${aircraft.aircraft_type?.aircraft_class?.name ? `<p>${aircraft.aircraft_type.aircraft_class.name} Jet</p>` : ''}
      </div>
    </div>
    
    <div class="content">
      <div class="stats">
        ${aircraft.passengers_max ? `
          <div class="stat">
            <div class="stat-value">${aircraft.passengers_max}</div>
            <div class="stat-label">Passengers</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.sleeping_places ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.sleeping_places}</div>
            <div class="stat-label">Sleeping Places</div>
          </div>` : ''}
        ${aircraft.year_of_production ? `
          <div class="stat">
            <div class="stat-value">${aircraft.year_of_production}</div>
            <div class="stat-label">Year Built</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.refurbishment ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.refurbishment}</div>
            <div class="stat-label">Refurbished</div>
          </div>` : ''}
      </div>
      
      ${aircraft.images?.filter((img: any) => img.tag?.value === 'cabin').length > 0 ? `
        <h2>Interior Gallery</h2>
        <div class="gallery">
          ${aircraft.images.filter((img: any) => img.tag?.value === 'cabin').map((img: any) => 
            `<img src="${img.media.path}" alt="Interior">`
          ).join('')}
        </div>` : ''}
      
      ${aircraft.images?.find((img: any) => img.tag?.value === 'plan') ? `
        <h2>Aircraft Layout</h2>
        <div class="floorplan">
          <img src="${aircraft.images.find((img: any) => img.tag?.value === 'plan').media.path}" alt="Floor Plan">
        </div>` : ''}
      
      ${aircraft.aircraft_extension ? `
        <h2>Premium Amenities</h2>
        <div class="amenities">
          ${aircraft.aircraft_extension.wireless_internet ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Complimentary WiFi</span></div>' : ''}
          ${aircraft.aircraft_extension.entertainment_system ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Entertainment System</span></div>' : ''}
          ${aircraft.aircraft_extension.shower ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Private Shower</span></div>' : ''}
          ${aircraft.aircraft_extension.pets_allowed ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Pet Friendly</span></div>' : ''}
          ${aircraft.aircraft_extension.divan_seats ? `<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">${aircraft.aircraft_extension.divan_seats} Divan Seats</span></div>` : ''}
        </div>` : ''}
      
      <div class="footer">
        Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${aircraft?.registration_number || 'aircraft'}-showcase.html`;
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
