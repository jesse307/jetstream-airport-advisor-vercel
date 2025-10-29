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
  link?: string;
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
        setAircraft(newAircraft);
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
  <title>Your Exclusive Private Charter Proposal</title>
  <!--[if mso]>
  <style type="text/css">
  body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 0;
      margin: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 40px 20px;
    }
    .container { 
      max-width: 680px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header { 
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer {
      0%, 100% { transform: translate(-25%, -25%); }
      50% { transform: translate(0%, 0%); }
    }
    .logo { 
      height: 56px; 
      margin-bottom: 24px; 
      position: relative;
      z-index: 1;
      filter: brightness(0) invert(1);
    }
    h1 { 
      font-size: 32px; 
      font-weight: 700; 
      color: #ffffff;
      margin-bottom: 12px;
      position: relative;
      z-index: 1;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .subtitle { 
      color: rgba(255,255,255,0.9); 
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 2px;
      text-transform: uppercase;
      position: relative;
      z-index: 1;
    }
    .intro {
      padding: 40px 40px 24px;
      background: #ffffff;
    }
    .intro-text {
      font-size: 16px;
      line-height: 1.7;
      color: #334155;
      margin-bottom: 8px;
    }
    .intro-highlight {
      font-size: 14px;
      color: #64748b;
      font-style: italic;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
      margin: 0 40px;
    }
    .content { 
      padding: 32px 40px 40px;
      background: #ffffff;
    }
    .aircraft-section {
      margin-bottom: 28px;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .aircraft-section:hover {
      border-color: #2563eb;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.15);
      transform: translateY(-2px);
    }
    .aircraft-section:last-child {
      margin-bottom: 0;
    }
    .aircraft-header {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      padding: 24px 28px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .aircraft-header::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(50%, -50%);
    }
    .aircraft-header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    .aircraft-type { 
      font-size: 26px; 
      font-weight: 700; 
      color: #ffffff;
      margin-bottom: 6px;
      letter-spacing: -0.3px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .aircraft-tail {
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      background: rgba(255,255,255,0.15);
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
      backdrop-filter: blur(10px);
    }
    .aircraft-price {
      font-size: 36px;
      font-weight: 300;
      color: #ffffff;
      text-align: right;
      line-height: 1;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .aircraft-body {
      padding: 28px;
    }
    .info-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .info-card {
      flex: 1;
      min-width: 140px;
      padding: 16px 20px;
      background: #ffffff;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      transition: all 0.2s;
    }
    .info-card:hover {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .info-value {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.3px;
    }
    .ratings-container {
      margin: 20px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      padding: 10px 18px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      border: 2px solid rgba(255,255,255,0.2);
    }
    .rating-badge.argus {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    .rating-badge::before {
      content: '★';
      margin-right: 6px;
      font-size: 16px;
    }
    .amenities {
      margin: 20px 0;
      padding: 18px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 10px;
      border-left: 4px solid #2563eb;
    }
    .amenities-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #1e40af;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .amenities-text {
      color: #334155;
      font-size: 14px;
      line-height: 1.6;
      font-weight: 500;
    }
    .cta-container {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .quote-button {
      display: inline-block;
      padding: 16px 36px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.5px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
      transition: all 0.3s ease;
      text-transform: uppercase;
      border: 2px solid rgba(255,255,255,0.3);
    }
    .quote-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.45);
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 48px 40px;
      text-align: center;
      color: #cbd5e1;
    }
    .footer-title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.3px;
    }
    .footer-text {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
    .footer-contact {
      font-size: 13px;
      color: #64748b;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer-link {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 640px) {
      .email-wrapper { padding: 20px 10px; }
      .header { padding: 32px 24px; }
      h1 { font-size: 24px; }
      .intro, .content { padding: 24px; }
      .aircraft-header { padding: 20px; }
      .aircraft-type { font-size: 20px; }
      .aircraft-price { font-size: 28px; }
      .aircraft-body { padding: 20px; }
      .info-grid { flex-direction: column; }
      .info-card { min-width: 100%; }
      .footer { padding: 32px 24px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Stratos Jet Charters" class="logo">` : ''}
        <h1>Your Exclusive Charter Proposal</h1>
        <p class="subtitle">Curated Flight Options</p>
      </div>
      
      <div class="intro">
        <p class="intro-text">
          Thank you for considering Stratos Jet Charters for your private aviation needs. 
          We've carefully selected the following premium aircraft options tailored to your requirements.
        </p>
        <p class="intro-highlight">
          Each aircraft has been vetted for safety, luxury, and performance.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <div class="content">
        ${aircraft.map((a) => {
          // Parse details to extract ratings and amenities
          const detailsParts = (a.details || '').split('•').map(p => p.trim());
          let wyvernRating = '';
          let argusRating = '';
          let amenities = '';
          
          detailsParts.forEach(part => {
            if (part.toLowerCase().startsWith('wyvern:')) {
              wyvernRating = part.replace(/wyvern:\s*/i, '').trim();
            } else if (part.toLowerCase().startsWith('argus:')) {
              argusRating = part.replace(/argus:\s*/i, '').trim();
            } else if (part.length > 3) {
              amenities = part;
            }
          });
          
          return `
          <div class="aircraft-section">
            <div class="aircraft-header">
              <div class="aircraft-header-content">
                <div>
                  <div class="aircraft-type">${a.type || 'Premium Aircraft'}</div>
                  <div class="aircraft-tail">${a.tailNumber || 'Available'}</div>
                </div>
                <div class="aircraft-price">${a.price || 'TBD'}</div>
              </div>
            </div>
            
            <div class="aircraft-body">
              ${a.passengers ? `
                <div class="info-grid">
                  <div class="info-card">
                    <div class="info-label">Passenger Capacity</div>
                    <div class="info-value">${a.passengers}</div>
                  </div>
                </div>
              ` : ''}
              
              ${wyvernRating || argusRating ? `
                <div class="ratings-container">
                  ${wyvernRating ? `<span class="rating-badge">${wyvernRating} Certified</span>` : ''}
                  ${argusRating ? `<span class="rating-badge argus">${argusRating} Rated</span>` : ''}
                </div>
              ` : ''}
              
              ${amenities ? `
                <div class="amenities">
                  <div class="amenities-label">Included Amenities</div>
                  <div class="amenities-text">${amenities}</div>
                </div>
              ` : ''}
              
              ${a.link ? `
                <div class="cta-container">
                  <a href="${a.link}" class="quote-button">View Complete Quote →</a>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        }).join('')}
      </div>
      
      <div class="footer">
        <div class="footer-title">Stratos Jet Charters</div>
        <p class="footer-text">
          Elevating private aviation with unparalleled service, safety, and sophistication.<br>
          Your journey begins the moment you contact us.
        </p>
        <div class="footer-contact">
          Questions? Contact your dedicated aviation specialist or visit<br>
          <a href="https://stratosjets.com" class="footer-link">stratosjets.com</a>
        </div>
      </div>
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
