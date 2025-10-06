import { AircraftOnGround } from "@/components/AircraftOnGround";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AircraftTracking = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Aircraft Tracking</h1>
            <p className="text-muted-foreground text-lg">
              Real-time ADS-B data showing aircraft currently on the ground at any airport
            </p>
          </div>
        </div>

        <AircraftOnGround />
      </div>
    </div>
  );
};

export default AircraftTracking;
