import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LeadImport = () => {
  const navigate = useNavigate();
  const [unstructuredData, setUnstructuredData] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

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
          }).then(({ data }) => ({ email: data?.isValid || false }))
          .catch(() => ({ email: null }))
        );
      } else {
        validationPromises.push(Promise.resolve({ email: null }));
      }

      if (parsedData.phone) {
        validationPromises.push(
          supabase.functions.invoke('validate-phone', {
            body: { phone: parsedData.phone }
          }).then(({ data }) => ({ phone: data?.isValid || false }))
          .catch(() => ({ phone: null }))
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Import Lead Data</h1>
          <p className="text-muted-foreground mt-2">
            Paste unstructured data from Salesforce and let AI parse it into structured fields
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Paste Data</h2>
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
              className="min-h-[200px] font-mono text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={isParsing || !unstructuredData.trim()}
              className="mt-4"
              variant="aviation"
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
          </Card>

          {parsedData && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Parsed Data</h2>
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="text-foreground">{parsedData.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="text-foreground">{parsedData.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{parsedData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-foreground">{parsedData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trip Type</label>
                    <p className="text-foreground capitalize">{parsedData.trip_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Passengers</label>
                    <p className="text-foreground">{parsedData.passengers}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Departure Airport</label>
                    <p className="text-foreground">{parsedData.departure_airport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Arrival Airport</label>
                    <p className="text-foreground">{parsedData.arrival_airport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Departure Date</label>
                    <p className="text-foreground">{new Date(parsedData.departure_date).toLocaleDateString('en-US')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Departure Time</label>
                    <p className="text-foreground">{parsedData.departure_time || 'Not specified'}</p>
                  </div>
                  {parsedData.return_date && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Return Date</label>
                        <p className="text-foreground">{new Date(parsedData.return_date).toLocaleDateString('en-US')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Return Time</label>
                        <p className="text-foreground">{parsedData.return_time || 'Not specified'}</p>
                      </div>
                    </>
                  )}
                </div>
                {parsedData.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-foreground">{parsedData.notes}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                variant="default"
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
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadImport;