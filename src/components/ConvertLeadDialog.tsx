import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  departure_airport: string;
  arrival_airport: string;
  departure_datetime?: string;
  return_datetime?: string;
  // Legacy columns (kept for backward compatibility)
  departure_date: string;
  departure_time?: string;
  return_date?: string;
  return_time?: string;
  passengers: number;
  trip_type: string;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ConvertLeadDialog = ({ lead, open, onOpenChange, onSuccess }: ConvertLeadDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState({
    company: "",
    industry: "",
    website: "",
    description: "",
  });
  const [opportunityData, setOpportunityData] = useState({
    name: "",
    amount: "",
    probability: "50",
    expectedCloseDate: "",
    description: "",
  });

  // Auto-fill opportunity name when dialog opens with a new lead
  useEffect(() => {
    if (lead && open) {
      // Generate route string
      let route = `${lead.departure_airport} - ${lead.arrival_airport}`;

      // If roundtrip, add return to departure airport
      if (lead.trip_type.toLowerCase() === 'roundtrip') {
        route += ` - ${lead.departure_airport}`;
      }

      // Format the departure date
      const formattedDate = format(new Date(lead.departure_date), 'MMM d, yyyy');

      // Combine route and date
      const opportunityName = `${route} | ${formattedDate}`;

      setOpportunityData({
        name: opportunityName,
        amount: "",
        probability: "50",
        expectedCloseDate: "",
        description: "",
      });
    }
  }, [lead, open]);

  const handleConvert = async () => {
    if (!lead || !user) return;

    setLoading(true);
    try {
      // Create account from lead
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: `${lead.first_name} ${lead.last_name}`,
          email: lead.email,
          phone: lead.phone,
          company: accountData.company || null,
          industry: accountData.industry || null,
          website: accountData.website || null,
          description: accountData.description || null,
          lead_id: lead.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Create opportunity with complete trip information from lead
      // Convert trip_type from lead format ("One Way", "Round Trip") to opportunity format ("one-way", "round-trip")
      const convertTripType = (tripType: string): string => {
        if (tripType === "One Way") return "one-way";
        if (tripType === "Round Trip") return "round-trip";
        return tripType.toLowerCase().replace(/\s+/g, '-');
      };

      const opportunityInsert: any = {
        name: opportunityData.name || `${lead.departure_airport} to ${lead.arrival_airport} - ${lead.first_name} ${lead.last_name}`,
        account_id: account.id,
        stage: "qualification",
        amount: opportunityData.amount ? parseFloat(opportunityData.amount) : null,
        probability: parseInt(opportunityData.probability),
        expected_close_date: opportunityData.expectedCloseDate || null,
        description: opportunityData.description || null,
        departure_airport: lead.departure_airport,
        arrival_airport: lead.arrival_airport,
        departure_date: lead.departure_date,
        passengers: lead.passengers,
        trip_type: convertTripType(lead.trip_type),
        user_id: user.id,
      };

      // Include datetime fields if available
      if (lead.departure_datetime) {
        opportunityInsert.departure_datetime = lead.departure_datetime;
      }
      if (lead.return_datetime) {
        opportunityInsert.return_datetime = lead.return_datetime;
      }
      if (lead.return_date) {
        opportunityInsert.return_date = lead.return_date;
      }

      const { error: opportunityError } = await supabase
        .from("opportunities")
        .insert(opportunityInsert);

      if (opportunityError) throw opportunityError;

      // Update lead to mark as converted
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          converted_to_account_id: account.id,
          converted_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      toast.success("Lead converted to account successfully!");
      onOpenChange(false);
      onSuccess();

      // Reset form
      setAccountData({
        company: "",
        industry: "",
        website: "",
        description: "",
      });
      setOpportunityData({
        name: "",
        amount: "",
        probability: "50",
        expectedCloseDate: "",
        description: "",
      });
    } catch (error: any) {
      console.error("Error converting lead:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to convert lead to account";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      toast.error(`Conversion failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Account</DialogTitle>
          <DialogDescription>
            Convert {lead.first_name} {lead.last_name} to an account and create an opportunity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Auto-filled)</Label>
                <Input
                  id="name"
                  value={`${lead.first_name} ${lead.last_name}`}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Auto-filled)</Label>
                <Input
                  id="email"
                  value={lead.email}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={accountData.company}
                  onChange={(e) => setAccountData({ ...accountData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={accountData.industry}
                  onChange={(e) => setAccountData({ ...accountData, industry: e.target.value })}
                  placeholder="e.g., Technology, Finance"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={accountData.website}
                  onChange={(e) => setAccountData({ ...accountData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="accountDescription">Account Description</Label>
                <Textarea
                  id="accountDescription"
                  value={accountData.description}
                  onChange={(e) => setAccountData({ ...accountData, description: e.target.value })}
                  placeholder="Additional account notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Opportunity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Opportunity Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="opportunityName">Opportunity Name (Auto-filled)</Label>
                <Input
                  id="opportunityName"
                  value={opportunityData.name}
                  onChange={(e) => setOpportunityData({ ...opportunityData, name: e.target.value })}
                  placeholder="Route and date auto-generated"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={opportunityData.amount}
                  onChange={(e) => setOpportunityData({ ...opportunityData, amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={opportunityData.probability}
                  onChange={(e) => setOpportunityData({ ...opportunityData, probability: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={opportunityData.expectedCloseDate}
                  onChange={(e) => setOpportunityData({ ...opportunityData, expectedCloseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="opportunityDescription">Opportunity Description</Label>
                <Textarea
                  id="opportunityDescription"
                  value={opportunityData.description}
                  onChange={(e) => setOpportunityData({ ...opportunityData, description: e.target.value })}
                  placeholder="Details about this opportunity..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Trip Details Summary */}
          <div className="space-y-2 bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm">Trip Details (Auto-filled from Lead)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Route:</span>{" "}
                {lead.departure_airport} → {lead.arrival_airport}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                {new Date(lead.departure_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Passengers:</span> {lead.passengers}
              </div>
              <div>
                <span className="text-muted-foreground">Trip Type:</span>{" "}
                {lead.trip_type}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
