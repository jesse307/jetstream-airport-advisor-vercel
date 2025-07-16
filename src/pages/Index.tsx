import { useState } from "react";
import { Plane, MapPin, Navigation, Settings } from "lucide-react";
import { AirportSearch } from "@/components/AirportSearch";
import { FlightCalculator } from "@/components/FlightCalculator";
import { AirportDropdown } from "@/components/AirportDropdown";
import { Button } from "@/components/ui/button";
import { type Airport } from "@/data/privateAirports";

const Index = () => {
  const [departure, setDeparture] = useState<Airport | null>(null);
  const [arrival, setArrival] = useState<Airport | null>(null);

  const handleSwapAirports = () => {
    const temp = departure;
    setDeparture(arrival);
    setArrival(temp);
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm shadow-card-custom sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-primary p-2">
                <Plane className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Charter Pro</h1>
                <p className="text-sm text-muted-foreground">Private Jet Flight Planning</p>
              </div>
            </div>
            <Button variant="professional" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Airport Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <AirportSearch
                value={departure}
                onChange={setDeparture}
                label="Departure Airport"
                placeholder="Search departure airport..."
              />
              <AirportDropdown 
                airport={departure} 
                onSelect={setDeparture}
                type="departure"
              />
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-4">
                <AirportSearch
                  value={arrival}
                  onChange={setArrival}
                  label="Arrival Airport"
                  placeholder="Search arrival airport..."
                />
                <AirportDropdown 
                  airport={arrival} 
                  onSelect={setArrival}
                  type="arrival"
                />
              </div>
              <Button
                variant="professional"
                size="sm"
                className="mt-7"
                onClick={handleSwapAirports}
                disabled={!departure && !arrival}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Flight Calculator */}
          <FlightCalculator departure={departure} arrival={arrival} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span>Charter Pro © 2024 - Professional Flight Planning Tools</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Aviation Data Powered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
