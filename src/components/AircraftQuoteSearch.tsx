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
  fleet_type: 'floating' | 'fixed';
  aircraft: Aircraft[];
}

interface AircraftQuoteSearchProps {
  opportunityId: string;
  departureAirport?: string;
  arrivalAirport?: string;
}

interface QuoteRequest {
  operatorId: string;
  operatorName: string;
  operatorEmail: string | null;
  fleetType: 'floating' | 'fixed';
  categories: string[];
  types: string[];
  aircraftLocations?: string[]; // For fixed fleet: home bases of matching aircraft
}

export const AircraftQuoteSearch = ({ opportunityId, departureAirport, arrivalAirport }: AircraftQuoteSearchProps) => {
  const { user } = useAuth();
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<TrustedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(new Set());
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [maxDistance, setMaxDistance] = useState<number>(150);
  const [airportCoords, setAirportCoords] = useState<Map<string, { lat: number; lon: number }>>(new Map());

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get unique categories and types from all aircraft
  const allAircraft = operators.flatMap(op => op.aircraft);
  const categories = Array.from(new Set(allAircraft.map(a => a.aircraft_category).filter(Boolean)));
  const types = Array.from(new Set(allAircraft.map(a => a.aircraft_type).filter(Boolean)));

  useEffect(() => {
    loadAircraft();
  }, [user]);

  useEffect(() => {
    fetchAirportCoordinates();
  }, [operators, departureAirport, arrivalAirport]);

  useEffect(() => {
    applyFilters();
  }, [operators, searchTerm, selectedCategories, selectedTypes]);

  useEffect(() => {
    generateQuoteRequests();
  }, [operators, selectedCategories, selectedTypes, maxDistance, airportCoords]);

  const loadAircraft = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all trusted operators for this user
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('trusted_operators')
        .select('id, name, contact_email, fleet_type')
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

  const fetchAirportCoordinates = async () => {
    // Collect all unique airport codes
    const airportCodes = new Set<string>();

    // Add departure and arrival airports from opportunity
    if (departureAirport) airportCodes.add(departureAirport.toUpperCase());
    if (arrivalAirport) airportCodes.add(arrivalAirport.toUpperCase());

    // Add all aircraft home airports
    operators.forEach(op => {
      op.aircraft.forEach(ac => {
        if (ac.home_airport_icao) airportCodes.add(ac.home_airport_icao.toUpperCase());
        if (ac.home_airport_iata) airportCodes.add(ac.home_airport_iata.toUpperCase());
      });
    });

    // Fetch coordinates for all airports in batch
    const coords = new Map<string, { lat: number; lon: number }>();

    if (airportCodes.size > 0) {
      try {
        const { data, error } = await supabase
          .from('fallback_airports')
          .select('code, latitude, longitude')
          .in('code', Array.from(airportCodes));

        if (!error && data) {
          data.forEach(airport => {
            if (airport.latitude && airport.longitude) {
              coords.set(airport.code.toUpperCase(), {
                lat: Number(airport.latitude),
                lon: Number(airport.longitude)
              });
            }
          });
          console.log('Fetched coordinates for airports:', coords);
        } else if (error) {
          console.error('Error fetching airport coordinates:', error);
        }
      } catch (err) {
        console.error('Error fetching airport coordinates:', err);
      }
    }

    setAirportCoords(coords);
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
      setSelectedRequests(new Set());
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
        // For fixed fleet operators, collect unique home airport locations of matching aircraft
        let aircraftLocations: string[] | undefined;
        if (operator.fleet_type === 'fixed') {
          const matchingAircraft = operator.aircraft.filter(ac => {
            const categoryMatch = matchingCategories.includes(ac.aircraft_category || '');
            const typeMatch = matchingTypes.includes(ac.aircraft_type || '');
            if (!categoryMatch && !typeMatch) return false;

            // Apply distance filter for fixed fleet
            const aircraftCode = (ac.home_airport_icao || ac.home_airport_iata)?.toUpperCase();
            if (!aircraftCode) return false;

            const aircraftCoord = airportCoords.get(aircraftCode);
            if (!aircraftCoord) {
              console.log(`No coordinates found for aircraft at ${aircraftCode}`);
              return false; // Exclude if no coords found
            }

            // Check distance from departure airport
            if (departureAirport) {
              const depCoord = airportCoords.get(departureAirport.toUpperCase());
              if (depCoord) {
                const distFromDep = calculateDistance(
                  aircraftCoord.lat, aircraftCoord.lon,
                  depCoord.lat, depCoord.lon
                );
                console.log(`Distance from ${aircraftCode} to ${departureAirport}: ${distFromDep.toFixed(1)} miles`);
                if (distFromDep <= maxDistance) return true;
              }
            }

            // Check distance from arrival airport
            if (arrivalAirport) {
              const arrCoord = airportCoords.get(arrivalAirport.toUpperCase());
              if (arrCoord) {
                const distFromArr = calculateDistance(
                  aircraftCoord.lat, aircraftCoord.lon,
                  arrCoord.lat, arrCoord.lon
                );
                console.log(`Distance from ${aircraftCode} to ${arrivalAirport}: ${distFromArr.toFixed(1)} miles`);
                if (distFromArr <= maxDistance) return true;
              }
            }

            console.log(`Aircraft at ${aircraftCode} filtered out - beyond ${maxDistance} miles`);
            return false; // Not within distance of either airport
          });

          const locations = new Set(
            matchingAircraft
              .map(ac => ac.home_airport_icao || ac.home_airport_iata)
              .filter(Boolean)
          );
          aircraftLocations = Array.from(locations) as string[];
        }

        // Only add request if there are matching aircraft (for fixed fleet) or if floating fleet
        const hasMatchingAircraft = operator.fleet_type === 'floating' || (aircraftLocations && aircraftLocations.length > 0);
        if (hasMatchingAircraft) {
          requests.push({
            operatorId: operator.id,
            operatorName: operator.name,
            operatorEmail: operator.contact_email,
            fleetType: operator.fleet_type,
            categories: matchingCategories,
            types: matchingTypes,
            aircraftLocations
          });
        }
      }
    });

    setQuoteRequests(requests);

    // Auto-select all new requests by default
    setSelectedRequests(new Set(requests.map(r => r.operatorId)));
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

  const toggleRequestSelection = (operatorId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operatorId)) {
        newSet.delete(operatorId);
      } else {
        newSet.add(operatorId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === quoteRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(quoteRequests.map(r => r.operatorId)));
    }
  };

  const handleSendQuoteRequest = (request: QuoteRequest) => {
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

  const handleSendSelectedQuotes = () => {
    const selectedQuoteList = quoteRequests.filter(req => selectedRequests.has(req.operatorId));

    if (selectedQuoteList.length === 0) {
      toast.error("No quote requests selected");
      return;
    }

    // Send all emails (will open multiple mailto links)
    selectedQuoteList.forEach((request, index) => {
      setTimeout(() => {
        handleSendQuoteRequest(request);
      }, index * 500); // Stagger the emails to avoid browser blocking
    });

    toast.success(`Opening ${selectedQuoteList.length} quote request emails`);
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
          Select aircraft categories or types to request quotes from your trusted operators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Selection Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Aircraft</h3>
              {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedTypes([]);
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Distance Selector */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-2 block">
                Max Distance from Departure/Arrival (Fixed Fleet Only)
              </Label>
              <Select value={maxDistance.toString()} onValueChange={(val) => setMaxDistance(Number(val))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">150 miles</SelectItem>
                  <SelectItem value="200">200 miles</SelectItem>
                  <SelectItem value="250">250 miles</SelectItem>
                  <SelectItem value="300">300 miles</SelectItem>
                  <SelectItem value="350">350 miles</SelectItem>
                  <SelectItem value="400">400 miles</SelectItem>
                  <SelectItem value="450">450 miles</SelectItem>
                  <SelectItem value="500">500 miles</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Floating fleet operators show all aircraft regardless of distance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Categories</Label>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    {categories.map(cat => (
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
                    ))}
                  </div>
                )}
              </div>

              {/* Aircraft Types */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Aircraft Types</Label>
                {types.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No types available</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    {types.map(type => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Quote Requests Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {quoteRequests.length > 0 && (
                  <Checkbox
                    id="select-all"
                    checked={selectedRequests.size === quoteRequests.length && quoteRequests.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">Quote Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    {quoteRequests.length === 0
                      ? "Select categories or aircraft types above to generate requests"
                      : `${selectedRequests.size} of ${quoteRequests.length} selected`}
                  </p>
                </div>
              </div>
              {quoteRequests.length > 0 && selectedRequests.size > 0 && (
                <Button onClick={handleSendSelectedQuotes}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Selected ({selectedRequests.size})
                </Button>
              )}
            </div>

            {quoteRequests.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/10">
                <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">
                  Select aircraft categories or types above to build your quote requests
                </p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {quoteRequests.map((request) => (
                  <div
                    key={request.operatorId}
                    className={`p-4 transition-colors ${
                      selectedRequests.has(request.operatorId)
                        ? 'bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`request-${request.operatorId}`}
                        checked={selectedRequests.has(request.operatorId)}
                        onCheckedChange={() => toggleRequestSelection(request.operatorId)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <h4 className="font-semibold text-sm">{request.operatorName}</h4>
                          <Badge
                            variant={request.fleetType === 'floating' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {request.fleetType === 'floating' ? 'Floating' : 'Fixed'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          {/* Aircraft Locations (for fixed fleet) */}
                          {request.fleetType === 'fixed' && request.aircraftLocations && request.aircraftLocations.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {request.aircraftLocations.join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Categories */}
                          {request.categories.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground text-xs">Categories:</span>
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground text-xs">Types:</span>
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
