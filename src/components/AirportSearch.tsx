import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIVATE_AIRPORTS, type Airport } from "@/data/privateAirports";

// Comprehensive airports database including major commercial airports and private airports
const COMMERCIAL_AIRPORTS = [
  // Major Commercial/Public Airports
  // New York Area
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro, NJ", state: "NJ", runway: "7000 ft", fbo: "Atlantic Aviation, Meridian", type: "Public" },
  { code: "KJFK", name: "John F. Kennedy International", city: "New York, NY", state: "NY", runway: "14511 ft", fbo: "Jet Aviation, Ross Aviation", type: "Public" },
  { code: "KLGA", name: "LaGuardia Airport", city: "New York, NY", state: "NY", runway: "7003 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBDR", name: "Igor I. Sikorsky Memorial", city: "Bridgeport, CT", state: "CT", runway: "4761 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains, NY", state: "NY", runway: "6549 ft", fbo: "Million Air", type: "Public" },
  { code: "KCDW", name: "Essex County Airport", city: "Caldwell, NJ", state: "NJ", runway: "4997 ft", fbo: "Meridian", type: "Public" },

  // Los Angeles Area  
  { code: "KVAN", name: "Van Nuys Airport", city: "Van Nuys, CA", state: "CA", runway: "8001 ft", fbo: "Atlantic Aviation, Clay Lacy", type: "Public" },
  { code: "KSMO", name: "Santa Monica Airport", city: "Santa Monica, CA", state: "CA", runway: "4973 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBUR", name: "Hollywood Burbank Airport", city: "Burbank, CA", state: "CA", runway: "6886 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KLAX", name: "Los Angeles International", city: "Los Angeles, CA", state: "CA", runway: "12091 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KSNA", name: "John Wayne Airport", city: "Santa Ana, CA", state: "CA", runway: "5701 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KLGB", name: "Long Beach Airport", city: "Long Beach, CA", state: "CA", runway: "10000 ft", fbo: "Atlantic Aviation", type: "Public" },

  // Florida
  { code: "KMCO", name: "Orlando International Airport", city: "Orlando, FL", state: "FL", runway: "12005 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KORL", name: "Orlando Executive Airport", city: "Orlando, FL", state: "FL", runway: "7003 ft", fbo: "Sheltair, Signature", type: "Public" },
  { code: "KFLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale, FL", state: "FL", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KOPF", name: "Miami-Opa Locka Executive", city: "Opa-locka, FL", state: "FL", runway: "8002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMIA", name: "Miami International Airport", city: "Miami, FL", state: "FL", runway: "13016 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTMB", name: "Miami-Kendall Tamiami Executive", city: "Miami, FL", state: "FL", runway: "3279 ft", fbo: "Banyan Air Service", type: "Public" },
  { code: "KPBI", name: "Palm Beach International", city: "West Palm Beach, FL", state: "FL", runway: "10008 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTPA", name: "Tampa International Airport", city: "Tampa, FL", state: "FL", runway: "11002 ft", fbo: "Signature Flight Support", type: "Public" },

  // Atlanta Area
  { code: "KPDK", name: "DeKalb-Peachtree Airport", city: "Atlanta, GA", state: "GA", runway: "6001 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta, GA", state: "GA", runway: "12390 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFTY", name: "Fulton County Airport", city: "Atlanta, GA", state: "GA", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },

  // Chicago Area
  { code: "KORD", name: "Chicago O'Hare International", city: "Chicago, IL", state: "IL", runway: "13000 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KMDW", name: "Chicago Midway International", city: "Chicago, IL", state: "IL", runway: "6522 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KPWK", name: "Chicago Executive Airport", city: "Wheeling, IL", state: "IL", runway: "5001 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KDPA", name: "DuPage Airport", city: "West Chicago, IL", state: "IL", runway: "7271 ft", fbo: "Signature Flight Support", type: "Public" },

  // Texas
  { code: "KDAL", name: "Dallas Love Field", city: "Dallas, TX", state: "TX", runway: "8800 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KDFW", name: "Dallas/Fort Worth International", city: "Dallas, TX", state: "TX", runway: "13401 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KADS", name: "Addison Airport", city: "Addison, TX", state: "TX", runway: "7202 ft", fbo: "Atlantic Aviation, Million Air", type: "Public" },
  { code: "KIAH", name: "Houston Intercontinental", city: "Houston, TX", state: "TX", runway: "12001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KAUS", name: "Austin-Bergstrom International", city: "Austin, TX", state: "TX", runway: "12250 ft", fbo: "Signature Flight Support", type: "Public" },

  // Major Hubs
  { code: "KDEN", name: "Denver International Airport", city: "Denver, CO", state: "CO", runway: "16000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSFO", name: "San Francisco International", city: "San Francisco, CA", state: "CA", runway: "11870 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLAS", name: "Las Vegas McCarran International", city: "Las Vegas, NV", state: "NV", runway: "14511 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPHX", name: "Phoenix Sky Harbor International", city: "Phoenix, AZ", state: "AZ", runway: "11489 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBOS", name: "Boston Logan International", city: "Boston, MA", state: "MA", runway: "10083 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBWI", name: "Baltimore/Washington International", city: "Baltimore, MD", state: "MD", runway: "10502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDCA", name: "Ronald Reagan Washington National", city: "Washington, DC", state: "DC", runway: "7169 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KIAD", name: "Washington Dulles International", city: "Washington, DC", state: "DC", runway: "11500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSEA", name: "Seattle-Tacoma International", city: "Seattle, WA", state: "WA", runway: "11901 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPDX", name: "Portland International", city: "Portland, OR", state: "OR", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMSP", name: "Minneapolis-St. Paul International", city: "Minneapolis, MN", state: "MN", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCLT", name: "Charlotte Douglas International", city: "Charlotte, NC", state: "NC", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSTL", name: "St. Louis Lambert International", city: "St. Louis, MO", state: "MO", runway: "11019 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCVG", name: "Cincinnati/Northern Kentucky International", city: "Cincinnati, OH", state: "OH", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCLE", name: "Cleveland Hopkins International", city: "Cleveland, OH", state: "OH", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPIT", name: "Pittsburgh International", city: "Pittsburgh, PA", state: "PA", runway: "11500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPHL", name: "Philadelphia International", city: "Philadelphia, PA", state: "PA", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBHB", name: "Bar Harbor Airport", city: "Bar Harbor, ME", state: "ME", runway: "5200 ft", fbo: "Bar Harbor Aviation", type: "Public" },
  { code: "KHOU", name: "William P. Hobby Airport", city: "Houston, TX", state: "TX", runway: "7602 ft", fbo: "Atlantic Aviation, Signature", type: "Public" }
];

// Combine commercial airports with private airports
const AIRPORTS = [...COMMERCIAL_AIRPORTS, ...PRIVATE_AIRPORTS];

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