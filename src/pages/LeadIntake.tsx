import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, UserPlus, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { AirportSearch } from "@/components/AirportSearch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().min(10, "Phone number too short").max(20, "Phone number too long"),
  tripType: z.enum(["one-way", "round-trip"], {
    required_error: "Please select trip type",
  }),
  departureAirport: z.string().min(1, "Departure airport is required"),
  arrivalAirport: z.string().min(1, "Arrival airport is required"),
  departureDate: z.date({
    required_error: "Departure date is required",
  }),
  departureTime: z.string().min(1, "Departure time is required"),
  returnDate: z.date().optional(),
  returnTime: z.string().optional(),
  passengers: z.coerce.number().min(1, "At least 1 passenger required").max(19, "Maximum 19 passengers"),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadIntake() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      passengers: 4,
      tripType: "round-trip",
      notes: "",
    },
  });

  const watchTripType = form.watch("tripType");

  // Custom validation for round-trip dates
  const validateDates = (data: LeadFormData) => {
    if (data.tripType === "round-trip") {
      if (!data.returnDate) {
        form.setError("returnDate", { message: "Return date is required for round-trip" });
        return false;
      }
      if (!data.returnTime) {
        form.setError("returnTime", { message: "Return time is required for round-trip" });
        return false;
      }
      if (data.returnDate < data.departureDate) {
        form.setError("returnDate", { message: "Return date must be after departure date" });
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!validateDates(data)) return;

    setIsSubmitting(true);
    
    try {
      // Prepare data for database
      const leadData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        trip_type: data.tripType,
        departure_airport: data.departureAirport,
        arrival_airport: data.arrivalAirport,
        departure_date: format(data.departureDate, "yyyy-MM-dd"),
        departure_time: data.departureTime,
        return_date: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : null,
        return_time: data.returnTime || null,
        passengers: data.passengers,
        notes: data.notes || null,
        status: "new",
      };

      const { data: result, error } = await supabase
        .from("leads")
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error("Error creating lead:", error);
        toast.error("Failed to save lead. Please try again.");
        return;
      }

      toast.success(`Lead created successfully! Lead ID: ${result.id.slice(0, 8)}`);
      
      // Navigate to lead dashboard or analysis page
      navigate(`/leads/${result.id}`);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Calculator
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="font-semibold">Lead Intake</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                New Charter Lead
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Capture lead information and generate flight analysis
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Flight Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Flight Information</h3>
                    
                    {/* Trip Type */}
                    <FormField
                      control={form.control}
                      name="tripType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Trip Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="one-way" id="one-way" />
                                <Label htmlFor="one-way">One Way</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="round-trip" id="round-trip" />
                                <Label htmlFor="round-trip">Round Trip</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Airports */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departureAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Airport</FormLabel>
                            <FormControl>
                              <AirportSearch
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Search departure airport..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="arrivalAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrival Airport</FormLabel>
                            <FormControl>
                              <AirportSearch
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Search arrival airport..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Departure Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Departure Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick departure date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="departureTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Return Date & Time (conditional) */}
                    {watchTripType === "round-trip" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="returnDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Return Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick return date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="returnTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Return Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Passengers */}
                    <FormField
                      control={form.control}
                      name="passengers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Passengers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="19"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Information</h3>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Special requirements, preferences, or additional details..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit */}
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Creating Lead..." : "Create Lead & Analyze Flight"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}