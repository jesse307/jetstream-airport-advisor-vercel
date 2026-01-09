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

interface QuoteRequest {
  operatorId: string;
  operatorName: string;
  operatorEmail: string | null;
  categories: string[];
  types: string[];
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
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);

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

  useEffect(() => {
    generateQuoteRequests();
  }, [operators, selectedCategories, selectedTypes]);

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

      return { ...op, aircraft: aircraftList };
    }).filter(op => op.aircraft.length > 0);

    setFilteredOperators(filtered);
  };

  const generateQuoteRequests = () => {
    if (selectedCategories.length === 0 && selectedTypes.length === 0) {
      setQuoteRequests([]);
      return;
    }

    const requests: QuoteRequest[] = [];

    operators.forEach(operator => {
      const operatorCategories = new Set(operator.aircraft.map(ac => ac.aircraft_category).filter(Boolean));
      const operatorTypes = new Set(operator.aircraft.map(ac => ac.aircraft_type).filter(Boolean));

      // Find matching categories
      const matchingCategories = selectedCategories.filter(cat => operatorCategories.has(cat));

      // Find matching types
      const matchingTypes = selectedTypes.filter(type => operatorTypes.has(type));

      // Only add request if operator has matching aircraft
      if (matchingCategories.length > 0 || matchingTypes.length > 0) {
        requests.push({
          operatorId: operator.id,
          operatorName: operator.name,
          operatorEmail: operator.contact_email,
          categories: matchingCategories,
          types: matchingTypes
        });
      }
    });

    setQuoteRequests(requests);
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

  const handleSendQuoteRequest = (request: QuoteRequest) => {
    if (!request.operatorEmail) {
      toast.error("No contact email available for this operator");
      return;
    }

    const items: string[] = [];
    if (request.categories.length > 0) {
      items.push(...request.categories);
    }
    if (request.types.length > 0) {
      items.push(...request.types);
    }

    const itemsText = items.join(', ');
    const subject = `Quote Request - ${itemsText}`;
    const body = `Hi,%0D%0A%0D%0AI would like to request a quote for the following aircraft from ${request.operatorName}:%0D%0A%0D%0A${items.map(item => `- ${item}`).join('%0D%0A')}%0D%0A%0D%0AThanks!`;
    window.location.href = `mailto:${request.operatorEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const handleSendAllQuotes = () => {
    const validRequests = quoteRequests.filter(req => req.operatorEmail);

    if (validRequests.length === 0) {
      toast.error("No valid quote requests with email addresses");
      return;
    }

    // Send all emails (will open multiple mailto links)
    validRequests.forEach((request, index) => {
      setTimeout(() => {
        handleSendQuoteRequest(request);
      }, index * 500); // Stagger the emails to avoid browser blocking
    });

    toast.success(`Opening ${validRequests.length} quote request emails`);
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
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-4">
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

            {/* Operator List - For Reference */}
            <div className="mt-4">
              <Label className="text-sm font-semibold mb-2 block">Available Operators</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                {filteredOperators.length === 0 ? (
                  <p>No operators match your criteria</p>
                ) : (
                  filteredOperators.map(op => (
                    <div key={op.id} className="flex items-center justify-between py-1 border-b border-border/50">
                      <span>{op.name}</span>
                      <Badge variant="outline" className="text-xs">{op.aircraft.length}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quote Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Quote Requests ({quoteRequests.length})</Label>
              {quoteRequests.length > 0 && (
                <Button onClick={handleSendAllQuotes} size="sm">
                  <Send className="h-3 w-3 mr-1" />
                  Send All ({quoteRequests.length})
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {quoteRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    Select categories or aircraft types to build your quote requests
                  </p>
                </div>
              ) : (
                quoteRequests.map((request) => (
                  <div
                    key={request.operatorId}
                    className="border border-border rounded-lg p-4 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{request.operatorName}</h4>
                        </div>

                        {/* Categories */}
                        {request.categories.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Categories:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.categories.map(cat => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Types */}
                        {request.types.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Aircraft Types:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.types.map(type => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleSendQuoteRequest(request)}
                        disabled={!request.operatorEmail}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    </div>

                    {!request.operatorEmail && (
                      <p className="text-xs text-destructive">No email available</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
