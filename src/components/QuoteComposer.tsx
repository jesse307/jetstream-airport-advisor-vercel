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

        // Extract aircraft name (text before the first hyphen or parenthesis)
        const aircraftMatch = block.match(/^[^-\(]+/);
        const aircraft = aircraftMatch ? aircraftMatch[0].trim() : "";

        // Extract passengers and category
        const passengerMatch = block.match(/\((\d+)\s+passengers?,\s*([^)]+)\)/i);
        const passengers = passengerMatch ? passengerMatch[1] : "";
        const category = passengerMatch ? passengerMatch[2] : "";

        // Extract certifications (text between category and link)
        const certMatch = block.match(/\)\s*-\s*([^;]+);?\s*Click here/i);
        const certifications = certMatch ? certMatch[1].trim() : "";

        // Extract link
        const linkMatch = block.match(/Click here to view quote for ([^\s]+)\s+([\d\/\-]+)\s*$/i);
        const route = linkMatch ? linkMatch[1] : "";
        const dates = linkMatch ? linkMatch[2] : "";

        // Find the actual URL (though in your format it seems to be implicit)
        const urlMatch = block.match(/https?:\/\/[^\s]+/);
        const link = urlMatch ? urlMatch[0] : "#";

        if (price && aircraft) {
          quotes.push({
            option: `Option ${index + 1}`,
            price,
            aircraft,
            passengers,
            category,
            certifications,
            link,
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
    <div style="margin-bottom: ${index < parsedQuotes.length - 1 ? '24px' : '0'}; padding: 20px; background: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 4px;">
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; background: #0066cc; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
          ${quote.option}
        </span>
      </div>
      
      <h3 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #0066cc;">
        ${quote.price}
      </h3>
      
      <h4 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        ${quote.aircraft}
      </h4>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
        <strong>Capacity:</strong> ${quote.passengers} passenger${parseInt(quote.passengers) > 1 ? 's' : ''} 
        ${quote.category ? `• <strong>Category:</strong> ${quote.category}` : ''}
      </p>
      
      ${quote.certifications ? `
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #666; font-style: italic;">
        ${quote.certifications}
      </p>
      ` : ''}
      
      <a href="${quote.link}" style="display: inline-block; margin-top: 8px; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
        View Full Quote Details
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
              placeholder={`Paste quotes in this format:

Option 1
$35,590.87 - Citation Ultra - (7 passengers, Light) - ARGUS Gold;
Click here to view quote for ORL-RBW-CHO-RBW-ORL 10/8/2025-10/9/2025

Option 2
...`}
              value={rawQuotes}
              onChange={(e) => setRawQuotes(e.target.value)}
              rows={8}
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