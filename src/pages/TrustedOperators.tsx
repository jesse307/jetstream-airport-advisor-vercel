import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Trash2, Plane, MapPin, Search, Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface OperatorAircraft {
  tailNumber: string;
  aircraftType: string;
  homeAirportIcao: string | null;
  homeAirportIata: string | null;
  homeAirportName: string | null;
  countryCode: string | null;
  year: number | null;
  serialNumber: string | null;
}

export default function TrustedOperators() {
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tailNumbers, setTailNumbers] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOperatorSearch, setShowOperatorSearch] = useState(false);
  const [operatorSearchName, setOperatorSearchName] = useState("");
  const [operatorSuggestions, setOperatorSuggestions] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [searchingOperators, setSearchingOperators] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OperatorAircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Set<string>>(new Set());
  const [foundOperator, setFoundOperator] = useState<any>(null);

  const loadOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft_locations')
        .select('*')
        .eq('is_trusted', true)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      console.error("Error loading operators:", error);
      toast.error("Failed to load operators");
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
      const tailNumberArray = tailNumbers
        .split(/[\n,]+/)
        .map(t => t.trim())
        .filter(t => t);

      const { data, error } = await supabase.functions.invoke('update-trusted-operators', {
        body: { tailNumbers: tailNumberArray }
      });

      if (error) throw error;

      if (data) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        const failCount = data.results?.filter((r: any) => !r.success).length || 0;

        if (successCount > 0) {
          toast.success(`Added ${successCount} aircraft${failCount > 0 ? `, ${failCount} failed` : ''}`);
          await loadOperators();
          setTailNumbers("");
          setShowAddForm(false);
        } else {
          toast.error("Failed to add any aircraft");
        }
      }
    } catch (error: any) {
      console.error("Error adding tail numbers:", error);
      toast.error(error.message || "Failed to add aircraft");
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

  useEffect(() => {
    loadOperators();
  }, []);

  const handleOperatorSearchInput = async (value: string) => {
    setOperatorSearchName(value);
    console.log('Search input changed:', value);
    
    if (value.trim().length < 2) {
      setOperatorSuggestions([]);
      return;
    }

    setSearchingOperators(true);
    console.log('Calling edge function for suggestions...');
    try {
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { operatorName: value, searchOnly: true }
      });

      console.log('Edge function response:', data, error);

      if (error) throw error;

      if (data.success && data.operators) {
        console.log('Got operators:', data.operators.length);
        setOperatorSuggestions(data.operators);
        if (!open) setOpen(true); // Auto-open if not already open
      }
    } catch (error: any) {
      console.error("Error fetching operator suggestions:", error);
    } finally {
      setSearchingOperators(false);
    }
  };

  const handleSearchOperator = async () => {
    if (!selectedOperator) {
      toast.error("Please select an operator from the dropdown");
      return;
    }

    setSearching(true);
    setSearchResults([]);
    setSelectedAircraft(new Set());

    try {
      console.log(`Searching for operator: ${selectedOperator.name}`);
      const { data, error } = await supabase.functions.invoke('search-operator-aircraft', {
        body: { operatorName: selectedOperator.name }
      });

      if (error) throw error;

      console.log("Search results:", data);

      if (data.success && data.aircraft && data.aircraft.length > 0) {
        setSearchResults(data.aircraft);
        setFoundOperator(data.operator);
        toast.success(`Found ${data.aircraft.length} aircraft for ${data.operator.name}`);
      } else {
        toast.info(data.message || "No aircraft found for this operator");
        setFoundOperator(null);
      }
    } catch (error: any) {
      console.error("Error searching operator:", error);
      toast.error(error.message || "Failed to search operator");
    } finally {
      setSearching(false);
    }
  };

  const toggleAircraftSelection = (tailNumber: string) => {
    const newSelection = new Set(selectedAircraft);
    if (newSelection.has(tailNumber)) {
      newSelection.delete(tailNumber);
    } else {
      newSelection.add(tailNumber);
    }
    setSelectedAircraft(newSelection);
  };

  const handleAddSelectedAircraft = async () => {
    if (selectedAircraft.size === 0) {
      toast.error("Please select at least one aircraft");
      return;
    }

    setUpdating(true);
    try {
      const tailNumberArray = Array.from(selectedAircraft);

      const { data, error } = await supabase.functions.invoke('update-trusted-operators', {
        body: { tailNumbers: tailNumberArray }
      });

      if (error) throw error;

      if (data) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        toast.success(`Added ${successCount} aircraft`);
        await loadOperators();
        setShowOperatorSearch(false);
        setSearchResults([]);
        setSelectedAircraft(new Set());
        setFoundOperator(null);
        setSelectedOperator(null);
        setOperatorSearchName("");
        setOperatorSuggestions([]);
      }
    } catch (error: any) {
      console.error("Error adding selected aircraft:", error);
      toast.error(error.message || "Failed to add aircraft");
    } finally {
      setUpdating(false);
    }
  };

  const totalAircraft = operators.length;
  const uniqueOperators = new Set(operators.map(op => op.operator_name).filter(Boolean)).size;
  const uniqueCountries = new Set(operators.map(op => op.country_code).filter(Boolean)).size;

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
                  Manage aircraft tail numbers and homebase information
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
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCountries}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => {
            setShowAddForm(true);
            setShowOperatorSearch(false);
          }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tail Numbers
          </Button>
          <Button onClick={() => {
            setShowOperatorSearch(true);
            setShowAddForm(false);
          }} variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Add by Operator
          </Button>
          <Button onClick={handleRefreshAll} variant="outline" disabled={updating} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>

        {/* Operator Search Form */}
        {showOperatorSearch && (
          <Card>
            <CardHeader>
              <CardTitle>Search Operator</CardTitle>
              <CardDescription>
                Search for an operator and select their aircraft to add to your trusted list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedOperator ? selectedOperator.name : "Select operator..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search operators..." 
                        value={operatorSearchName}
                        onValueChange={handleOperatorSearchInput}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchingOperators ? "Searching..." : operatorSearchName.length < 2 ? "Type at least 2 characters to search..." : "No operators found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {operatorSuggestions.map((operator) => (
                            <CommandItem
                              key={operator.company_id}
                              value={operator.name}
                              onSelect={() => {
                                setSelectedOperator(operator);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedOperator?.company_id === operator.company_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{operator.name}</span>
                                {operator.country_name && (
                                  <span className="text-xs text-muted-foreground">{operator.country_name}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button onClick={handleSearchOperator} disabled={searching || !selectedOperator} className="gap-2">
                  <Search className="h-4 w-4" />
                  {searching ? "Searching..." : "Search"}
                </Button>
                <Button onClick={() => {
                  setShowOperatorSearch(false);
                  setSearchResults([]);
                  setSelectedAircraft(new Set());
                  setFoundOperator(null);
                  setSelectedOperator(null);
                  setOperatorSearchName("");
                  setOperatorSuggestions([]);
                }} variant="outline">
                  Cancel
                </Button>
              </div>

              {/* Search Results */}
              {foundOperator && searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{foundOperator.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchResults.length} aircraft found
                      </p>
                    </div>
                    <Button 
                      onClick={handleAddSelectedAircraft}
                      disabled={selectedAircraft.size === 0 || updating}
                    >
                      Add Selected ({selectedAircraft.size})
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Tail Number</TableHead>
                          <TableHead>Aircraft Type</TableHead>
                          <TableHead>Homebase</TableHead>
                          <TableHead>Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((aircraft) => (
                          <TableRow key={aircraft.tailNumber}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAircraft.has(aircraft.tailNumber)}
                                onCheckedChange={() => toggleAircraftSelection(aircraft.tailNumber)}
                              />
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              {aircraft.tailNumber}
                            </TableCell>
                            <TableCell>
                              {aircraft.aircraftType !== 'Unknown' ? (
                                aircraft.aircraftType
                              ) : (
                                <span className="text-muted-foreground italic">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {aircraft.homeAirportIcao ? (
                                <Badge variant="secondary">{aircraft.homeAirportIcao}</Badge>
                              ) : (
                                <span className="text-muted-foreground italic">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {aircraft.year || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                            <span className="text-muted-foreground italic">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {operator.country_code ? (
                            <Badge variant="outline">{operator.country_code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(operator.last_updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(operator.id)}
                            className="text-destructive hover:text-destructive"
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
      </main>
    </div>
  );
}
