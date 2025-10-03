import { useState, useEffect } from "react";
import { Plane, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AircraftSuggestionsProps {
  distance: number;
  passengers: number;
  departure: string;
  arrival: string;
  departureDate?: string;
  returnDate?: string;
}

interface AircraftSuggestion {
  aircraft: string;
  category: string;
  reason: string;
}

export function AircraftSuggestions({
  distance,
  passengers,
  departure,
  arrival,
  departureDate,
  returnDate
}: AircraftSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AircraftSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-aircraft', {
        body: {
          distance,
          passengers,
          departure,
          arrival,
          departureDate,
          returnDate
        }
      });

      if (error) throw error;

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        toast.error("Failed to get aircraft suggestions");
      }
    } catch (error: any) {
      console.error('Error fetching aircraft suggestions:', error);
      toast.error(error.message || "Failed to get aircraft suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (distance && passengers) {
      fetchSuggestions();
    }
  }, [distance, passengers, departure, arrival]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">AI-Powered Aircraft Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            {distance} nm • {passengers} passenger{passengers !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={fetchSuggestions}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting suggestions...
            </>
          ) : (
            'Refresh Suggestions'
          )}
        </Button>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing route and finding best aircraft options...
            </p>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg">{suggestion.aircraft}</h4>
                  </div>
                  <Badge variant="secondary">{suggestion.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {suggestion.reason}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No aircraft suggestions available</p>
        </div>
      )}
    </div>
  );
}
