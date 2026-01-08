import { useState, useEffect } from "react";
import { Search, Plane, Building2, MapPin, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  operator?: {
    id: string;
    name: string;
    contact_email: string | null;
  };
}

interface AircraftQuoteSearchProps {
  opportunityId: string;
}

export const AircraftQuoteSearch = ({ opportunityId }: AircraftQuoteSearchProps) => {
  const { user } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [filteredAircraft, setFilteredAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOperator, setSelectedOperator] = useState<string>("all");

  // Get unique categories and types from aircraft
  const categories = Array.from(new Set(aircraft.map(a => a.aircraft_category).filter(Boolean)));
  const types = Array.from(new Set(aircraft.map(a => a.aircraft_type).filter(Boolean)));
  const operators = Array.from(new Set(aircraft.map(a => a.operator?.name).filter(Boolean)));

  useEffect(() => {
    loadAircraft();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [aircraft, searchTerm, categoryFilter, typeFilter, selectedOperator]);

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
        setAircraft([]);
        return;
      }

      const operatorIds = operatorsData.map(op => op.id);

      // Get all aircraft from these operators
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft_locations')
        .select('*')
        .in('operator_id', operatorIds);

      if (aircraftError) throw aircraftError;

      // Combine aircraft with operator info
      const aircraftWithOperators = (aircraftData || []).map(ac => ({
        ...ac,
        operator: operatorsData.find(op => op.id === ac.operator_id)
      }));

      setAircraft(aircraftWithOperators);
    } catch (error: any) {
      console.error("Error loading aircraft:", error);
      toast.error("Failed to load aircraft");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...aircraft];

    // Search filter (tail number, type, category)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ac =>
        ac.tail_number?.toLowerCase().includes(term) ||
        ac.aircraft_type?.toLowerCase().includes(term) ||
        ac.aircraft_category?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ac => ac.aircraft_category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(ac => ac.aircraft_type === typeFilter);
    }

    // Operator filter
    if (selectedOperator !== "all") {
      filtered = filtered.filter(ac => ac.operator?.name === selectedOperator);
    }

    setFilteredAircraft(filtered);
  };

  const handleContactOperator = (aircraft: Aircraft) => {
    if (!aircraft.operator?.contact_email) {
      toast.error("No contact email available for this operator");
      return;
    }

    const subject = `Quote Request - ${aircraft.tail_number} (${aircraft.aircraft_type || 'Aircraft'})`;
    const body = `Hi,%0D%0A%0D%0AI would like to request a quote for ${aircraft.tail_number}.%0D%0A%0D%0AThanks!`;
    window.location.href = `mailto:${aircraft.operator.contact_email}?subject=${encodeURIComponent(subject)}&body=${body}`;
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat!}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Aircraft Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type!}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="All Operators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {operators.map(op => (
                    <SelectItem key={op} value={op!}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || categoryFilter !== "all" || typeFilter !== "all" || selectedOperator !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setTypeFilter("all");
                setSelectedOperator("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Results */}
        <div className="space-y-3">
          {filteredAircraft.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                {aircraft.length === 0
                  ? "No aircraft available. Add trusted operators first."
                  : "No aircraft match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                Found {filteredAircraft.length} aircraft
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredAircraft.map((ac) => (
                  <div
                    key={ac.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-lg">{ac.tail_number}</p>
                          {ac.aircraft_category && (
                            <Badge variant="secondary">{ac.aircraft_category}</Badge>
                          )}
                        </div>

                        {ac.aircraft_type && (
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                            <Plane className="h-3 w-3" />
                            {ac.aircraft_type}
                          </p>
                        )}

                        {ac.operator && (
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            {ac.operator.name}
                          </p>
                        )}

                        {ac.home_airport_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {ac.home_airport_name} ({ac.home_airport_iata || ac.home_airport_icao})
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleContactOperator(ac)}
                        disabled={!ac.operator?.contact_email}
                      >
                        Request Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
