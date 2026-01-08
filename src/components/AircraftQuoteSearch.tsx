import { useState, useEffect } from "react";
import { Search, Plane, Building2, MapPin, Filter, X, ChevronDown, ChevronRight, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Aircraft {
  id: string;
  tail_number: string;
  aircraft_type: string | null;
  aircraft_category: string | null;
  home_airport_icao: string | null;
  home_airport_iata: string | null;
  home_airport_name: string | null;
  operator_id: string;
}

interface TrustedOperator {
  id: string;
  name: string;
  contact_email: string | null;
  aircraft: Aircraft[];
}

interface AircraftQuoteSearchProps {
  opportunityId: string;
}

export const AircraftQuoteSearch = ({ opportunityId }: AircraftQuoteSearchProps) => {
  const { user } = useAuth();
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(new Set());

  // Get unique categories and types from all aircraft
  const allAircraft = operators.flatMap(op => op.aircraft);
  const categories = Array.from(new Set(allAircraft.map(a => a.aircraft_category).filter(Boolean)));
  const types = Array.from(new Set(allAircraft.map(a => a.aircraft_type).filter(Boolean)));

  useEffect(() => {
    loadAircraft();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [operators, searchTerm, selectedCategories, selectedTypes]);

  const loadAircraft = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all trusted operators for this user
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('trusted_operators')
        .select('id, name, contact_email')
        .eq('user_id', user.id);

      if (operatorsError) throw operatorsError;

      if (!operatorsData || operatorsData.length === 0) {
        setOperators([]);
        return;
      }

      // Get all aircraft for each operator
      const operatorsWithAircraft = await Promise.all(
        operatorsData.map(async (op) => {
          const { data: aircraftData, error: aircraftError } = await supabase
            .from('aircraft_locations')
            .select('*')
            .eq('operator_id', op.id)
            .order('tail_number', { ascending: true });

          if (aircraftError) {
            console.error(`Error loading aircraft for ${op.name}:`, aircraftError);
            return { ...op, aircraft: [] };
          }

          return { ...op, aircraft: aircraftData || [] };
        })
      );

      setOperators(operatorsWithAircraft);
    } catch (error: any) {
      console.error("Error loading aircraft:", error);
      toast.error("Failed to load aircraft");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = operators.map(op => {
      let aircraftList = [...op.aircraft];

      // Search filter (operator name, tail number, type, category)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const operatorMatches = op.name.toLowerCase().includes(term);

        if (!operatorMatches) {
          aircraftList = aircraftList.filter(ac =>
            ac.tail_number?.toLowerCase().includes(term) ||
            ac.aircraft_type?.toLowerCase().includes(term) ||
            ac.aircraft_category?.toLowerCase().includes(term)
          );
        }
      }

      // Category filter (multiple selection)
      if (selectedCategories.length > 0) {
        aircraftList = aircraftList.filter(ac =>
          ac.aircraft_category && selectedCategories.includes(ac.aircraft_category)
        );
      }

      // Type filter (multiple selection)
      if (selectedTypes.length > 0) {
        aircraftList = aircraftList.filter(ac =>
          ac.aircraft_type && selectedTypes.includes(ac.aircraft_type)
        );
      }

      return { ...op, aircraft: aircraftList };
    }).filter(op => op.aircraft.length > 0);

    setFilteredOperators(filtered);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleOperator = (operatorId: string) => {
    setExpandedOperators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operatorId)) {
        newSet.delete(operatorId);
      } else {
        newSet.add(operatorId);
      }
      return newSet;
    });
  };

  const handleQuoteOperatorCategory = (operator: TrustedOperator, category: string) => {
    if (!operator.contact_email) {
      toast.error("No contact email available for this operator");
      return;
    }

    const subject = `Quote Request - Any ${category}`;
    const body = `Hi,%0D%0A%0D%0AI would like to request a quote for any available ${category} from ${operator.name}.%0D%0A%0D%0AThanks!`;
    window.location.href = `mailto:${operator.contact_email}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const handleQuoteSpecificAircraft = (operator: TrustedOperator, aircraft: Aircraft) => {
    if (!operator.contact_email) {
      toast.error("No contact email available for this operator");
      return;
    }

    const subject = `Quote Request - ${aircraft.tail_number} (${aircraft.aircraft_type || 'Aircraft'})`;
    const body = `Hi,%0D%0A%0D%0AI would like to request a quote for ${aircraft.tail_number}.%0D%0A%0D%0AThanks!`;
    window.location.href = `mailto:${operator.contact_email}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Search Aircraft to Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading aircraft...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Search Aircraft to Quote
        </CardTitle>
        <CardDescription>
          Search available aircraft from your trusted operators
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tail number or aircraft type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Active Filters Display */}
          {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  {cat}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleCategory(cat)}
                  />
                </Badge>
              ))}
              {selectedTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleType(type)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Category</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedCategories.length === 0
                      ? "All Categories"
                      : `${selectedCategories.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm mb-3">Select Categories</div>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No categories available</p>
                    ) : (
                      categories.map(cat => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat}`}
                            checked={selectedCategories.includes(cat!)}
                            onCheckedChange={() => toggleCategory(cat!)}
                          />
                          <label
                            htmlFor={`cat-${cat}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {cat}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Aircraft Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedTypes.length === 0
                      ? "All Types"
                      : `${selectedTypes.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 max-h-[300px] overflow-y-auto" align="start">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm mb-3">Select Aircraft Types</div>
                    {types.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No types available</p>
                    ) : (
                      types.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedTypes.includes(type!)}
                            onCheckedChange={() => toggleType(type!)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {type}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedCategories.length > 0 || selectedTypes.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategories([]);
                setSelectedTypes([]);
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Results - Operators with Aircraft */}
        <div className="space-y-3">
          {filteredOperators.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                {operators.length === 0
                  ? "No aircraft available. Add trusted operators first."
                  : "No operators match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                Found {filteredOperators.length} operator{filteredOperators.length !== 1 ? 's' : ''} with {filteredOperators.reduce((sum, op) => sum + op.aircraft.length, 0)} aircraft
              </div>
              <div className="max-h-[500px] overflow-y-auto space-y-3">
                {filteredOperators.map((operator) => {
                  const isExpanded = expandedOperators.has(operator.id);
                  const categoriesInFleet = Array.from(new Set(operator.aircraft.map(ac => ac.aircraft_category).filter(Boolean)));

                  return (
                    <div
                      key={operator.id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      {/* Operator Header */}
                      <div className="bg-accent/30 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg">{operator.name}</h3>
                              <Badge variant="outline">{operator.aircraft.length} aircraft</Badge>
                            </div>

                            {/* Categories available from this operator */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {categoriesInFleet.map(category => (
                                <Button
                                  key={category}
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleQuoteOperatorCategory(operator, category!)}
                                  disabled={!operator.contact_email}
                                  className="h-7 text-xs"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Request any {category}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOperator(operator.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Aircraft List (Collapsible) */}
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="p-4 space-y-2">
                            {operator.aircraft.map((aircraft) => (
                              <div
                                key={aircraft.id}
                                className="flex items-start justify-between p-3 bg-accent/10 rounded-md hover:bg-accent/20 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold">{aircraft.tail_number}</p>
                                    {aircraft.aircraft_category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {aircraft.aircraft_category}
                                      </Badge>
                                    )}
                                  </div>

                                  {aircraft.aircraft_type && (
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                      <Plane className="h-3 w-3" />
                                      {aircraft.aircraft_type}
                                    </p>
                                  )}

                                  {aircraft.home_airport_name && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {aircraft.home_airport_name} ({aircraft.home_airport_iata || aircraft.home_airport_icao})
                                    </p>
                                  )}
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleQuoteSpecificAircraft(operator, aircraft)}
                                  disabled={!operator.contact_email}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Quote
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
