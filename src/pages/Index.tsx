import { useState } from "react";
import { Plane, MapPin, Navigation, Settings, TestTube, UserPlus, Upload, History, Users, Radio, FileText, Calendar, Mail, Wrench, ChevronDown, Search, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { AirportSearch } from "@/components/AirportSearch";
import { FlightCalculator } from "@/components/FlightCalculator";
import { ApiTest } from "@/components/ApiTest";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [departure, setDeparture] = useState<string>("");
  const [arrival, setArrival] = useState<string>("");
  const [departureAirport, setDepartureAirport] = useState<any>(null);
  const [arrivalAirport, setArrivalAirport] = useState<any>(null);
  const [showApiTest, setShowApiTest] = useState<boolean>(false);

  const handleSwapAirports = () => {
    const tempStr = departure;
    const tempApt = departureAirport;
    setDeparture(arrival);
    setArrival(tempStr);
    setDepartureAirport(arrivalAirport);
    setArrivalAirport(tempApt);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary p-2">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Charter Pro</h1>
                <p className="text-xs text-muted-foreground">Flight Planning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="default">
                <Link to="/crm">
                  <Users className="h-4 w-4 mr-1" />
                  CRM
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Wrench className="h-4 w-4 mr-1" />
                    Tools
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/templates" className="flex items-center cursor-pointer">
                      <Mail className="h-4 w-4 mr-2" />
                      Templates
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/availability" className="flex items-center cursor-pointer">
                      <Calendar className="h-4 w-4 mr-2" />
                      Availability
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/quotes" className="flex items-center cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Quotes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/trusted-operators" className="flex items-center cursor-pointer">
                      <Plane className="h-4 w-4 mr-2" />
                      Operators
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/aircraft-tracking" className="flex items-center cursor-pointer">
                      <Radio className="h-4 w-4 mr-2" />
                      Live Tracking
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/aircraft-data" className="flex items-center cursor-pointer">
                      <Search className="h-4 w-4 mr-2" />
                      Aircraft Lookup
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/email-templates" className="flex items-center cursor-pointer">
                      <Send className="h-4 w-4 mr-2" />
                      Email Builder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/leads/import" className="flex items-center cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/leads/import-history" className="flex items-center cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm">
                <Link to="/leads/new">
                  <UserPlus className="h-4 w-4 mr-1" />
                  New Lead
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowApiTest(!showApiTest)}
              >
                <TestTube className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* API Test Panel */}
          {showApiTest && <ApiTest />}
          
          {/* Airport Selection */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Route Planning</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <AirportSearch
                  value={departure}
                  onChange={(value, airport) => {
                    setDeparture(value);
                    setDepartureAirport(airport);
                  }}
                  label="Departure Airport"
                  placeholder="Search by city or airport code"
                />
              </div>
              
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <AirportSearch
                    value={arrival}
                    onChange={(value, airport) => {
                      setArrival(value);
                      setArrivalAirport(airport);
                    }}
                    label="Arrival Airport"
                    placeholder="Search by city or airport code"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="mt-7"
                  onClick={handleSwapAirports}
                  disabled={!departure && !arrival}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

        {/* Flight Calculator */}
        <FlightCalculator 
          departure={departure} 
          arrival={arrival}
          departureAirport={departureAirport}
          arrivalAirport={arrivalAirport}
        />
      </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Plane className="h-3 w-3" />
              <span>Charter Pro © 2024</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Aviation Data Powered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
