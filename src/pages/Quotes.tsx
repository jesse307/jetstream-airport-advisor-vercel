import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Plane, Calendar, Users, DollarSign, Copy, Check, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  sender_email: string;
  subject: string;
  extracted_data: any;
  created_at: string;
  status: string;
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        () => {
          console.log('Quotes updated');
          fetchQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuotes(data || []);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatForGmail = (quote: Quote) => {
    const extracted = quote.extracted_data || {};
    const quotes = extracted.quotes || [];
    
    if (quotes.length === 0) {
      return '<p>No quotes found</p>';
    }
    
    // Extract common route/dates from first quote
    const firstQuote = quotes[0];
    const route = firstQuote.route || '';
    const dates = firstQuote.dates || '';
    
    // Stratos Jets branding colors
    const stratosNavy = '#1a3a52';
    const stratosBlue = '#2c5f8d';
    const stratosLightBlue = '#3d7ab5';
    
    // Build quote HTML with Stratos branding
    const quoteHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .quote-card { width: 100% !important; display: block !important; margin-bottom: 16px !important; }
      .quote-wrapper { padding: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff;">
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">Hello,</p>
            </td>
          </tr>
          
          <!-- Route & Dates Header -->
          ${route || dates ? `
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${stratosNavy} 0%, ${stratosLightBlue} 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(26, 58, 82, 0.15);">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    ${route ? `
                    <div style="margin-bottom: ${dates ? '12px' : '0'};">
                      <span style="color: rgba(255,255,255,0.9); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Your Route</span>
                      <h2 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 8px 0 0 0; letter-spacing: 3px;">${route}</h2>
                    </div>
                    ` : ''}
                    ${dates ? `
                    <div style="margin-top: ${route ? '12px' : '0'}; padding-top: ${route ? '12px' : '0'}; ${route ? 'border-top: 1px solid rgba(255,255,255,0.25);' : ''}">
                      <span style="color: rgba(255,255,255,0.9); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Travel Dates</span>
                      <p style="color: #ffffff; font-size: 17px; font-weight: 600; margin: 6px 0 0 0; letter-spacing: 0.5px;">${dates}</p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Introduction -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0;">
                Thank you for your interest. Below are the available aircraft options for your flight:
              </p>
            </td>
          </tr>

          <!-- Quotes Container -->
          <tr>
            <td class="quote-wrapper" style="padding: 0 20px 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${quotes.map((q: any, index: number) => `
                    <td class="quote-card" style="width: ${100 / Math.min(quotes.length, 2)}%; vertical-align: top; padding: ${index % 2 === 1 ? '0 0 0 10px' : '0 10px 0 0'};">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 2px solid ${stratosBlue}; border-radius: 8px; box-shadow: 0 2px 6px rgba(26, 58, 82, 0.08);">
                        <tr>
                          <td style="padding: 20px;">
                            <!-- Option Badge -->
                            <span style="display: inline-block; background: ${stratosNavy}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;">
                              Option ${index + 1}
                            </span>
                            
                            <!-- Aircraft Name -->
                            <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: ${stratosNavy}; line-height: 1.2;">
                              ${q.aircraft_type}
                            </h3>
                            
                            <!-- Price -->
                            ${q.price ? `
                            <h4 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: ${stratosLightBlue};">
                              ${q.currency ? q.currency + ' ' : ''}${q.price}
                            </h4>
                            ` : ''}
                            
                            <!-- Details -->
                            <p style="margin: 0 0 6px 0; font-size: 13px; color: #666; line-height: 1.4;">
                              ${q.passengers ? `<strong>${q.passengers} passengers</strong>` : ''}
                              ${q.category ? ` • ${q.category}` : ''}
                            </p>
                            
                            ${q.certifications ? `
                            <p style="margin: 0 0 12px 0; font-size: 11px; color: #888; line-height: 1.3; font-style: italic;">
                              ${q.certifications}
                            </p>
                            ` : ''}
                            
                            <!-- View Button -->
                            ${q.url ? `
                            <a href="${q.url}" style="display: inline-block; margin-top: 8px; padding: 10px 18px; background: ${stratosNavy}; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                              View Details →
                            </a>
                            ` : ''}
                          </td>
                        </tr>
                      </table>
                    </td>
                    ${(index + 1) % 2 === 0 && index < quotes.length - 1 ? '</tr><tr>' : ''}
                  `).join('')}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 30px 30px 30px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 20px 0 0 0;">
                Please review these options and let me know if you have any questions or would like to proceed with booking.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 16px 0 0 0;">
                Best regards
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #888; line-height: 1.5;">
                <strong style="color: ${stratosNavy};">Stratos Jets</strong><br>
                Transparent Pricing • Simplified Bookings • Flawless Coordination<br>
                <a href="https://www.stratosjets.com" style="color: ${stratosBlue}; text-decoration: none;">www.stratosjets.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    return quoteHTML;
  };

  const copyToClipboard = async (quote: Quote) => {
    const html = formatForGmail(quote);
    
    try {
      // Try to copy as HTML for Gmail
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      await navigator.clipboard.write(data);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "HTML copied! Paste directly into Gmail",
      });
    } catch (error) {
      // Fallback to plain text
      try {
        await navigator.clipboard.writeText(html);
        setCopiedId(quote.id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({
          title: "Copied!",
          description: "HTML code copied to clipboard",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Charter Quotes</h1>
        <p className="text-muted-foreground">
          Quotes received via email webhook
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">📧 Resend Inbound Email Setup:</p>
          <ol className="text-sm space-y-2 mb-3">
            <li>1. Go to <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Resend Domains</a></li>
            <li>2. Add an inbound route for your domain</li>
            <li>3. Forward emails to this webhook URL:</li>
          </ol>
          <code className="text-xs bg-background p-2 rounded block break-all">
            https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/receive-quote-email
          </code>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Once set up, forward Salesforce quote emails to your Resend address and they'll appear here with URLs extracted!
          </p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quotes received yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Forward emails to the webhook URL above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {quotes.map((quote) => {
            const extracted = quote.extracted_data || {};
            return (
              <Card key={quote.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {quote.subject || 'No Subject'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {quote.sender_email}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setPreviewId(previewId === quote.id ? null : quote.id)}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {previewId === quote.id ? 'Hide Preview' : 'Preview'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(quote)}
                        variant="outline"
                      >
                        {copiedId === quote.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy for Gmail
                          </>
                        )}
                      </Button>
                      <Badge variant={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const quotes = extracted.quotes || [];
                      if (quotes.length === 0) {
                        return <p className="text-sm text-muted-foreground col-span-2">No quotes extracted yet</p>;
                      }
                      
                      return (
                        <div className="col-span-2 space-y-4">
                          <p className="text-sm font-semibold">{quotes.length} Quote{quotes.length > 1 ? 's' : ''} Found:</p>
                          {quotes.map((q: any, idx: number) => (
                            <div key={idx} className="p-4 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Option {idx + 1}</Badge>
                                {q.aircraft_type && <span className="font-semibold">{q.aircraft_type}</span>}
                              </div>
                              {q.price && (
                                <p className="text-lg font-bold text-primary">
                                  {q.currency ? `${q.currency} ` : ''}{q.price}
                                </p>
                              )}
                              <div className="text-sm space-y-1">
                                {q.passengers && (
                                  <p><strong>Passengers:</strong> {q.passengers}</p>
                                )}
                                {q.category && (
                                  <p><strong>Category:</strong> {q.category}</p>
                                )}
                                {q.certifications && (
                                  <p className="text-muted-foreground italic">{q.certifications}</p>
                                )}
                                {q.route && (
                                  <p><strong>Route:</strong> {q.route}</p>
                                )}
                                {q.dates && (
                                  <p><strong>Dates:</strong> {q.dates}</p>
                                )}
                                {q.url && (
                                  <a 
                                    href={q.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline block truncate"
                                  >
                                    {q.url}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Received: {new Date(quote.created_at).toLocaleString()}
                  </p>
                  
                  {previewId === quote.id && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-sm font-semibold mb-3">Email Preview</h4>
                      <div 
                        className="border rounded-lg p-4 bg-white overflow-auto max-h-[600px]"
                        dangerouslySetInnerHTML={{ __html: formatForGmail(quote) }}
                      />
                      <p className="text-xs text-muted-foreground mt-3">
                        This is how your email will look when pasted into Gmail
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
