import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Building2, Mail, Phone, Plus, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  industry: string | null;
  created_at: string;
}

interface Opportunity {
  id: string;
  name: string;
  account_id: string;
  stage: string;
  amount: number | null;
  probability: number | null;
  expected_close_date: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  created_at: string;
}

const Accounts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [opportunities, setOpportunities] = useState<{ [accountId: string]: Opportunity[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState({
    name: "",
    amount: "",
    probability: "50",
    expectedCloseDate: "",
    description: "",
    stage: "prospecting",
  });
  const [savingOpportunity, setSavingOpportunity] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm]);

  const fetchAccounts = async () => {
    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;

      setAccounts(accountsData || []);

      // Fetch opportunities for all accounts
      if (accountsData && accountsData.length > 0) {
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (oppsError) throw oppsError;

        // Group opportunities by account_id
        const groupedOpps = (oppsData || []).reduce((acc, opp) => {
          if (!acc[opp.account_id]) {
            acc[opp.account_id] = [];
          }
          acc[opp.account_id].push(opp);
          return acc;
        }, {} as { [accountId: string]: Opportunity[] });

        setOpportunities(groupedOpps);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(term) ||
          account.email.toLowerCase().includes(term) ||
          (account.company && account.company.toLowerCase().includes(term)) ||
          (account.industry && account.industry.toLowerCase().includes(term))
      );
    }

    setFilteredAccounts(filtered);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "prospecting":
        return "bg-gray-100 text-gray-800";
      case "qualification":
        return "bg-blue-100 text-blue-800";
      case "proposal":
        return "bg-purple-100 text-purple-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed_won":
        return "bg-green-100 text-green-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStage = (stage: string) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTotalOpportunityValue = (accountId: string) => {
    const accountOpps = opportunities[accountId] || [];
    return accountOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  };

  const handleAddOpportunity = (account: Account) => {
    setSelectedAccount(account);
    setOpportunityForm({
      name: "",
      amount: "",
      probability: "50",
      expectedCloseDate: "",
      description: "",
      stage: "prospecting",
    });
    setShowOpportunityDialog(true);
  };

  const handleSaveOpportunity = async () => {
    if (!selectedAccount || !user) return;

    setSavingOpportunity(true);
    try {
      const { error } = await supabase.from("opportunities").insert({
        name: opportunityForm.name,
        account_id: selectedAccount.id,
        stage: opportunityForm.stage,
        amount: opportunityForm.amount ? parseFloat(opportunityForm.amount) : null,
        probability: parseInt(opportunityForm.probability),
        expected_close_date: opportunityForm.expectedCloseDate || null,
        description: opportunityForm.description || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Opportunity created successfully!");
      setShowOpportunityDialog(false);
      fetchAccounts(); // Refresh to get new opportunity
    } catch (error) {
      console.error("Error creating opportunity:", error);
      toast.error("Failed to create opportunity");
    } finally {
      setSavingOpportunity(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/crm")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Accounts</h1>
              <p className="text-muted-foreground">
                Manage your accounts and opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts by name, email, company, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Accounts</p>
              </div>
              <p className="text-2xl font-bold mt-2">{accounts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Opportunities</p>
              </div>
              <p className="text-2xl font-bold mt-2">
                {Object.values(opportunities).reduce((sum, opps) => sum + opps.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
              <p className="text-2xl font-bold mt-2">
                ${Object.values(opportunities)
                  .flat()
                  .reduce((sum, opp) => sum + (opp.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading accounts...
            </CardContent>
          </Card>
        ) : filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No accounts found. Convert leads to create accounts.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        {account.name}
                        {account.company && (
                          <span className="text-sm font-normal text-muted-foreground">
                            • {account.company}
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {account.email}
                        </div>
                        {account.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {account.phone}
                          </div>
                        )}
                        {account.industry && (
                          <Badge variant="outline">{account.industry}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddOpportunity(account)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Opportunity
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {opportunities[account.id] && opportunities[account.id].length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Opportunities ({opportunities[account.id].length})
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          Total Value:{" "}
                          <span className="font-semibold text-foreground">
                            ${getTotalOpportunityValue(account.id).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead>Stage</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Probability</TableHead>
                              <TableHead>Close Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {opportunities[account.id].map((opp) => (
                              <TableRow
                                key={opp.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                              >
                                <TableCell className="font-medium">{opp.name}</TableCell>
                                <TableCell>
                                  {opp.departure_airport && opp.arrival_airport ? (
                                    <span className="text-sm">
                                      {opp.departure_airport} → {opp.arrival_airport}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStageColor(opp.stage)}>
                                    {formatStage(opp.stage)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {opp.amount ? (
                                    `$${opp.amount.toLocaleString()}`
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {opp.probability !== null ? (
                                    `${opp.probability}%`
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {opp.expected_close_date ? (
                                    new Date(opp.expected_close_date).toLocaleDateString()
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No opportunities yet. Click "Add Opportunity" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Opportunity Dialog */}
      <Dialog open={showOpportunityDialog} onOpenChange={setShowOpportunityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Opportunity</DialogTitle>
            <DialogDescription>
              Create a new opportunity for {selectedAccount?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oppName">Opportunity Name *</Label>
              <Input
                id="oppName"
                value={opportunityForm.name}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, name: e.target.value })}
                placeholder="e.g., Charter to Miami"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={opportunityForm.stage}
                  onValueChange={(value) => setOpportunityForm({ ...opportunityForm, stage: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="qualification">Qualification</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oppAmount">Amount ($)</Label>
                <Input
                  id="oppAmount"
                  type="number"
                  value={opportunityForm.amount}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, amount: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oppProbability">Probability (%)</Label>
                <Input
                  id="oppProbability"
                  type="number"
                  min="0"
                  max="100"
                  value={opportunityForm.probability}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, probability: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oppCloseDate">Expected Close Date</Label>
                <Input
                  id="oppCloseDate"
                  type="date"
                  value={opportunityForm.expectedCloseDate}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oppDescription">Description</Label>
              <Textarea
                id="oppDescription"
                value={opportunityForm.description}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                placeholder="Additional details about this opportunity..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOpportunityDialog(false)}
              disabled={savingOpportunity}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOpportunity}
              disabled={!opportunityForm.name || savingOpportunity}
            >
              {savingOpportunity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
