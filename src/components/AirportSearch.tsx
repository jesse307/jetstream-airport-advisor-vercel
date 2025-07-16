import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIVATE_AIRPORTS, type Airport } from "@/data/privateAirports";

// Use comprehensive private airports database
const AIRPORTS = PRIVATE_AIRPORTS;

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  label?: string;
}

export function AirportSearch({ value, onChange, placeholder = "Search airports (ICAO/IATA)", label }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredAirports = AIRPORTS.filter(airport =>
    airport.code.toLowerCase().includes(query.toLowerCase()) ||
    airport.name.toLowerCase().includes(query.toLowerCase()) ||
    airport.city.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery(airport.code);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(newQuery.length > 0);
    
    if (newQuery === "") {
      onChange(null);
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={placeholder}
          className="pl-10 bg-card shadow-card-custom"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              onChange(null);
              setQuery("");
              setIsOpen(false);
            }}
          >
            ×
          </Button>
        )}
      </div>

      {isOpen && filteredAirports.length > 0 && (
        <Card className="absolute top-full z-50 mt-2 w-full shadow-aviation">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {filteredAirports.map((airport) => (
                <div
                  key={airport.code}
                  className="flex cursor-pointer items-center gap-3 border-b border-border p-4 hover:bg-secondary transition-colors"
                  onClick={() => handleSelect(airport)}
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{airport.code}</span>
                      <Badge 
                        variant={airport.type === "Public" ? "secondary" : airport.type === "Private" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {airport.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm font-medium">{airport.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{airport.city}</div>
                    <div className="text-xs text-accent">
                      Runway: {airport.runway} • FBO: {airport.fbo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}