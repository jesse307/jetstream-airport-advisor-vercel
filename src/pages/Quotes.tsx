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
    const urls = extracted.quote_urls || [];
    
    const route = extracted.departure_airport && extracted.arrival_airport 
      ? `${extracted.departure_airport}-${extracted.arrival_airport}` 
      : '';
    
    // Build quote HTML similar to QuoteComposer format
    const quoteHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hello,</p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 24px 0;">
      Thank you for your interest in private jet charter services. Below is the available option for your upcoming trip:
    </p>

    <div style="margin-bottom: 0; padding: 24px; background: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      ${extracted.operator ? `
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; background: #0066cc; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: 600; margin-bottom: 12px;">
          ${extracted.operator}
        </span>
      </div>
      ` : ''}
      
      <h3 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">
        ${extracted.aircraft_type || 'Aircraft'}
      </h3>
      
      <h4 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #0066cc;">
        ${extracted.currency ? extracted.currency + ' ' : ''}${extracted.price || 'Price TBD'}
      </h4>
      
      ${extracted.passengers ? `
      <p style="margin: 0 0 8px 0; font-size: 15px; color: #555; line-height: 1.5;">
        <strong>Capacity:</strong> ${extracted.passengers} passenger${parseInt(extracted.passengers) > 1 ? 's' : ''}
      </p>
      ` : ''}
      
      ${extracted.notes ? `
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; font-style: italic; line-height: 1.4;">
        ${extracted.notes}
      </p>
      ` : ''}
      
      ${route || extracted.travel_date ? `
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">
        ${route ? `<strong>Route:</strong> ${route}` : ''} 
        ${route && extracted.travel_date ? ' • ' : ''}
        ${extracted.travel_date ? `<strong>Date:</strong> ${extracted.travel_date}` : ''}
      </p>
      ` : ''}
      
      ${urls.length > 0 ? `
      <a href="${urls[0]}" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
        View Full Quote Details →
      </a>
      ` : ''}
      
      ${urls.length > 1 ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; font-weight: 600;">Additional Quote Links:</p>
        ${urls.slice(1).map((url: string, idx: number) => `
        <a href="${url}" style="display: block; margin: 4px 0; font-size: 13px; color: #0066cc; text-decoration: underline;">
          Quote Link ${idx + 2}
        </a>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 16px 0;">
        Please review the option above and let me know if you have any questions or would like to proceed with booking.
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
                    {extracted.operator && (
                      <div className="flex items-start gap-2">
                        <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Operator</p>
                          <p className="text-sm text-muted-foreground">{extracted.operator}</p>
                        </div>
                      </div>
                    )}
                    {extracted.aircraft_type && (
                      <div className="flex items-start gap-2">
                        <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Aircraft</p>
                          <p className="text-sm text-muted-foreground">{extracted.aircraft_type}</p>
                        </div>
                      </div>
                    )}
                    {(extracted.departure_airport || extracted.arrival_airport) && (
                      <div className="flex items-start gap-2">
                        <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Route</p>
                          <p className="text-sm text-muted-foreground">
                            {extracted.departure_airport || '?'} → {extracted.arrival_airport || '?'}
                          </p>
                        </div>
                      </div>
                    )}
                    {extracted.travel_date && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Travel Date</p>
                          <p className="text-sm text-muted-foreground">{extracted.travel_date}</p>
                        </div>
                      </div>
                    )}
                    {extracted.passengers && (
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Passengers</p>
                          <p className="text-sm text-muted-foreground">{extracted.passengers}</p>
                        </div>
                      </div>
                    )}
                    {extracted.price && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Price</p>
                          <p className="text-sm text-muted-foreground">
                            {extracted.currency && `${extracted.currency} `}{extracted.price}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {extracted.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{extracted.notes}</p>
                    </div>
                  )}
                   {(extracted.contact_name || extracted.contact_email || extracted.contact_phone) && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Contact Info</p>
                      {extracted.contact_name && (
                        <p className="text-sm text-muted-foreground">{extracted.contact_name}</p>
                      )}
                      {extracted.contact_email && (
                        <p className="text-sm text-muted-foreground">{extracted.contact_email}</p>
                      )}
                      {extracted.contact_phone && (
                        <p className="text-sm text-muted-foreground">{extracted.contact_phone}</p>
                      )}
                    </div>
                  )}
                  {extracted.quote_urls && extracted.quote_urls.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        Quote Links ({extracted.quote_urls.length})
                      </p>
                      <div className="space-y-1">
                        {extracted.quote_urls.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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
