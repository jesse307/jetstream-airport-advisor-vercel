import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface AircraftInfo {
  id: string;
  tailNumber: string;
  type: string;
  passengers: string;
  price: string;
  details: string;
  link?: string;
  images?: string[];
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
      // Parse both HTML inputs separately
      const parser = new DOMParser();
      const doc1 = parser.parseFromString(htmlInput1, 'text/html');
      const doc2 = parser.parseFromString(htmlInput2, 'text/html');
      
      const text1 = doc1.body.textContent || "";
      const text2 = doc2.body.textContent || "";
      
      // For first HTML: split by multiple delimiters to find aircraft entries
      // Try splitting by common separators that might indicate different aircraft
      let lines1 = text1.split(/\n+/).filter(line => line.trim());
      
      // If we don't get enough lines, try splitting by multiple spaces or tabs
      if (lines1.length < 4) {
        lines1 = text1.split(/\s{3,}|\t+/).filter(line => line.trim());
      }
      
      // If still not enough, try to find sections with multiple prices
      if (lines1.length < 4) {
        const pricePattern = /\$[\d,]+/g;
        const allPrices = text1.match(pricePattern) || [];
        
        // If we have 12 prices (3 per aircraft × 4 aircraft), split the text into 4 chunks
        if (allPrices.length >= 9) {
          const chunkSize = Math.floor(text1.length / 4);
          lines1 = [];
          for (let i = 0; i < 4; i++) {
            const start = i * chunkSize;
            const end = (i === 3) ? text1.length : (i + 1) * chunkSize;
            const chunk = text1.substring(start, end);
            if (chunk.match(pricePattern)) {
              lines1.push(chunk);
            }
          }
        }
      }
      
      console.log('Lines found:', lines1.length);
      console.log('Lines:', lines1);
      
      const pricesPerLine: { value: string; amount: number; line: string }[] = [];
      
      lines1.forEach((line, idx) => {
        const pricesInLine = line.match(/\$[\d,]+/g);
        console.log(`Line ${idx} prices:`, pricesInLine);
        
        if (pricesInLine && pricesInLine.length > 0) {
          // Find the highest price in this line
          let maxPrice = pricesInLine[0];
          let maxAmount = parseInt(pricesInLine[0].replace(/[$,]/g, ''));
          
          pricesInLine.forEach(price => {
            const amount = parseInt(price.replace(/[$,]/g, ''));
            if (amount > maxAmount) {
              maxAmount = amount;
              maxPrice = price;
            }
          });
          
          pricesPerLine.push({ value: maxPrice, amount: maxAmount, line });
        }
      });
      
      console.log('Prices per line:', pricesPerLine);
      
      // Combine both texts for context
      const combinedText = text1 + "\n\n" + text2;
      const combinedHTML = htmlInput1 + "\n\n" + htmlInput2;
      
      // Extract URLs from second HTML box only (where the links should be)
      const links2 = [...doc2.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean);
      const urlsInText2 = text2.match(/https?:\/\/[^\s]+/g) || [];
      const allLinks = [...new Set([...links2, ...urlsInText2])];
      
      console.log('Links found in second box:', allLinks);
      
      // Extract all tail numbers, aircraft types, and passengers
      const tailNumberMatches = combinedText.match(/N\d{1,5}[A-Z]{0,2}/gi) || [];
      
      // Extract aircraft types - being more specific and excluding operators
      const operatorNames = ['Prime', 'NetJets', 'Flexjet', 'VistaJet', 'XOJet', 'Sentient', 'Wheels Up', 'Magellan', 'Air Charter Service', 'Journey'];
      const aircraftTypePatterns = [
        // Specific manufacturers with models
        /(?:Gulfstream|Bombardier|Cessna|Embraer|Dassault|Boeing|Airbus)\s+(?:Citation|Challenger|Global|Legacy|Falcon|Phenom|Hawker|Learjet|G|CL)[\w-]+/gi,
        // Common format: Word + alphanumeric (like "Citation X", "Global 6000")
        /(?:Citation|Challenger|Global|Legacy|Falcon|Phenom|Hawker|Learjet|Gulfstream)\s+[\w-]+/gi
      ];
      
      let aircraftTypes: string[] = [];
      aircraftTypePatterns.forEach(pattern => {
        const matches = combinedText.match(pattern);
        if (matches) {
          // Filter out any matches that contain operator names
          const filtered = matches.filter(match => 
            !operatorNames.some(op => match.toLowerCase().includes(op.toLowerCase()))
          );
          aircraftTypes = [...aircraftTypes, ...filtered];
        }
      });
      
      // Clean up aircraft types - remove extra spaces and normalize
      aircraftTypes = aircraftTypes.map(type => type.trim().replace(/\s+/g, ' '));
      
      const passengersMatches = combinedText.match(/(\d+)\s*(passenger|pax|seat|people)/gi) || [];
      
      // Create aircraft entries based on highest prices per line
      const newAircraft: AircraftInfo[] = pricesPerLine.map((priceObj, index) => {
        // Use the line context for this price
        const context = priceObj.line;
        
        // Find tail number in context
        const tailInContext = context.match(/N\d{1,5}[A-Z]{0,2}/i);
        const tailNumber = tailInContext ? tailInContext[0] : (tailNumberMatches[index] || "");
        
        // Find aircraft type in context - look for manufacturer + model
        let aircraftType = "";
        const typePatterns = [
          /(?:Gulfstream|Bombardier|Cessna|Embraer|Dassault)\s+(?:Citation|Challenger|Global|Legacy|Falcon|Phenom|G|CL)[\w-]+/i,
          /(?:Citation|Challenger|Global|Legacy|Falcon|Phenom|Hawker|Learjet|Gulfstream)\s+[\w-]+/i
        ];
        
        for (const pattern of typePatterns) {
          const typeMatch = context.match(pattern);
          if (typeMatch) {
            aircraftType = typeMatch[0].trim().replace(/\s+/g, ' ');
            // Make sure it doesn't contain operator names
            const hasOperator = operatorNames.some(op => aircraftType.toLowerCase().includes(op.toLowerCase()));
            if (!hasOperator) break;
            aircraftType = ""; // Reset if it contains operator name
          }
        }
        
        if (!aircraftType && aircraftTypes[index]) {
          aircraftType = aircraftTypes[index];
        }
        
        // Find passengers in context
        const passengersInContext = context.match(/(\d+)\s*(passenger|pax|seat|people)/i);
        const passengers = passengersInContext ? passengersInContext[1] : "";
        
        // Look for this aircraft's details in the second HTML box
        let detailsParts: string[] = [];
        let aircraftLink = '';
        
        // Try to find matching section in text2 by tail number or aircraft type
        let matchingSection = "";
        let matchingHTML = "";
        
        if (tailNumber) {
          const tailRegex = new RegExp(`${tailNumber}[\\s\\S]{0,500}`, 'i');
          const match = text2.match(tailRegex);
          if (match) matchingSection = match[0];
          
          // Also try to find in HTML to extract link
          const htmlMatch = htmlInput2.match(new RegExp(`${tailNumber}[\\s\\S]{0,500}`, 'i'));
          if (htmlMatch) matchingHTML = htmlMatch[0];
        }
        
        // If no match by tail, try by aircraft type
        if (!matchingSection && aircraftType) {
          const typeRegex = new RegExp(`${aircraftType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,500}`, 'i');
          const match = text2.match(typeRegex);
          if (match) matchingSection = match[0];
          
          const htmlMatch = htmlInput2.match(new RegExp(`${aircraftType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,500}`, 'i'));
          if (htmlMatch) matchingHTML = htmlMatch[0];
        }
        
        // If still no match, use index-based section from text2
        if (!matchingSection) {
          const lines2 = text2.split(/\n+/).filter(line => line.trim());
          if (lines2[index]) {
            matchingSection = lines2[index];
          }
        }
        
        // Extract link from matching HTML section
        if (matchingHTML) {
          const linkMatch = matchingHTML.match(/href=["']([^"']+)["']/i);
          if (linkMatch) {
            aircraftLink = linkMatch[1];
          }
        }
        
        // Fallback to links by index
        if (!aircraftLink && allLinks[index]) {
          aircraftLink = allLinks[index];
        }
        
        console.log(`Aircraft ${index} link:`, aircraftLink);
        
        // Extract Wyvern rating (more flexible pattern)
        const wyvernMatch = matchingSection.match(/Wyvern[:\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) || 
                           text2.match(new RegExp(`Wyvern[:\\s-]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'gi'))?.[index]?.match(/Wyvern[:\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        
        // Extract Argus rating (more flexible pattern)
        const argusMatch = matchingSection.match(/Argus[:\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?)/i) ||
                          text2.match(new RegExp(`Argus[:\\s-]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?(?:\\s+[A-Z][a-z]+)?)`, 'gi'))?.[index]?.match(/Argus[:\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?)/i);
        
        if (wyvernMatch) {
          detailsParts.push(`Wyvern: ${wyvernMatch[1].trim()}`);
        }
        
        if (argusMatch) {
          detailsParts.push(`Argus: ${argusMatch[1].trim()}`);
        }
        
        // Extract amenities/notes from second box (wifi, etc.)
        const amenitiesPattern = /(?:free\s+)?wifi|entertainment|lavatory|galley|refreshments|catering|baggage|cargo|pets?\s+allowed|smoking|non-?smoking/gi;
        const amenitiesMatches = matchingSection.match(amenitiesPattern);
        if (amenitiesMatches && amenitiesMatches.length > 0) {
          const uniqueAmenities = [...new Set(amenitiesMatches.map(a => a.trim()))];
          detailsParts.push(uniqueAmenities.join(', '));
        }
        
        const details = detailsParts.join(' • ');
        
        return {
          id: Date.now().toString() + index,
          tailNumber,
          type: aircraftType,
          passengers,
          price: priceObj.value,
          details,
          link: aircraftLink
        };
      });
      
      // Add aircraft to list
      if (newAircraft.length > 0) {
        console.log('Setting aircraft with tail numbers:', newAircraft.map(a => ({ id: a.id, tailNumber: a.tailNumber })));
        setAircraft(newAircraft);
        
        // Fetch images for aircraft with tail numbers
        console.log('Calling fetchAircraftImages...');
        fetchAircraftImages(newAircraft);
        
        toast({
          title: "Aircraft Created",
          description: `Created ${newAircraft.length} aircraft (highest price per line)`
        });
      }
      
      const info = {
        combinedText,
        combinedHTML,
        tailNumbers: tailNumberMatches,
        prices: pricesPerLine.map(p => p.value),
        passengers: passengersMatches,
        aircraftTypes: [...new Set(aircraftTypes)],
        allLinks,
        rawHtml1: htmlInput1,
        rawHtml2: htmlInput2,
      };
      
      setExtractedInfo(info);
      
      toast({
        title: "Info Extracted",
        description: `Found ${pricesPerLine.length} aircraft (max price per line)`
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

  const fetchAircraftImages = async (aircraftList: AircraftInfo[]) => {
    console.log('fetchAircraftImages called with:', aircraftList.length, 'aircraft');
    
    for (const aircraft of aircraftList) {
      console.log('Processing aircraft:', aircraft.tailNumber);
      
      if (aircraft.tailNumber && aircraft.tailNumber.trim().length > 0) {
        try {
          console.log('Fetching images for tail number:', aircraft.tailNumber);
          
          const { data, error } = await supabase.functions.invoke('get-aviapages-aircraft', {
            body: { tailNumber: aircraft.tailNumber }
          });

          console.log('Response for', aircraft.tailNumber, ':', { success: data?.success, error });

          if (error) {
            console.error('Error fetching aircraft images:', error);
            continue;
          }

          if (data?.success && data?.data?.results?.[0]?.images) {
            const images = data.data.results[0].images;
            console.log('Found', images.length, 'images for', aircraft.tailNumber);
            
            // Get up to 3 images - aviapages returns images with media.path
            const imageUrls = images.slice(0, 3).map((img: any) => img.media.path);
            console.log('Image URLs:', imageUrls);
            
            // Update aircraft with images
            setAircraft(prev => prev.map(a => 
              a.id === aircraft.id ? { ...a, images: imageUrls } : a
            ));
          } else {
            console.log('No images found for', aircraft.tailNumber);
          }
        } catch (error) {
          console.error('Error fetching images for', aircraft.tailNumber, error);
        }
      } else {
        console.log('Skipping aircraft - no tail number');
      }
    }
  };

  const generateEmailHTML = async () => {
    // Fetch images for aircraft with tail numbers first
    console.log('Generating email - fetching images for aircraft with tail numbers');
    await fetchAircraftImages(aircraft);
    
    // Small delay to ensure images are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
  <title>Private Charter Proposal</title>
  <style>
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      background: #ffffff;
      margin: 0;
      padding: 0;
      color: #333333;
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .header { 
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 2px solid #1e40af;
    }
    .logo { 
      max-height: 50px; 
      margin-bottom: 20px;
    }
    .header-title { 
      font-size: 24px; 
      font-weight: normal; 
      color: #1e40af;
      margin: 0 0 8px 0;
    }
    .header-subtitle { 
      color: #666666; 
      font-size: 14px;
      margin: 0;
    }
    .intro {
      padding: 30px 30px 20px;
      font-size: 15px;
      color: #333333;
    }
    .content { 
      padding: 20px 30px 40px;
    }
    .aircraft-section {
      margin-bottom: 30px;
      padding: 0;
      border: 1px solid #cccccc;
      background: #ffffff;
    }
    .aircraft-header {
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #cccccc;
    }
    .aircraft-header table {
      width: 100%;
      border-collapse: collapse;
    }
    .option-number {
      font-size: 12px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 5px 0;
      font-weight: bold;
    }
    .aircraft-type { 
      font-size: 18px; 
      font-weight: bold; 
      color: #1e40af;
      margin: 0 0 5px 0;
    }
    .rating-badge {
      display: inline-block;
      padding: 4px 10px;
      margin-right: 8px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8f9fa;
      border: 1px solid #1e40af;
      color: #1e40af;
    }
    .aircraft-price {
      font-size: 24px;
      font-weight: bold;
      color: #333333;
      text-align: right;
      margin: 0;
    }
    .aircraft-body {
      padding: 20px;
    }
    .info-row {
      padding: 12px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #999999;
      letter-spacing: 1px;
      margin-bottom: 4px;
      font-weight: bold;
    }
    .info-value {
      font-size: 16px;
      color: #333333;
    }
    .ratings-row {
      margin: 12px 0 0 0;
    }
    .details-section {
      margin: 15px 0;
      padding: 15px;
      background: #f8f9fa;
    }
    .details-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #666666;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .details-list {
      color: #333333;
      font-size: 14px;
      line-height: 1.8;
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .details-list li {
      padding-left: 20px;
      position: relative;
      margin-bottom: 4px;
    }
    .details-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #1e40af;
      font-weight: bold;
    }
    .aircraft-images {
      margin: 15px 0;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .aircraft-image {
      width: 120px;
      height: 90px;
      object-fit: cover;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
    }
    .cta-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      text-align: center;
    }
    .quote-button {
      display: inline-block;
      padding: 12px 30px;
      background: #1e40af;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .quote-button:hover {
      background: #1e3a8a;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #1e40af;
      margin-top: 20px;
    }
    .footer-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .footer-text {
      color: #666666;
      font-size: 13px;
      line-height: 1.6;
      margin: 5px 0;
    }
    table {
      border-collapse: collapse;
    }
    @media only screen and (max-width: 600px) {
      .header, .intro, .content, .footer { 
        padding-left: 20px; 
        padding-right: 20px; 
      }
      .aircraft-price { 
        font-size: 20px; 
        margin-top: 10px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Stratos Jet Charters" class="logo">` : ''}
            <h1 class="header-title">Private Charter Proposal</h1>
            <p class="header-subtitle">Curated Aircraft Options for Your Journey</p>
          </div>
          
          <div class="intro">
            <p>Dear Client,</p>
            <p>Thank you for considering Stratos Jet Charters. Based on your requirements, we have identified the following aircraft options. Each has been carefully selected and vetted for safety and service excellence.</p>
          </div>
          
          <div class="content">
            ${aircraft.map((a, idx) => {
              const detailsParts = (a.details || '').split('•').map(p => p.trim());
              let wyvernRating = '';
              let argusRating = '';
              let detailsItems: string[] = [];
              
              detailsParts.forEach(part => {
                if (part.toLowerCase().startsWith('wyvern:')) {
                  wyvernRating = part.replace(/wyvern:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('argus:')) {
                  argusRating = part.replace(/argus:\s*/i, '').trim();
                } else if (part.length > 3) {
                  // Split by common delimiters and clean up
                  const items = part.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0);
                  detailsItems.push(...items);
                }
              });
              
              return `
              <div class="aircraft-section">
                <div class="aircraft-header">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="70%">
                        <p class="option-number">Option ${idx + 1}</p>
                        <p class="aircraft-type">${a.type || 'Aircraft'}</p>
                        ${wyvernRating || argusRating ? `
                          <div class="ratings-row">
                            ${wyvernRating ? `<span class="rating-badge">Wyvern ${wyvernRating}</span>` : ''}
                            ${argusRating ? `<span class="rating-badge">Argus ${argusRating}</span>` : ''}
                          </div>
                        ` : ''}
                      </td>
                      <td width="30%" valign="top">
                        <p class="aircraft-price">${a.price || 'TBD'}</p>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <div class="aircraft-body">
                  ${a.passengers ? `
                    <div class="info-row">
                      <div class="info-label">Passenger Capacity</div>
                      <div class="info-value">${a.passengers} Passengers</div>
                    </div>
                  ` : ''}
                  
                  ${detailsItems.length > 0 ? `
                    <div class="details-section">
                      <div class="details-label">Details</div>
                      <ul class="details-list">
                        ${detailsItems.map(item => `<li>${item}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  ${a.images && a.images.length > 0 ? `
                    <div class="aircraft-images">
                      ${a.images.map(img => `<img src="${img}" alt="Aircraft" class="aircraft-image" />`).join('')}
                    </div>
                  ` : ''}
                  
                  ${a.link ? `
                    <div class="cta-section">
                      <a href="${a.link}" class="quote-button">View Complete Quote</a>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            }).join('')}
          </div>
          
          <div class="footer">
            <div class="footer-title">Stratos Jet Charters, Inc.</div>
            <p class="footer-text">Your Trusted Partner in Private Aviation</p>
            <p class="footer-text">Available 24/7 for Your Travel Needs</p>
            <p class="footer-text" style="margin-top: 15px; color: #999999; font-size: 12px;">
              This proposal is valid for 48 hours. Aircraft availability subject to confirmation.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
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
