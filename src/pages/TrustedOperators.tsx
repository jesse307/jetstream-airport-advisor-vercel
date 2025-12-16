import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trash2, Plane, Building2, Loader2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Aircraft {
  id: string;
  tail_number: string;
  aircraft_type: string | null;
  home_airport_icao: string | null;
  home_airport_iata: string | null;
  home_airport_name: string | null;
  last_updated: string;
  floating_fleet: boolean;
}

interface TrustedOperator {
  id: string;
  company_id: string;
  name: string;
  country_name: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  aircraft: Aircraft[];
}

export default function TrustedOperators() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchingOperator, setSearchingOperator] = useState(false);
  const [refreshingOperator, setRefreshingOperator] = useState<string | null>(null);

  const loadOperators = async () => {
    try {
      // Fetch all trusted operators for this user
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('trusted_operators')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (operatorsError) throw operatorsError;

      // For each operator, fetch their aircraft
      const operatorsWithAircraft = await Promise.all(
        (operatorsData || []).map(async (operator) => {
          const { data: aircraftData, error: aircraftError } = await supabase
            .from('aircraft_locations')
            .select('*')
            .eq('operator_id', operator.id)
            .order('tail_number', { ascending: true });

          if (aircraftError) {
            console.error(`Error loading aircraft for ${operator.name}:`, aircraftError);
            return { ...operator, aircraft: [] };
          }

          return { ...operator, aircraft: aircraftData || [] };
        })
      );

      setOperators(operatorsWithAircraft);
    } catch (error: any) {
      console.error("Error loading operators:", error);
      toast.error("Failed to load operators");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAndAdd = async () => {
    const trimmedName = searchTerm.trim();
    if (!trimmedName) {
      toast.error("Please enter an operator name");
      return;
    }

    if (trimmedName.length > 100) {
      toast.error("Operator name too long (max 100 characters)");
      return;
    }

    setSearchingOperator(true);
    try {
      // Search for the operator in Aviapages
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { operatorName: trimmedName }
      });

      if (error) throw error;

      if (!data.success || !data.operator) {
        toast.error(`No operator found with name: ${trimmedName}`);
        return;
      }

      // Check if operator already exists
      const { data: existing } = await supabase
        .from('trusted_operators')
        .select('id')
        .eq('company_id', data.operator.id)
        .eq('user_id', user?.id)
        .single();

      if (existing) {
        toast.error(`${data.operator.name} is already in your trusted operators list`);
        return;
      }

      // Create the trusted operator
      const { data: newOperator, error: operatorError } = await supabase
        .from('trusted_operators')
        .insert({
          company_id: data.operator.id,
          name: data.operator.name,
          country_name: data.operator.country,
          website: data.operator.website,
          user_id: user?.id
        })
        .select()
        .single();

      if (operatorError) throw operatorError;

      // Add all aircraft for this operator
      if (data.aircraft && data.aircraft.length > 0) {
        const aircraftToInsert = data.aircraft.map((ac: any) => ({
          tail_number: ac.tailNumber,
          aircraft_type: ac.aircraftType,
          home_airport_icao: ac.homeAirportIcao,
          home_airport_iata: ac.homeAirportIata,
          home_airport_name: ac.homeAirportName,
          country_code: ac.countryCode,
          operator_name: data.operator.name,
          operator_id: newOperator.id,
          is_trusted: true,
          floating_fleet: false
        }));

        const { error: aircraftError } = await supabase
          .from('aircraft_locations')
          .insert(aircraftToInsert);

        if (aircraftError) {
          console.error("Error adding aircraft:", aircraftError);
          toast.error("Operator added but some aircraft failed to import");
        } else {
          toast.success(`Added ${data.operator.name} with ${data.aircraft.length} aircraft`);
        }
      } else {
        toast.success(`Added ${data.operator.name} (no aircraft found)`);
      }

      setSearchTerm("");
      await loadOperators();
    } catch (error: any) {
      console.error("Error searching operator:", error);
      if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please wait a few minutes and try again.");
      } else {
        toast.error(error.message || "Failed to search operator");
      }
    } finally {
      setSearchingOperator(false);
    }
  };

  const handleRefreshOperator = async (operator: TrustedOperator) => {
    setRefreshingOperator(operator.id);
    try {
      // Fetch updated aircraft list from Aviapages
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { operatorName: operator.name }
      });

      if (error) throw error;

      if (data.success && data.aircraft) {
        // Delete existing aircraft for this operator
        await supabase
          .from('aircraft_locations')
          .delete()
          .eq('operator_id', operator.id);

        // Add updated aircraft
        const aircraftToInsert = data.aircraft.map((ac: any) => ({
          tail_number: ac.tailNumber,
          aircraft_type: ac.aircraftType,
          home_airport_icao: ac.homeAirportIcao,
          home_airport_iata: ac.homeAirportIata,
          home_airport_name: ac.homeAirportName,
          country_code: ac.countryCode,
          operator_name: operator.name,
          operator_id: operator.id,
          is_trusted: true,
          floating_fleet: false
        }));

        if (aircraftToInsert.length > 0) {
          await supabase
            .from('aircraft_locations')
            .insert(aircraftToInsert);
        }

        // Update the operator's updated_at timestamp
        await supabase
          .from('trusted_operators')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', operator.id);

        toast.success(`Refreshed ${operator.name} - ${aircraftToInsert.length} aircraft`);
        await loadOperators();
      }
    } catch (error: any) {
      console.error("Error refreshing operator:", error);
      toast.error(error.message || "Failed to refresh operator");
    } finally {
      setRefreshingOperator(null);
    }
  };

  const handleDeleteOperator = async (operatorId: string, operatorName: string) => {
    if (!confirm(`Are you sure you want to remove ${operatorName} and all their aircraft?`)) {
      return;
    }

    try {
      // Delete all aircraft for this operator first
      await supabase
        .from('aircraft_locations')
        .delete()
        .eq('operator_id', operatorId);

      // Delete the operator
      const { error } = await supabase
        .from('trusted_operators')
        .delete()
        .eq('id', operatorId);

      if (error) throw error;

      toast.success(`Removed ${operatorName}`);
      await loadOperators();
    } catch (error: any) {
      console.error("Error deleting operator:", error);
      toast.error("Failed to remove operator");
    }
  };

  const handleUpdateNotes = async (operatorId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('trusted_operators')
        .update({ notes })
        .eq('id', operatorId);

      if (error) throw error;
      toast.success("Notes updated");
    } catch (error: any) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const toggleOperator = (operatorId: string) => {
    const newExpanded = new Set(expandedOperators);
    if (newExpanded.has(operatorId)) {
      newExpanded.delete(operatorId);
    } else {
      newExpanded.add(operatorId);
    }
    setExpandedOperators(newExpanded);
  };

  useEffect(() => {
    loadOperators();
  }, []);

  const totalAircraft = operators.reduce((sum, op) => sum + op.aircraft.length, 0);
  const totalOperators = operators.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Trusted Operators</h1>
                <p className="text-sm text-muted-foreground">
                  Manage charter operators and their aircraft fleets
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trusted Operators</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperators}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAircraft}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Operator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Operator</CardTitle>
            <CardDescription>
              Search for a charter operator by name and add them to your trusted list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter operator name (e.g., NetJets, Flexjet)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAndAdd()}
                maxLength={100}
              />
              <Button
                onClick={handleSearchAndAdd}
                disabled={searchingOperator}
                className="gap-2"
              >
                {searchingOperator ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Operator
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operators List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Trusted Operators</CardTitle>
            <CardDescription>
              Click on an operator to view their aircraft fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trusted operators yet. Add one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {operators.map((operator) => (
                  <Collapsible
                    key={operator.id}
                    open={expandedOperators.has(operator.id)}
                    onOpenChange={() => toggleOperator(operator.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedOperators.has(operator.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{operator.name}</CardTitle>
                                  {operator.country_name && (
                                    <Badge variant="outline">{operator.country_name}</Badge>
                                  )}
                                </div>
                                <CardDescription>
                                  {operator.aircraft.length} aircraft
                                  {operator.website && (
                                    <>
                                      {" • "}
                                      <a
                                        href={operator.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {operator.website}
                                      </a>
                                    </>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshOperator(operator)}
                                disabled={refreshingOperator === operator.id}
                                title="Refresh aircraft list"
                              >
                                <RefreshCw className={`h-4 w-4 ${refreshingOperator === operator.id ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOperator(operator.id, operator.name)}
                                title="Remove operator"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-4">
                          {/* Notes Section */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes</label>
                            <Textarea
                              placeholder="Add notes about this operator..."
                              defaultValue={operator.notes || ""}
                              onBlur={(e) => handleUpdateNotes(operator.id, e.target.value)}
                              rows={2}
                            />
                          </div>

                          {/* Aircraft Table */}
                          {operator.aircraft.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No aircraft found for this operator
                            </div>
                          ) : (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tail Number</TableHead>
                                    <TableHead>Aircraft Type</TableHead>
                                    <TableHead>Home Base</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {operator.aircraft.map((aircraft) => (
                                    <TableRow key={aircraft.id}>
                                      <TableCell className="font-mono font-medium">
                                        {aircraft.tail_number}
                                      </TableCell>
                                      <TableCell>{aircraft.aircraft_type || "-"}</TableCell>
                                      <TableCell>
                                        {aircraft.home_airport_icao || aircraft.home_airport_iata ? (
                                          <div className="flex flex-col">
                                            <span className="font-mono text-sm">
                                              {aircraft.home_airport_icao || aircraft.home_airport_iata}
                                            </span>
                                            {aircraft.home_airport_name && (
                                              <span className="text-xs text-muted-foreground">
                                                {aircraft.home_airport_name}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {new Date(aircraft.last_updated).toLocaleDateString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
