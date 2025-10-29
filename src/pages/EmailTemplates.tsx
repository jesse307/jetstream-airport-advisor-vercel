import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AircraftInfo {
  id: string;
  tailNumber: string;
  type: string;
  passengers: string;
  price: string;
  details: string;
}

export default function EmailTemplates() {
  const [htmlInput1, setHtmlInput1] = useState("");
  const [htmlInput2, setHtmlInput2] = useState("");
  const [aircraft, setAircraft] = useState<AircraftInfo[]>([]);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const { toast } = useToast();

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, setInput: (value: string) => void) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    
    // Try to get HTML format first
    const htmlData = clipboardData.getData('text/html');
    if (htmlData) {
      setInput(htmlData);
      toast({
        title: "HTML Captured",
        description: "Pasted HTML content successfully"
      });
    } else {
      // Fallback to plain text
      const textData = clipboardData.getData('text/plain');
      setInput(textData);
      toast({
        title: "Text Captured",
        description: "No HTML detected, pasted as plain text"
      });
    }
  };

  const extractInfoFromHTML = () => {
    try {
      // Combine both HTML inputs
      const combinedHTML = htmlInput1 + "\n\n" + htmlInput2;
      
      // Create temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(combinedHTML, 'text/html');
      
      // Extract text content for pattern matching
      const textContent = doc.body.textContent || "";
      
      // Extract URLs from href attributes and plain text
      const links = [...doc.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean);
      const urlsInText = textContent.match(/https?:\/\/[^\s]+/g) || [];
      const allLinks = [...new Set([...links, ...urlsInText])];
      const finalLink = allLinks.length > 0 ? allLinks[allLinks.length - 1] : null;
      
      // Try to extract common patterns from text
      const tailNumberMatch = textContent.match(/N\d{1,5}[A-Z]{0,2}/gi);
      const priceMatch = textContent.match(/\$[\d,]+/g);
      const passengersMatch = textContent.match(/(\d+)\s*(passenger|pax|seat|people)/gi);
      
      // Try to extract aircraft types (common patterns)
      const aircraftTypePatterns = [
        /(?:Gulfstream|Bombardier|Cessna|Embraer|Dassault|Boeing|Airbus|Citation|Challenger|Global|Legacy|Falcon|Phenom|Hawker|Learjet)\s+[A-Z0-9-]+/gi,
        /[A-Z][a-z]+\s+[A-Z0-9-]+(?:\s+(?:ER|SP|XR|XRS))?/g
      ];
      
      let aircraftTypes: string[] = [];
      aircraftTypePatterns.forEach(pattern => {
        const matches = textContent.match(pattern);
        if (matches) aircraftTypes = [...aircraftTypes, ...matches];
      });
      
      const info = {
        combinedText: textContent,
        combinedHTML,
        tailNumbers: tailNumberMatch || [],
        prices: priceMatch || [],
        passengers: passengersMatch || [],
        aircraftTypes: [...new Set(aircraftTypes)],
        allLinks,
        finalLink,
        rawHtml1: htmlInput1,
        rawHtml2: htmlInput2,
      };
      
      setExtractedInfo(info);
      
      toast({
        title: "Info Extracted",
        description: `Found ${tailNumberMatch?.length || 0} tail numbers, ${priceMatch?.length || 0} prices, ${aircraftTypes.length} aircraft types`
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Error",
        description: "Failed to parse HTML",
        variant: "destructive"
      });
    }
  };

  const addAircraft = () => {
    const newAircraft: AircraftInfo = {
      id: Date.now().toString(),
      tailNumber: "",
      type: "",
      passengers: "",
      price: "",
      details: ""
    };
    setAircraft([...aircraft, newAircraft]);
  };

  const updateAircraft = (id: string, field: keyof AircraftInfo, value: string) => {
    setAircraft(aircraft.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAircraft = (id: string) => {
    setAircraft(aircraft.filter(a => a.id !== id));
  };

  const generateEmailHTML = async () => {
    // Fetch logo and convert to base64
    let logoBase64 = '';
    try {
      const logoResponse = await fetch('/images/stratos_logo.png');
      const logoBlob = await logoResponse.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
    }

    const emailHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Charter Proposal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f5f5f5;
      padding: 20px;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header { 
      background: white;
      padding: 32px;
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
    }
    .logo { height: 48px; margin-bottom: 16px; }
    h1 { 
      font-size: 28px; 
      font-weight: 600; 
      color: #111827;
      margin-bottom: 8px;
    }
    .subtitle { 
      color: #6b7280; 
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content { padding: 32px; }
    .aircraft-section {
      margin-bottom: 32px;
      padding: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
    }
    .aircraft-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .aircraft-type { 
      font-size: 22px; 
      font-weight: 600; 
      color: #111827;
    }
    .aircraft-tail {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .aircraft-price {
      font-size: 28px;
      font-weight: 300;
      color: #0ea5e9;
    }
    .aircraft-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .detail-item {
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      margin: 24px 0;
      padding: 14px 32px;
      background: #0ea5e9;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Stratos Jets" class="logo">` : ''}
      <h1>Your Private Charter Proposal</h1>
      <p class="subtitle">Luxury Aircraft Options</p>
    </div>
    
    <div class="content">
      ${aircraft.map(a => `
        <div class="aircraft-section">
          <div class="aircraft-header">
            <div>
              <div class="aircraft-type">${a.type || 'Aircraft'}</div>
              <div class="aircraft-tail">${a.tailNumber || 'N/A'}</div>
            </div>
            <div class="aircraft-price">${a.price || '$0'}</div>
          </div>
          
          ${a.passengers ? `
            <div class="aircraft-details">
              <div class="detail-item">
                <div class="detail-label">Passengers</div>
                <div class="detail-value">${a.passengers}</div>
              </div>
            </div>
          ` : ''}
          
          ${a.details ? `
            <div style="margin-top: 12px; color: #4b5563; font-size: 14px; line-height: 1.6;">
              ${a.details}
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      ${extractedInfo?.finalLink ? `
        <div style="text-align: center;">
          <a href="${extractedInfo.finalLink}" class="cta-button">
            View Full Details
          </a>
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p class="footer-text">
        <strong>Stratos Jet Charters</strong><br>
        Your trusted partner in private aviation<br>
        Contact us anytime for personalized service
      </p>
    </div>
  </div>
</body>
</html>`;

    // Copy to clipboard
    await navigator.clipboard.writeText(emailHTML);
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(emailHTML);
      previewWindow.document.close();
    }
    
    toast({
      title: "Email HTML Generated",
      description: "HTML copied to clipboard and opened in new window"
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Template Builder</CardTitle>
            <CardDescription>
              Paste HTML from your CRM/emails to extract info and build beautiful proposals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>HTML Input 1</Label>
                <Textarea
                  placeholder="Paste first HTML content here..."
                  value={htmlInput1}
                  onChange={(e) => setHtmlInput1(e.target.value)}
                  onPaste={(e) => handlePaste(e, setHtmlInput1)}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>HTML Input 2</Label>
                <Textarea
                  placeholder="Paste second HTML content here..."
                  value={htmlInput2}
                  onChange={(e) => setHtmlInput2(e.target.value)}
                  onPaste={(e) => handlePaste(e, setHtmlInput2)}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
            </div>

            <Button onClick={extractInfoFromHTML} className="w-full">
              Extract Information
            </Button>

            {extractedInfo && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">Extracted Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {extractedInfo.tailNumbers.length > 0 && (
                    <div>
                      <strong>Tail Numbers:</strong> {extractedInfo.tailNumbers.join(', ')}
                    </div>
                  )}
                  {extractedInfo.aircraftTypes.length > 0 && (
                    <div>
                      <strong>Aircraft Types:</strong> {extractedInfo.aircraftTypes.join(', ')}
                    </div>
                  )}
                  {extractedInfo.prices.length > 0 && (
                    <div>
                      <strong>Prices:</strong> {extractedInfo.prices.join(', ')}
                    </div>
                  )}
                  {extractedInfo.passengers.length > 0 && (
                    <div>
                      <strong>Passengers:</strong> {extractedInfo.passengers.join(', ')}
                    </div>
                  )}
                  {extractedInfo.allLinks.length > 0 && (
                    <div>
                      <strong>Links Found:</strong>
                      <div className="mt-1 space-y-1">
                        {extractedInfo.allLinks.map((link: string, idx: number) => (
                          <div key={idx}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs break-all">
                              {link}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">View Combined HTML</summary>
                    <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-40">
                      {extractedInfo.combinedHTML}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aircraft</CardTitle>
                <CardDescription>Add aircraft to your proposal</CardDescription>
              </div>
              <Button onClick={addAircraft} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Aircraft
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aircraft.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No aircraft added yet. Click "Add Aircraft" to get started.
              </div>
            ) : (
              aircraft.map((a, index) => (
                <Card key={a.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Aircraft {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAircraft(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tail Number</Label>
                        <Textarea
                          placeholder="e.g., N12345"
                          value={a.tailNumber}
                          onChange={(e) => updateAircraft(a.id, 'tailNumber', e.target.value)}
                          rows={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Aircraft Type</Label>
                        <Textarea
                          placeholder="e.g., Gulfstream G650"
                          value={a.type}
                          onChange={(e) => updateAircraft(a.id, 'type', e.target.value)}
                          rows={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passengers</Label>
                        <Textarea
                          placeholder="e.g., 12"
                          value={a.passengers}
                          onChange={(e) => updateAircraft(a.id, 'passengers', e.target.value)}
                          rows={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Textarea
                          placeholder="e.g., $45,000"
                          value={a.price}
                          onChange={(e) => updateAircraft(a.id, 'price', e.target.value)}
                          rows={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Details</Label>
                      <Textarea
                        placeholder="Any additional information about this aircraft..."
                        value={a.details}
                        onChange={(e) => updateAircraft(a.id, 'details', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {aircraft.length > 0 && (
              <div className="flex gap-2 pt-4">
                <Button onClick={generateEmailHTML} className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview & Copy HTML
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
