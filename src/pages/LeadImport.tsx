import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Clock, Plane } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PendingImport {
  id: string;
  raw_data: string;
  created_at: string;
  source: string;
}

const LeadImport = () => {
  const navigate = useNavigate();
  const [unstructuredData, setUnstructuredData] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [isLoadingImports, setIsLoadingImports] = useState(true);

  useEffect(() => {
    fetchPendingImports();
    
    // Poll for new imports every 3 seconds for the first 15 seconds
    const pollInterval = setInterval(() => {
      fetchPendingImports();
    }, 3000);
    
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 15000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const fetchPendingImports = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_lead_imports')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingImports(data || []);
    } catch (error: any) {
      console.error('Error fetching pending imports:', error);
      toast.error("Failed to load pending imports");
    } finally {
      setIsLoadingImports(false);
    }
  };

  const handleLoadImport = async (importItem: PendingImport) => {
    setUnstructuredData(importItem.raw_data);
    setParsedData(null);
    
    // Mark as processed
    try {
      await supabase
        .from('pending_lead_imports')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', importItem.id);
      
      // Remove from pending list
      setPendingImports(prev => prev.filter(item => item.id !== importItem.id));
      toast.success("Import loaded! Click 'Parse with AI' to continue.");
    } catch (error: any) {
      console.error('Error marking import as processed:', error);
    }
  };

  const testWebhook = async () => {
    try {
      const testData = {
        rawData: "TEST DATA\nThis is a test from the Lead Import page\nURL: https://test.com\nEmail: test@example.com"
      };
      
      console.log("Testing webhook with data:", testData);
      
      const response = await fetch("https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/receive-lead-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      console.log("Webhook response:", result);
      
      if (response.ok) {
        toast.success("Webhook test successful! Check pending imports.");
        fetchPendingImports();
      } else {
        toast.error(`Webhook test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Webhook test error:", error);
      toast.error(`Webhook test error: ${error.message}`);
    }
  };

  const handleParse = async () => {
    if (!unstructuredData.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-lead-data', {
        body: { unstructuredData }
      });

      if (error) throw error;

      if (data.parsedData) {
        setParsedData(data.parsedData);
        toast.success("Data parsed successfully!");
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(error.message || "Failed to parse data");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData) {
      toast.error("Please parse data first");
      return;
    }

    setIsSubmitting(true);
    try {
      const leadData = {
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        email: parsedData.email,
        phone: parsedData.phone || null,
        trip_type: parsedData.trip_type,
        departure_airport: parsedData.departure_airport,
        arrival_airport: parsedData.arrival_airport,
        departure_date: parsedData.departure_date,
        departure_time: parsedData.departure_time || null,
        return_date: parsedData.return_date || null,
        return_time: parsedData.return_time || null,
        passengers: parsedData.passengers,
        notes: parsedData.notes || null,
        status: 'new'
      };

      const { data: lead, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      // Validate email and phone
      const validationPromises = [];
      
      if (parsedData.email) {
        validationPromises.push(
          supabase.functions.invoke('validate-email', {
            body: { email: parsedData.email }
          }).then(({ data: result, error }) => ({ 
            email: error ? true : (result?.isValid ?? true) // Default to true on error
          }))
          .catch(() => ({ email: true })) // Default to true on error
        );
      } else {
        validationPromises.push(Promise.resolve({ email: null }));
      }

      if (parsedData.phone) {
        validationPromises.push(
          supabase.functions.invoke('validate-phone', {
            body: { phone: parsedData.phone }
          }).then(({ data: result, error }) => ({ 
            phone: error ? true : (result?.isValid ?? true) // Default to true on error
          }))
          .catch(() => ({ phone: true })) // Default to true on error
        );
      } else {
        validationPromises.push(Promise.resolve({ phone: null }));
      }

      const [emailResult, phoneResult] = await Promise.all(validationPromises);

      // Update lead with validation results
      await supabase
        .from('leads')
        .update({
          email_valid: emailResult.email,
          phone_valid: phoneResult.phone
        })
        .eq('id', lead.id);

      toast.success("Lead created and validated successfully!");
      navigate(`/leads/${lead.id}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary p-2">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Charter Pro</h1>
                <p className="text-xs text-muted-foreground">Lead Import</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            size="sm"
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Import Lead Data</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste unstructured data or select from pending imports
          </p>
        </div>

        <div className="space-y-4">
          {/* Pending Imports - Compact */}
          {pendingImports.length > 0 && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Pending Imports</h3>
                <Badge variant="secondary" className="text-xs h-5">{pendingImports.length}</Badge>
              </div>
              <div className="space-y-1.5">
                {isLoadingImports ? (
                  <div className="text-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  pendingImports.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadImport(item)}
                      className="w-full text-left p-2 rounded-md border border-border hover:bg-accent hover:border-primary transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs mt-0.5 line-clamp-1 break-words text-foreground">
                            {item.raw_data.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Paste Data</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testWebhook}
              >
                Test Webhook
              </Button>
            </div>
            <Textarea
              value={unstructuredData}
              onChange={(e) => setUnstructuredData(e.target.value)}
              placeholder="Paste your unstructured data here... 

Example:
Contact: John Doe
Email: john@example.com
Phone: 555-1234
Trip from New York to Los Angeles
Departure: 2025-10-15 at 10:00 AM
Return: 2025-10-20 at 3:00 PM
Passengers: 4
Notes: VIP client, prefers window seats"
              className="min-h-[180px] font-mono text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={isParsing || !unstructuredData.trim()}
              className="mt-4"
            >
              {isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>

          {parsedData && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-5">
              <h3 className="text-base font-semibold mb-4">Parsed Data</h3>
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">First Name</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.first_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.last_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Trip Type</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.trip_type}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Passengers</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.passengers}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Departure Airport</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.departure_airport}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Arrival Airport</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.arrival_airport}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Departure Date</label>
                    <p className="text-sm text-foreground mt-0.5">{new Date(parsedData.departure_date).toLocaleDateString('en-US')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Departure Time</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.departure_time || 'Not specified'}</p>
                  </div>
                  {parsedData.return_date && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Return Date</label>
                        <p className="text-sm text-foreground mt-0.5">{new Date(parsedData.return_date).toLocaleDateString('en-US')}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Return Time</label>
                        <p className="text-sm text-foreground mt-0.5">{parsedData.return_time || 'Not specified'}</p>
                      </div>
                    </>
                  )}
                </div>
                {parsedData.notes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm text-foreground mt-0.5">{parsedData.notes}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  'Create Lead & Start Flow'
                )}
              </Button>
            </div>
          )}
          </div>
        </div>
          </div>
        </div>
  );
};

export default LeadImport;