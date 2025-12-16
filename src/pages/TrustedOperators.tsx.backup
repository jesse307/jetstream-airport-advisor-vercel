import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trash2, Plane, MapPin, Building2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  floating_fleet: boolean;
}

interface USCarrier {
  company_id: string;
  name: string;
  country_name: string;
  website: string | null;
}

export default function TrustedOperators() {
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [usCarriers, setUSCarriers] = useState<USCarrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCarriers, setShowCarriers] = useState(false);
  const [manualOperatorName, setManualOperatorName] = useState("");
  const [searchingOperator, setSearchingOperator] = useState(false);

  const loadOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft_locations')
        .select('*')
        .eq('is_trusted', true)
        .order('operator_name', { ascending: true });

      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      console.error("Error loading operators:", error);
      toast.error("Failed to load operators");
    } finally {
      setLoading(false);
    }
  };

  const loadUSCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { listUSCarriers: true }
      });

      if (error) throw error;

      if (data.success && data.operators) {
        setUSCarriers(data.operators);
        toast.success(`Loaded ${data.operators.length} US charter operators`);
      }
    } catch (error: any) {
      console.error("Error loading US carriers:", error);
      if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please wait a few minutes and try again.");
      } else {
        toast.error("Failed to load US carriers");
      }
    } finally {
      setLoadingCarriers(false);
    }
  };

  const handleToggleCarrier = (carrierId: string) => {
    const newSelection = new Set(selectedCarriers);
    if (newSelection.has(carrierId)) {
      newSelection.delete(carrierId);
    } else {
      newSelection.add(carrierId);
    }
    setSelectedCarriers(newSelection);
  };

  const handleAddSelectedCarriers = async () => {
    if (selectedCarriers.size === 0) {
      toast.error("Please select at least one carrier");
      return;
    }

    setAdding(true);
    try {
      const selectedCarrierNames = usCarriers
        .filter(c => selectedCarriers.has(c.company_id))
        .map(c => c.name);

      let totalAdded = 0;

      for (const carrierName of selectedCarrierNames) {
        try {
          // Fetch aircraft for this carrier
          const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
            body: { operatorName: carrierName }
          });

          if (error) throw error;

          if (data.success && data.aircraft && data.aircraft.length > 0) {
            // Add all aircraft for this operator
            const tailNumbers = data.aircraft.map((ac: any) => ac.tailNumber);
            
            const { data: updateData, error: updateError } = await supabase.functions.invoke('update-trusted-operators', {
              body: { tailNumbers }
            });

            if (updateError) throw updateError;

            const successCount = updateData.results?.filter((r: any) => r.success).length || 0;
            totalAdded += successCount;
          }
        } catch (err: any) {
          console.error(`Error adding ${carrierName}:`, err);
        }
      }

      if (totalAdded > 0) {
        toast.success(`Added ${totalAdded} aircraft from ${selectedCarriers.size} operators`);
        await loadOperators();
        setSelectedCarriers(new Set());
        setShowCarriers(false);
      } else {
        toast.error("Failed to add any aircraft");
      }
    } catch (error: any) {
      console.error("Error adding carriers:", error);
      toast.error(error.message || "Failed to add carriers");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFloatingFleet = async (operatorId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('aircraft_locations')
        .update({ floating_fleet: !currentValue })
        .eq('id', operatorId);

      if (error) throw error;

      toast.success(`Updated floating fleet status`);
      await loadOperators();
    } catch (error: any) {
      console.error("Error updating floating fleet:", error);
      toast.error("Failed to update floating fleet");
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

      const { data, error } = await supabase.functions.invoke('update-trusted-operators', {
        body: { tailNumbers: tailNumberArray }
      });

      if (error) throw error;

      if (data) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        toast.success(`Refreshed ${successCount} of ${operators.length} aircraft`);
        await loadOperators();
      }
    } catch (error: any) {
      console.error("Error refreshing operators:", error);
      toast.error(error.message || "Failed to refresh");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aircraft_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Aircraft removed");
      await loadOperators();
    } catch (error: any) {
      console.error("Error deleting operator:", error);
      toast.error("Failed to remove aircraft");
    }
  };

  const handleManualSearch = async () => {
    const trimmedName = manualOperatorName.trim();
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
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { operatorName: trimmedName }
      });

      if (error) throw error;

      if (data.success && data.aircraft && data.aircraft.length > 0) {
        const tailNumbers = data.aircraft.map((ac: any) => ac.tailNumber);
        
        const { data: updateData, error: updateError } = await supabase.functions.invoke('update-trusted-operators', {
          body: { tailNumbers }
        });

        if (updateError) throw updateError;

        const successCount = updateData.results?.filter((r: any) => r.success).length || 0;
        
        if (successCount > 0) {
          toast.success(`Added ${successCount} aircraft from ${data.operator.name}`);
          await loadOperators();
          setManualOperatorName("");
        } else {
          toast.error("Failed to add any aircraft");
        }
      } else {
        toast.error(`No aircraft found for operator: ${trimmedName}`);
      }
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

  useEffect(() => {
    loadOperators();
  }, []);

  const totalAircraft = operators.length;
  const uniqueOperators = new Set(operators.map(op => op.operator_name).filter(Boolean)).size;
  const floatingFleets = operators.filter(op => op.floating_fleet).length;

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
                  Manage aircraft operators and their fleets
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAircraft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Operators</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueOperators}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Floating Fleets</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{floatingFleets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Operator Manually</CardTitle>
            <CardDescription>
              Search for a specific operator by name and add all their aircraft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter operator name (e.g., NetJets)"
                value={manualOperatorName}
                onChange={(e) => setManualOperatorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                maxLength={100}
              />
              <Button 
                onClick={handleManualSearch} 
                disabled={searchingOperator}
                className="gap-2"
              >
                {searchingOperator ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search & Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!showCarriers ? (
            <Button 
              onClick={() => {
                setShowCarriers(true);
                if (usCarriers.length === 0) {
                  loadUSCarriers();
                }
              }} 
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Add US Operators
            </Button>
          ) : (
            <Button onClick={() => setShowCarriers(false)} variant="outline" className="gap-2">
              Hide Operators List
            </Button>
          )}
          <Button onClick={handleRefreshAll} variant="outline" disabled={updating} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>

        {/* US Carriers List */}
        {showCarriers && (
          <Card>
            <CardHeader>
              <CardTitle>US Charter Operators</CardTitle>
              <CardDescription>
                Select operators to add all their aircraft to your trusted list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedCarriers.size} of {usCarriers.length} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddSelectedCarriers}
                    disabled={selectedCarriers.size === 0 || adding}
                    className="gap-2"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Add Selected ({selectedCarriers.size})
                  </Button>
                  {loadingCarriers && (
                    <Button disabled variant="outline" className="gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Operator Name</TableHead>
                      <TableHead>Website</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCarriers ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : usCarriers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No US carriers loaded
                        </TableCell>
                      </TableRow>
                    ) : (
                      usCarriers.map((carrier) => (
                        <TableRow key={carrier.company_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCarriers.has(carrier.company_id)}
                              onCheckedChange={() => handleToggleCarrier(carrier.company_id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{carrier.name}</TableCell>
                          <TableCell>
                            {carrier.website ? (
                              <a 
                                href={carrier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                {carrier.website}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Operators Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Trusted Operators</CardTitle>
            <CardDescription>
              Aircraft currently in your trusted operators list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tail Number</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Aircraft Type</TableHead>
                    <TableHead>Homebase</TableHead>
                    <TableHead>Floating Fleet</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : operators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No trusted operators yet. Add some to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    operators.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell className="font-mono">{op.tail_number}</TableCell>
                        <TableCell>
                          {op.operator_name ? (
                            <div className="flex items-center gap-2">
                              <span>{op.operator_name}</span>
                              {op.country_code && (
                                <Badge variant="outline" className="text-xs">
                                  {op.country_code}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>{op.aircraft_type || "-"}</TableCell>
                        <TableCell>
                          {op.home_airport_icao || op.home_airport_iata ? (
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">
                                {op.home_airport_icao || op.home_airport_iata}
                              </span>
                              {op.home_airport_name && (
                                <span className="text-xs text-muted-foreground">
                                  {op.home_airport_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={op.floating_fleet}
                            onCheckedChange={() => handleToggleFloatingFleet(op.id, op.floating_fleet)}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(op.last_updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(op.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
