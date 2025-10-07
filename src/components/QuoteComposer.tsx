import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ParsedQuote {
  option: string;
  price: string;
  aircraft: string;
  passengers: string;
  category: string;
  certifications: string;
  link: string;
  route: string;
  dates: string;
}

export function QuoteComposer() {
  const [rawQuotes, setRawQuotes] = useState("");
  const [parsedQuotes, setParsedQuotes] = useState<ParsedQuote[]>([]);
  const [clientName, setClientName] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const parseQuotes = () => {
    if (!rawQuotes.trim()) {
      toast.error("Please paste quote data first");
      return;
    }

    try {
      const quotes: ParsedQuote[] = [];
      // Split by "Option" to get each quote block
      const blocks = rawQuotes.split(/Option \d+/i).filter(block => block.trim());

      blocks.forEach((block, index) => {
        // Extract price
        const priceMatch = block.match(/\$[\d,]+\.?\d*/);
        const price = priceMatch ? priceMatch[0] : "";

        // Extract aircraft name (everything between price and passenger count)
        const aircraftMatch = block.match(/\$[\d,]+\.?\d*\s*-\s*([^-\(]+)/);
        const aircraft = aircraftMatch ? aircraftMatch[1].trim() : "";

        // Extract passengers and category
        const passengerMatch = block.match(/\((\d+)\s+passengers?,\s*([^)]+)\)/i);
        const passengers = passengerMatch ? passengerMatch[1] : "";
        const category = passengerMatch ? passengerMatch[2] : "";

        // Extract certifications (text between category and "Click here")
        const certMatch = block.match(/\)\s*-\s*([^;]+(?:;[^C]+)*?)(?=Click here|$)/i);
        const certifications = certMatch ? certMatch[1].replace(/;$/, '').trim() : "";

        // Extract route and dates from the "Click here" line
        const linkMatch = block.match(/Click here to view quote for ([^\s]+)\s+([\d\/\-]+)/i);
        const route = linkMatch ? linkMatch[1] : "";
        const dates = linkMatch ? linkMatch[2] : "";

        // Extract actual URL - look for http/https URLs
        const urlMatch = block.match(/https?:\/\/[^\s\n]+/);
        let link = urlMatch ? urlMatch[0] : "";
        
        // If no URL found, check if there's a "Click here" that might have a URL on next line
        if (!link && block.includes("Click here")) {
          const lines = block.split('\n');
          for (const line of lines) {
            const url = line.match(/https?:\/\/[^\s]+/);
            if (url) {
              link = url[0];
              break;
            }
          }
        }

        if (price && aircraft) {
          quotes.push({
            option: `Option ${index + 1}`,
            price,
            aircraft,
            passengers,
            category,
            certifications,
            link: link || "#",
            route,
            dates
          });
        }
      });

      if (quotes.length === 0) {
        toast.error("Could not parse quotes. Please check the format.");
        return;
      }

      setParsedQuotes(quotes);
      setShowPreview(true);
      toast.success(`Parsed ${quotes.length} quote${quotes.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Error parsing quotes");
    }
  };

  const generateHTML = () => {
    const greeting = clientName ? `Dear ${clientName},` : "Hello,";
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${greeting}</p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 24px 0;">
      Thank you for your interest in private jet charter services. Below are the available options for your upcoming trip:
    </p>

    ${parsedQuotes.map((quote, index) => `
    <div style="margin-bottom: ${index < parsedQuotes.length - 1 ? '32px' : '0'}; padding: 24px; background: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; background: #0066cc; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: 600; margin-bottom: 12px;">
          ${quote.option}
        </span>
      </div>
      
      <h3 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">
        ${quote.aircraft}
      </h3>
      
      <h4 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #0066cc;">
        ${quote.price}
      </h4>
      
      <p style="margin: 0 0 8px 0; font-size: 15px; color: #555; line-height: 1.5;">
        <strong>Capacity:</strong> ${quote.passengers} passenger${parseInt(quote.passengers) > 1 ? 's' : ''} 
        ${quote.category ? `• <strong>Category:</strong> ${quote.category}` : ''}
      </p>
      
      ${quote.certifications ? `
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; font-style: italic; line-height: 1.4;">
        ${quote.certifications}
      </p>
      ` : ''}
      
      ${quote.route ? `
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">
        <strong>Route:</strong> ${quote.route} ${quote.dates ? `• <strong>Dates:</strong> ${quote.dates}` : ''}
      </p>
      ` : ''}
      
      <a href="${quote.link}" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
        View Full Quote Details →
      </a>
    </div>
    `).join('')}

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 16px 0;">
        Please review the options above and let me know if you have any questions or would like to proceed with booking.
      </p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 16px 0;">
        I'm here to help make your journey seamless and comfortable.
      </p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0;">
        Best regards
      </p>
    </div>
  </div>
</body>
</html>`;
  };

  const copyToClipboard = () => {
    const html = generateHTML();
    
    // Create a temporary element to copy both HTML and plain text
    const textArea = document.createElement('textarea');
    textArea.value = html;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      // Try to copy as HTML for Gmail
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      navigator.clipboard.write(data).then(() => {
        toast.success("HTML copied! Paste directly into Gmail");
      }).catch(() => {
        // Fallback to plain HTML text
        document.execCommand('copy');
        toast.success("HTML code copied! Paste into Gmail compose window");
      });
    } catch (error) {
      document.execCommand('copy');
      toast.success("HTML code copied!");
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Quote Email Composer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste your raw quotes (1-6 at a time) to generate a professional Gmail-ready email
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name (Optional)</Label>
            <Input
              id="clientName"
              placeholder="e.g., John Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rawQuotes">Paste Quotes Here</Label>
            <Textarea
              id="rawQuotes"
              placeholder={`Paste quotes with URLs in this format:

Option 1
$35,590.87 - Citation Ultra - (7 passengers, Light) - ARGUS Gold;
Click here to view quote for ORL-RBW-CHO-RBW-ORL 10/8/2025-10/9/2025
https://your-quote-url.com/quote1

Option 2
...`}
              value={rawQuotes}
              onChange={(e) => setRawQuotes(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={parseQuotes} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Parse Quotes
          </Button>
        </CardContent>
      </Card>

      {showPreview && parsedQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is how your email will look. Copy and paste into Gmail compose window.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HTML Preview */}
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: generateHTML() }}
            />

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1 gap-2">
                <Copy className="h-4 w-4" />
                Copy HTML for Gmail
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>To use in Gmail:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click "Copy HTML for Gmail" button above</li>
                <li>Open Gmail and click Compose or Reply to an existing thread</li>
                <li>Click in the compose area and press Ctrl+V (or Cmd+V on Mac)</li>
                <li>The formatted email will appear with all styling intact</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}