import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Sample airport data - in a real app this would come from a comprehensive aviation API
const AIRPORTS = [
  // New York Area
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro, NJ", runway: "7000 ft", fbo: "Atlantic Aviation, Meridian", type: "Public" },
  { code: "KJFK", name: "John F. Kennedy International", city: "New York, NY", runway: "14511 ft", fbo: "Jet Aviation, Ross Aviation", type: "Public" },
  { code: "KLGA", name: "LaGuardia Airport", city: "New York, NY", runway: "7003 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBDR", name: "Igor I. Sikorsky Memorial", city: "Bridgeport, CT", runway: "4761 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains, NY", runway: "6549 ft", fbo: "Million Air", type: "Public" },
  { code: "KCDW", name: "Essex County Airport", city: "Caldwell, NJ", runway: "4997 ft", fbo: "Meridian", type: "Public" },
  
  // Los Angeles Area
  { code: "KVAN", name: "Van Nuys Airport", city: "Van Nuys, CA", runway: "8001 ft", fbo: "Atlantic Aviation, Clay Lacy", type: "Public" },
  { code: "KSMO", name: "Santa Monica Airport", city: "Santa Monica, CA", runway: "4973 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBUR", name: "Hollywood Burbank Airport", city: "Burbank, CA", runway: "6886 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KLAX", name: "Los Angeles International", city: "Los Angeles, CA", runway: "12091 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KSNA", name: "John Wayne Airport", city: "Santa Ana, CA", runway: "5701 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KLGB", name: "Long Beach Airport", city: "Long Beach, CA", runway: "10000 ft", fbo: "Atlantic Aviation", type: "Public" },
  
  // Florida
  { code: "KMCO", name: "Orlando International Airport", city: "Orlando, FL", runway: "12005 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KORL", name: "Orlando Executive Airport", city: "Orlando, FL", runway: "7003 ft", fbo: "Sheltair, Signature", type: "Public" },
  { code: "KFLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale, FL", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KOPF", name: "Miami-Opa Locka Executive", city: "Opa-locka, FL", runway: "8002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMIA", name: "Miami International Airport", city: "Miami, FL", runway: "13016 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTMB", name: "Miami-Kendall Tamiami Executive", city: "Miami, FL", runway: "3279 ft", fbo: "Banyan Air Service", type: "Public" },
  { code: "KPBI", name: "Palm Beach International", city: "West Palm Beach, FL", runway: "10008 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTPA", name: "Tampa International Airport", city: "Tampa, FL", runway: "11002 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Atlanta Area
  { code: "KPDK", name: "DeKalb-Peachtree Airport", city: "Atlanta, GA", runway: "6001 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta, GA", runway: "12390 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFTY", name: "Fulton County Airport", city: "Atlanta, GA", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },
  
  // Chicago Area
  { code: "KORD", name: "Chicago O'Hare International", city: "Chicago, IL", runway: "13000 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KMDW", name: "Chicago Midway International", city: "Chicago, IL", runway: "6522 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KPWK", name: "Chicago Executive Airport", city: "Wheeling, IL", runway: "5001 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KDPA", name: "DuPage Airport", city: "West Chicago, IL", runway: "7271 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Texas
  { code: "KDAL", name: "Dallas Love Field", city: "Dallas, TX", runway: "8800 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KDFW", name: "Dallas/Fort Worth International", city: "Dallas, TX", runway: "13401 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KADS", name: "Addison Airport", city: "Addison, TX", runway: "7203 ft", fbo: "Atlantic Aviation, Million Air", type: "Public" },
  { code: "KIAH", name: "George Bush Intercontinental", city: "Houston, TX", runway: "12001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KHOU", name: "William P. Hobby Airport", city: "Houston, TX", runway: "7602 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KAUS", name: "Austin-Bergstrom International", city: "Austin, TX", runway: "12250 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Las Vegas
  { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas, NV", runway: "14511 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KVGT", name: "North Las Vegas Airport", city: "Las Vegas, NV", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KHND", name: "Henderson Executive Airport", city: "Henderson, NV", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },
  
  // San Francisco Bay Area
  { code: "KSFO", name: "San Francisco International", city: "San Francisco, CA", runway: "11870 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSJC", name: "Norman Y. Mineta San Jose International", city: "San Jose, CA", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPAO", name: "Palo Alto Airport", city: "Palo Alto, CA", runway: "2443 ft", fbo: "Pacific Air Center", type: "Public" },
  { code: "KHWD", name: "Hayward Executive Airport", city: "Hayward, CA", runway: "5001 ft", fbo: "Castle & Cooke Aviation", type: "Public" },
  
  // Washington DC Area
  { code: "KDCA", name: "Ronald Reagan Washington National", city: "Arlington, VA", runway: "6869 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KIAD", name: "Washington Dulles International", city: "Dulles, VA", runway: "11500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGAI", name: "Montgomery County Airpark", city: "Gaithersburg, MD", runway: "4200 ft", fbo: "Rectrix Aviation", type: "Public" },
  
  // Boston Area
  { code: "KBOS", name: "Logan International Airport", city: "Boston, MA", runway: "10083 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBED", name: "Laurence G. Hanscom Field", city: "Bedford, MA", runway: "7011 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Phoenix/Scottsdale
  { code: "KPHX", name: "Phoenix Sky Harbor International", city: "Phoenix, AZ", runway: "11489 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSDL", name: "Scottsdale Airport", city: "Scottsdale, AZ", runway: "8249 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KFFZ", name: "Falcon Field", city: "Mesa, AZ", runway: "5101 ft", fbo: "Cutter Aviation", type: "Public" },
  
  // Denver Area
  { code: "KDEN", name: "Denver International Airport", city: "Denver, CO", runway: "16000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KAPA", name: "Centennial Airport", city: "Englewood, CO", runway: "10000 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  
  // Seattle Area
  { code: "KSEA", name: "Seattle-Tacoma International", city: "Seattle, WA", runway: "11901 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBFI", name: "Boeing Field/King County International", city: "Seattle, WA", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Additional Major Business Aviation Airports
  { code: "KJNK", name: "Nantucket Memorial Airport", city: "Nantucket, MA", runway: "6303 ft", fbo: "Rectrix Aviation", type: "Public" },
  { code: "KMVY", name: "Martha's Vineyard Airport", city: "Vineyard Haven, MA", runway: "5504 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KACK", name: "Nantucket Memorial Airport", city: "Nantucket, MA", runway: "6303 ft", fbo: "Rectrix Aviation", type: "Public" },
  { code: "KEYW", name: "Key West International Airport", city: "Key West, FL", runway: "4801 ft", fbo: "Signature Flight Support", type: "Public" },
  
  // Examples of Private/Military for demonstration
  { code: "KTUS", name: "Tucson International Airport", city: "Tucson, AZ", runway: "10996 ft", fbo: "Ross Aviation", type: "Public" },
  { code: "KDOV", name: "Dover Air Force Base", city: "Dover, DE", runway: "12900 ft", fbo: "Military Only", type: "Military" },
  { code: "KPVT", name: "Private Airfield Example", city: "Private Location", runway: "4000 ft", fbo: "Private Only", type: "Private" },
];

interface Airport {
  code: string;
  name: string;
  city: string;
  runway: string;
  fbo: string;
  type: string;
}

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
                        variant={airport.type === "Public" ? "default" : airport.type === "Private" ? "secondary" : "destructive"}
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