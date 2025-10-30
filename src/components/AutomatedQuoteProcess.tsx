import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutomatedQuoteProcessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  onComplete?: () => void;
}

const DEFAULT_AMENITIES = [
  "WiFi",
  "Entertainment System",
  "Lavatory",
  "Hot Meal Service",
  "Cabin Crew",
  "Shower",
  "Satellite Phone",
  "Pets Allowed",
  "Smoking Allowed",
  "Medical Equipment",
  "Divan Seats",
  "Beds"
];

export function AutomatedQuoteProcess({ open, onOpenChange, quote, onComplete }: AutomatedQuoteProcessProps) {
  const [step, setStep] = useState(1);
  const [tailNumber, setTailNumber] = useState("");
  const [operator, setOperator] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Load existing data when dialog opens
  useEffect(() => {
    if (open && quote) {
      const extracted = quote.extracted_data || {};
      setTailNumber(extracted.tail_number || "");
      setOperator(extracted.operator || "");
      
      // Parse existing amenities
      const existingAmenities = extracted.amenities || [];
      setSelectedAmenities(existingAmenities);
      
      // Find custom amenities (not in default list)
      const customOnes = existingAmenities.filter((a: string) => !DEFAULT_AMENITIES.includes(a));
      setCustomAmenities(customOnes);
    }
  }, [open, quote]);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Process complete - update the quote in Supabase
      setProcessing(true);
      try {
        const enhancedData = {
          ...quote.extracted_data,
          tail_number: tailNumber || null,
          operator: operator || null,
          amenities: selectedAmenities,
          enhanced: true,
          enhanced_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('quotes')
          .update({ extracted_data: enhancedData })
          .eq('id', quote.id);

        if (error) throw error;

        toast({
          title: "Quote Enhanced",
          description: "Quote data has been updated successfully.",
        });
        
        onComplete?.();
        handleClose();
      } catch (error: any) {
        console.error('Error updating quote:', error);
        toast({
          title: "Error",
          description: "Failed to update quote data",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleClose = () => {
    setStep(1);
    setTailNumber("");
    setOperator("");
    setSelectedAmenities([]);
    setCustomAmenities([]);
    setCustomAmenity("");
    onOpenChange(false);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !customAmenities.includes(customAmenity.trim())) {
      setCustomAmenities([...customAmenities, customAmenity.trim()]);
      setSelectedAmenities([...selectedAmenities, customAmenity.trim()]);
      setCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
    setSelectedAmenities(prev => prev.filter(a => a !== amenity));
  };

  const allAmenities = [...DEFAULT_AMENITIES, ...customAmenities];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Automated Quote Process</DialogTitle>
          <DialogDescription>
            Step {step} of 2: {step === 1 ? "Aircraft Information" : "Amenities Selection"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="tailNumber">Tail Number (Optional)</Label>
              <Input
                id="tailNumber"
                placeholder="e.g., N12345"
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator">Operator Name (Optional)</Label>
              <Input
                id="operator"
                placeholder="e.g., ABC Charter"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Provide tail number or operator information to fetch specific aircraft details. Both fields are optional.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Select Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {allAmenities.map((amenity) => {
                  const isCustom = customAmenities.includes(amenity);
                  const isSelected = selectedAmenities.includes(amenity);
                  
                  return (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={isSelected}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label
                        htmlFor={amenity}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2 flex-1"
                      >
                        {amenity}
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              removeCustomAmenity(amenity);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmenity">Add Custom Amenity</Label>
              <div className="flex gap-2">
                <Input
                  id="customAmenity"
                  placeholder="Enter amenity name"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomAmenity}
                  disabled={!customAmenity.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedAmenities.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Amenities ({selectedAmenities.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedAmenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
            disabled={processing}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button onClick={handleNext} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              step === 1 ? "Next" : "Complete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
