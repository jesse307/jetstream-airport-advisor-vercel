import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Trash2, Plane, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrustedOperator {
  id: string;
  tail_number: string;
  operator_name: string | null;
  home_airport_icao: string | null;
  home_airport_iata: string | null;
  home_airport_name: string | null;
  aircraft_type: string | null;
  country_code: string | null;
  last_updated: string;
  notes: string | null;
}

export default function TrustedOperators() {
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tailNumbers, setTailNumbers] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("aircraft_locations")
        .select("*")
        .eq("is_trusted", true)
        .order("operator_name", { ascending: true });

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error("Error loading operators:", error);
      toast.error("Failed to load trusted operators");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTailNumbers = async () => {
    if (!tailNumbers.trim()) {
      toast.error("Please enter at least one tail number");
      return;
    }

    setUpdating(true);
    try {
      // Parse tail numbers (comma or newline separated)
      const tailNumberArray = tailNumbers
        .split(/[,\n]/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);

      if (tailNumberArray.length === 0) {
        toast.error("No valid tail numbers found");
        return;
      }

      console.log("Fetching homebase data for:", tailNumberArray);

      // Call edge function to fetch and store homebase data
      const { data, error } = await supabase.functions.invoke("update-trusted-operators", {
        body: { tailNumbers: tailNumberArray }
      });

      if (error) throw error;

      const summary = data.summary;
      if (summary.successful > 0) {
        toast.success(
          `Successfully added ${summary.successful} aircraft. ${summary.failed > 0 ? `${summary.failed} failed.` : ""}`
        );
      } else {
        toast.error(`Failed to add aircraft. Please check the tail numbers.`);
      }

      // Log detailed results
      console.log("Update results:", data.results);

      // Reload the list
      await loadOperators();
      
      // Clear form
      setTailNumbers("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding tail numbers:", error);
      toast.error("Failed to fetch homebase data");
    } finally {
      setUpdating(false);
    }
  };

  const handleRefreshAll = async () => {
    if (operators.length === 0) {
      toast.error("No operators to refresh");
      return;
    }

    setUpdating(true);
    try {
      const tailNumberArray = operators.map(op => op.tail_number);
      
      console.log("Refreshing homebase data for:", tailNumberArray);

      const { data, error } = await supabase.functions.invoke("update-trusted-operators", {
        body: { tailNumbers: tailNumberArray }
      });

      if (error) throw error;

      const summary = data.summary;
      toast.success(
        `Refreshed ${summary.successful} aircraft. ${summary.failed > 0 ? `${summary.failed} failed.` : ""}`
      );

      await loadOperators();
    } catch (error) {
      console.error("Error refreshing:", error);
      toast.error("Failed to refresh homebase data");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, tailNumber: string) => {
    if (!confirm(`Remove ${tailNumber} from trusted operators?`)) return;

    try {
      const { error } = await supabase
        .from("aircraft_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`Removed ${tailNumber}`);
      await loadOperators();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove operator");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trusted Operators</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Operator Database</CardTitle>
              <CardDescription>
                Manage your trusted operators and their aircraft homebases for quick matching with leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Plane className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{operators.length}</p>
                    <p className="text-sm text-muted-foreground">Total Aircraft</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/5 rounded-lg">
                  <MapPin className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold">
                      {operators.filter(op => op.home_airport_icao).length}
                    </p>
                    <p className="text-sm text-muted-foreground">With Homebase</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg">
                  <RefreshCw className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">
                      {operators.filter(op => op.operator_name).length}
                    </p>
                    <p className="text-sm text-muted-foreground">With Operator</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tail Numbers
            </Button>
            <Button 
              onClick={handleRefreshAll} 
              disabled={updating || operators.length === 0}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Tail Numbers</CardTitle>
                <CardDescription>
                  Enter tail numbers (comma or line separated). System will fetch homebase from Aviapages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={tailNumbers}
                  onChange={(e) => setTailNumbers(e.target.value)}
                  placeholder="N12345, N67890&#10;N11111&#10;N22222"
                  rows={6}
                  className="font-mono"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddTailNumbers} disabled={updating}>
                    {updating ? "Fetching..." : "Add & Fetch Homebase"}
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operators Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aircraft List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : operators.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trusted operators yet. Add tail numbers to get started.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tail Number</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Aircraft Type</TableHead>
                        <TableHead>Homebase</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operators.map((operator) => (
                        <TableRow key={operator.id}>
                          <TableCell className="font-mono font-semibold">
                            {operator.tail_number}
                          </TableCell>
                          <TableCell>
                            {operator.operator_name || (
                              <span className="text-muted-foreground italic">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {operator.aircraft_type || (
                              <span className="text-muted-foreground italic">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {operator.home_airport_icao ? (
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {operator.home_airport_icao}
                                  {operator.home_airport_iata && ` (${operator.home_airport_iata})`}
                                </div>
                                {operator.home_airport_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {operator.home_airport_name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">No Homebase</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {operator.country_code || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(operator.last_updated).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDelete(operator.id, operator.tail_number)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
