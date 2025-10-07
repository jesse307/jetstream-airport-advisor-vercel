import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Plane, Calendar, Users, DollarSign, Copy, Check } from "lucide-react";
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
    
    let formattedText = '';
    
    // Add operator/company info
    if (extracted.operator) {
      formattedText += `Operator: ${extracted.operator}\n`;
    }
    
    // Add aircraft type
    if (extracted.aircraft_type) {
      formattedText += `Aircraft: ${extracted.aircraft_type}\n`;
    }
    
    // Add route
    if (extracted.departure_airport || extracted.arrival_airport) {
      formattedText += `Route: ${extracted.departure_airport || '?'} → ${extracted.arrival_airport || '?'}\n`;
    }
    
    // Add date
    if (extracted.travel_date) {
      formattedText += `Date: ${extracted.travel_date}\n`;
    }
    
    // Add passengers
    if (extracted.passengers) {
      formattedText += `Passengers: ${extracted.passengers}\n`;
    }
    
    // Add price
    if (extracted.price) {
      formattedText += `Price: ${extracted.currency ? extracted.currency + ' ' : ''}${extracted.price}\n`;
    }
    
    // Add notes
    if (extracted.notes) {
      formattedText += `\nNotes: ${extracted.notes}\n`;
    }
    
    // Add contact info
    if (extracted.contact_name || extracted.contact_email || extracted.contact_phone) {
      formattedText += '\nContact:\n';
      if (extracted.contact_name) formattedText += `  ${extracted.contact_name}\n`;
      if (extracted.contact_email) formattedText += `  ${extracted.contact_email}\n`;
      if (extracted.contact_phone) formattedText += `  ${extracted.contact_phone}\n`;
    }
    
    // Add URLs
    if (urls.length > 0) {
      formattedText += '\nQuote Links:\n';
      urls.forEach((url: string, idx: number) => {
        formattedText += `${idx + 1}. ${url}\n`;
      });
    }
    
    return formattedText;
  };

  const copyToClipboard = async (quote: Quote) => {
    const formatted = formatForGmail(quote);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Quote formatted and copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
