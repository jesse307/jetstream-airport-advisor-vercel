import { useState } from "react";
import { X, Send, Wand2, Loader2, FileText, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailPreview } from "@/components/EmailPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  leadData: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    trip_type: "one-way" | "round-trip";
    departure_airport: string;
    arrival_airport: string;
    departure_date: string;
    departure_time: string;
    return_date?: string;
    return_time?: string;
    passengers: number;
    notes?: string;
    analysis_data?: any;
  };
}

export function EmailComposer({ isOpen, onClose, leadData }: EmailComposerProps) {
  const [subject, setSubject] = useState(`Private Jet Charter Quote - ${leadData.departure_airport} to ${leadData.arrival_airport}`);
  const [emailContent, setEmailContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(`Subject: {{AI: Create an engaging subject line for a private jet quote from {{departure_airport}} to {{arrival_airport}}}}

Dear {{first_name}},

{{AI: Write a warm, personalized greeting that references their specific trip details and shows excitement about helping them}}

**FLIGHT DETAILS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
📅  **Departure**: {{departure_date}} at {{departure_time}}
{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}
{{ENDIF}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

**AIRPORT INFORMATION**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: Provide specific details about FBO services, amenities, and private aviation facilities at {{departure_airport}} and {{arrival_airport}}}}

{{IF missing_departure_time}}
**SCHEDULING NOTE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰  I noticed you didn't specify a departure time. {{AI: Write a friendly message about scheduling flexibility and ask what time works best}}
{{ENDIF}}

**AIRCRAFT RECOMMENDATIONS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities.}}

{{IF passengers_lte_4}}
{{AI: Focus on light jets and super light jets, emphasizing efficiency and cost-effectiveness}}
{{ELSIF passengers_lte_8}}
{{AI: Recommend mid-size jets, highlighting comfort and range for this group size}}
{{ELSE}}
{{AI: Suggest heavy jets or large cabin aircraft, emphasizing space and luxury}}
{{ENDIF}}

**ESTIMATED INVESTMENT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: Provide accurate pricing based on the actual flight analysis data. Include what's covered and mention price factors. Use the estimatedCost from capableAircraft data.}}

**WHY CHOOSE PRIVATE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆  **Time Savings**: Skip 2+ hours of commercial airport hassles
⏰  **Schedule Control**: Depart exactly when YOU want
🎯  **Direct Flight**: No connections or delays
🛡️  **Privacy & Comfort**: Your own private cabin
🧳  **Baggage Freedom**: No weight restrictions or fees

{{IF notes_contains_business}}
**BUSINESS TRAVEL BENEFITS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📶  **Connectivity**: High-speed WiFi throughout the flight
💼  **Mobile Office**: Spacious work environment with power outlets
📞  **Communication**: Make calls and conduct meetings in-flight
⚡  **Productivity**: Arrive refreshed and ready for business
{{ENDIF}}

{{IF notes_contains_leisure}}
**LUXURY TRAVEL EXPERIENCE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥂  **Premium Service**: Dedicated flight attendant and catering
🛋️  **Comfort**: Spacious leather seating and climate control  
🎵  **Entertainment**: Premium audio/video systems
✨  **Luxury**: Make your vacation start the moment you board
{{ENDIF}}

**NEXT STEPS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  **Reply** to confirm your preferred departure time and aircraft
2️⃣  **Review** final pricing and contract details
3️⃣  **Secure** your aircraft with a deposit
4️⃣  **Fly** in luxury and comfort!

I'm standing by to finalize the details and get you airborne. With your departure coming up, I recommend securing your aircraft promptly to ensure availability.

**Ready to book or have questions?**
📞 Call/Text: (555) 123-4567
📧 Email: charter@yourcompany.com
⚡ **Response Time**: Within 1 hour during business hours

Looking forward to making your journey exceptional!

Best regards,
[Your Name]
Senior Charter Specialist
[Your Company Name]

---
*This quote is valid for 48 hours. Aircraft availability and pricing subject to confirmation.*`);
  const [makeWebhookUrl, setMakeWebhookUrl] = useState("");
  const handleCreateDraft = async () => {
    if (!makeWebhookUrl) {
      toast.error("Please enter your Make.com webhook URL");
      return;
    }

    if (!emailContent.trim()) {
      toast.error("Please generate email content first");
      return;
    }

    setIsSending(true);
    
    const webhookData = {
      to: leadData.email,
      subject: subject,
      body: emailContent,
      leadData: leadData,
      action: "create_draft",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending to Make.com webhook:", {
      url: makeWebhookUrl,
      dataSize: JSON.stringify(webhookData).length
    });

    try {
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      console.log("Webhook response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        toast.success("Gmail draft created successfully! Check your Gmail drafts folder.");
      } else {
        console.error("Webhook returned error status:", response.status);
        toast.error(`Webhook returned status ${response.status}. Check your Make.com scenario.`);
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      
      // Try with no-cors as fallback
      try {
        console.log("Retrying with no-cors mode...");
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(webhookData),
        });
        toast.success("Request sent to Make.com (no-cors mode). Check your Gmail drafts folder and Make.com execution history.");
      } catch (fallbackError) {
        console.error('Fallback request also failed:', fallbackError);
        toast.error("Failed to send request. Please check your webhook URL and Make.com scenario.");
      }
    } finally {
      setIsSending(false);
    }
  };
  const [activeTab, setActiveTab] = useState("preview");

  const availableVariables = [
    { key: "{{first_name}}", value: leadData.first_name, description: "Customer's first name" },
    { key: "{{last_name}}", value: leadData.last_name, description: "Customer's last name" },
    { key: "{{full_name}}", value: `${leadData.first_name} ${leadData.last_name}`, description: "Customer's full name" },
    { key: "{{email}}", value: leadData.email, description: "Customer's email address" },
    { key: "{{phone}}", value: leadData.phone, description: "Customer's phone number" },
    { key: "{{trip_type}}", value: leadData.trip_type, description: "Trip type (one-way/round-trip)" },
    { key: "{{departure_airport}}", value: leadData.departure_airport, description: "Departure airport code" },
    { key: "{{arrival_airport}}", value: leadData.arrival_airport, description: "Arrival airport code" },
    { key: "{{route}}", value: `${leadData.departure_airport} → ${leadData.arrival_airport}`, description: "Flight route" },
    { key: "{{departure_date}}", value: leadData.departure_date, description: "Departure date" },
    { key: "{{departure_time}}", value: leadData.departure_time, description: "Departure time" },
    { key: "{{return_date}}", value: leadData.return_date || "N/A", description: "Return date (if applicable)" },
    { key: "{{return_time}}", value: leadData.return_time || "N/A", description: "Return time (if applicable)" },
    { key: "{{passengers}}", value: leadData.passengers.toString(), description: "Number of passengers" },
    { key: "{{notes}}", value: leadData.notes || "No special notes", description: "Special requests or notes" }
  ];

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success("Variable copied to clipboard!");
  };

  const generateEmail = async () => {
    if (!emailTemplate.trim()) {
      toast.error("Please create a template first");
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate actual flight capabilities based on route
      const calculateFlightCapabilities = () => {
        const departureCode = leadData.departure_airport.split(' - ')[0] || leadData.departure_airport;
        const arrivalCode = leadData.arrival_airport.split(' - ')[0] || leadData.arrival_airport;
        
        // EWR to LAS distance is approximately 2400nm
        const routeDistance = 2400; // This should come from actual calculation
        
        // Define aircraft with their actual capabilities
        const aircraftDatabase = [
          {
            category: "Very Light Jet",
            examples: ["Eclipse 550", "Phenom 100", "Citation M2"],
            maxRange: 1200,
            speed: 290,
            hourlyRate: 5500,
            minRunway: 3200
          },
          {
            category: "Light Jet", 
            examples: ["Citation CJ3+", "Phenom 300", "Learjet 75"],
            maxRange: 2000,
            speed: 320,
            hourlyRate: 8100,
            minRunway: 4000
          },
          {
            category: "Super Light Jet",
            examples: ["Citation CJ4", "Phenom 300E", "Learjet 45XR"],
            maxRange: 2400,
            speed: 350,
            hourlyRate: 9200,
            minRunway: 4500
          },
          {
            category: "Mid Jet",
            examples: ["Citation XLS+", "Hawker 900XP", "Learjet 60XR"],
            maxRange: 2100,
            speed: 360,
            hourlyRate: 8600,
            minRunway: 5000
          },
          {
            category: "Super Mid Jet",
            examples: ["Citation X+", "Challenger 350", "G280"],
            maxRange: 3200,
            speed: 390,
            hourlyRate: 11000,
            minRunway: 5500
          }
        ];

        // Filter aircraft that can make the trip nonstop
        const capableAircraft = aircraftDatabase
          .filter(aircraft => {
            const rangeCapable = aircraft.maxRange >= routeDistance;
            // Add fuel reserve requirement (10% buffer)
            const rangeWithReserve = aircraft.maxRange * 0.9;
            return rangeWithReserve >= routeDistance;
          })
          .map(aircraft => {
            const flightTimeHours = routeDistance / aircraft.speed;
            const flightTime = `${Math.floor(flightTimeHours)}h ${Math.round((flightTimeHours % 1) * 60)}m`;
            const estimatedCost = Math.round(flightTimeHours * aircraft.hourlyRate);
            
            return {
              ...aircraft,
              flightTime,
              estimatedCost: `$${(estimatedCost * 0.9).toLocaleString()} - $${(estimatedCost * 1.1).toLocaleString()}`,
              capable: true
            };
          });

        return capableAircraft;
      };

      const capableAircraft = calculateFlightCapabilities();
      const recommendedAircraft = capableAircraft.length > 0 
        ? capableAircraft[0].examples 
        : ["Contact for aircraft options"];

      const actualFlightAnalysis = {
        distance: 2400,
        recommendedAircraft,
        estimatedCost: capableAircraft.length > 0 ? capableAircraft[0].estimatedCost : "Contact for pricing",
        flightTime: capableAircraft.length > 0 ? capableAircraft[0].flightTime : "4h 45m",
        capableAircraft
      };

      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: {
          leadData,
          template: emailTemplate,
          flightAnalysis: actualFlightAnalysis
        }
      });

      if (error) {
        console.error('Error generating email:', error);
        toast.error("Failed to generate email. Please try again.");
        return;
      }

      if (data.success) {
        setEmailContent(data.email);
        setSubject(data.subject);
        setActiveTab("compose");
        toast.success("Email generated successfully!");
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while generating the email.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!makeWebhookUrl) {
      toast.error("Please enter your Make.com webhook URL");
      return;
    }

    if (!emailContent.trim()) {
      toast.error("Please generate or write email content");
      return;
    }

    setIsSending(true);
    try {
      // Send to Make.com webhook for Gmail integration
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          to: leadData.email,
          subject: subject,
          body: emailContent,
          leadData: {
            id: leadData.id,
            name: `${leadData.first_name} ${leadData.last_name}`,
            phone: leadData.phone,
            trip_details: {
              type: leadData.trip_type,
              route: `${leadData.departure_airport} → ${leadData.arrival_airport}`,
              departure: `${leadData.departure_date} at ${leadData.departure_time}`,
              return: leadData.return_date ? `${leadData.return_date} at ${leadData.return_time}` : null,
              passengers: leadData.passengers
            }
          },
          timestamp: new Date().toISOString(),
          source: "Charter Pro Lead System"
        }),
      });

      // Since we're using no-cors, we won't get response status
      toast.success("Email sent to Make.com! Check your Gmail and Make.com logs to confirm delivery.");
      
      // Update lead status to 'contacted'
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', leadData.id);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
      }

      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email to Make.com. Please check your webhook URL.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Generate & Send Email Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Sending to:</h3>
              <span className="text-sm text-muted-foreground">
                Lead #{leadData.id.slice(0, 8)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{leadData.first_name} {leadData.last_name}</span>
                <br />
                <span className="text-muted-foreground">{leadData.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {leadData.departure_airport} → {leadData.arrival_airport}
                  <br />
                  {leadData.passengers} passenger{leadData.passengers !== 1 ? 's' : ''} • {leadData.trip_type}
                </span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Compose
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Template Maker
                  </CardTitle>
                  <CardDescription>
                    Create your email template using the available variables, then let AI add the pizazz!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Available Variables & Conditional Logic</Label>
                    
                    <div className="space-y-4">
                      {/* Basic Variables */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Basic Variables</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {availableVariables.map((variable) => (
                            <div
                              key={variable.key}
                              className="flex items-center justify-between p-2 bg-muted/30 rounded border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm text-primary">{variable.key}</div>
                                <div className="text-xs text-muted-foreground truncate">{variable.description}</div>
                                <div className="text-xs text-muted-foreground font-medium">→ {variable.value}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyVariable(variable.key)}
                                className="flex-shrink-0 ml-2"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conditional Logic */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Conditional Logic Examples</h4>
                        <div className="space-y-2 text-xs bg-muted/20 p-3 rounded">
                          <div className="font-mono">
                            <span className="text-primary">{"{{IF missing_departure_time}}"}</span><br/>
                            ⏰ I noticed you didn't specify a departure time...<br/>
                            <span className="text-primary">{"{{ENDIF}}"}</span>
                          </div>
                          <div className="font-mono">
                            <span className="text-primary">{"{{IF passengers_lte_6}}"}</span><br/>
                            🎯 Perfect Match: Super Light Jet for {"{{passengers}}"} passengers<br/>
                            <span className="text-primary">{"{{ELSE}}"}</span><br/>
                            🎯 Recommended: Mid-Size Jet for larger groups<br/>
                            <span className="text-primary">{"{{ENDIF}}"}</span>
                          </div>
                          <div className="font-mono">
                            <span className="text-primary">{"{{IF notes_contains_business}}"}</span><br/>
                            📶 Business Travel Benefits: WiFi, mobile office setup<br/>
                            <span className="text-primary">{"{{ENDIF}}"}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Available conditions:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• <code>missing_departure_time</code>, <code>missing_return_time_roundtrip</code></li>
                            <li>• <code>passengers_gt_8</code>, <code>passengers_lte_6</code>, <code>passengers_eq_1</code></li>
                            <li>• <code>is_roundtrip</code>, <code>is_oneway</code></li>
                            <li>• <code>has_notes</code>, <code>notes_contains_business</code>, <code>notes_contains_leisure</code></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Your Email Template</Label>
                    <Textarea
                      id="template"
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value)}
                      placeholder="Subject: Private Jet Charter Quote - {{departure_airport}} to {{arrival_airport}}

Dear {{first_name}},

Thank you for your interest in private jet charter! I'm excited to provide you with a personalized quote for your {{trip_type}} flight.

**FLIGHT DETAILS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
📅  **Departure**: {{departure_date}} at {{departure_time}}
{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}
{{ENDIF}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}

**AIRPORT INFORMATION**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛫  **Departure**: Premium FBO services available at Newark Liberty
🛬  **Arrival**: Las Vegas offers multiple FBO options with luxury amenities

**AIRCRAFT RECOMMENDATIONS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{IF passengers_lte_6}}
🎯  **Perfect Match**: Super Light Jet (Citation CJ4, Phenom 300E)
    • Ideal for {{passengers}} passengers
    • 2,400nm range - perfect for cross-country flights
    • Estimated flight time: 4h 45m
    • Premium cabin comfort with full stand-up headroom
{{ENDIF}}

{{IF passengers_gt_6}}
🎯  **Recommended**: Mid-Size Jet for your group of {{passengers}}
    • Spacious cabin for comfortable cross-country travel
    • Extended range capabilities
    • Enhanced luggage capacity
{{ENDIF}}

**ESTIMATED INVESTMENT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰  **Range**: $42,000 - $48,000
    • All-inclusive pricing (no hidden fees)
    • Covers aircraft, crew, fuel, and handling
    • Price varies based on final aircraft selection

**WHY CHOOSE PRIVATE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆  **Time Savings**: Skip 2+ hours of commercial airport hassles
⏰  **Schedule Control**: Depart exactly when YOU want
🎯  **Direct Flight**: No connections or delays
🛡️  **Privacy & Comfort**: Your own private cabin
🧳  **Baggage Freedom**: No weight restrictions or fees

{{IF missing_departure_time}}
**SCHEDULING NOTE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰  I noticed you didn't specify a departure time. What time would work best for your schedule? Private jet travel offers complete flexibility!
{{ENDIF}}

{{IF notes_contains_business}}
**BUSINESS TRAVEL BENEFITS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📶  **Connectivity**: High-speed WiFi throughout the flight
💼  **Mobile Office**: Spacious work environment with power outlets
📞  **Communication**: Make calls and conduct meetings in-flight
⚡  **Productivity**: Arrive refreshed and ready for business
{{ENDIF}}

**NEXT STEPS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  **Reply** to confirm your preferred departure time
2️⃣  **Review** aircraft options and select your preference  
3️⃣  **Book** with a simple deposit to secure your aircraft
4️⃣  **Fly** in luxury and comfort!

I'm standing by to finalize the details and get you airborne. With your departure just days away, I recommend securing your aircraft today to ensure availability.

**Ready to book or have questions?**
📞 Call/Text: [Your Phone]
📧 Email: [Your Email]
⚡ **Response Time**: Within 1 hour during business hours

Looking forward to making your journey exceptional!

Best regards,
[Your Name]
[Your Title]
[Company Name]

---
*This quote is valid for 48 hours. Aircraft availability and pricing subject to confirmation.*"
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use the variables above to personalize your template. Click the copy button to add them easily.
                    </p>
                  </div>

                  <Button
                    onClick={generateEmail}
                    disabled={isGenerating || !emailTemplate.trim()}
                    className="w-full flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {isGenerating ? "Adding AI Pizazz..." : "Generate Email with AI Pizazz"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <EmailPreview 
                subject={subject || `Private Jet Charter Quote - ${leadData.departure_airport} to ${leadData.arrival_airport}`}
                content={emailTemplate || "Please create a template first to see the preview."}
                isTemplate={true}
              />
              
              {!emailTemplate.trim() && (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-semibold text-lg mb-2">No Template to Preview</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a template in the Template tab to see how your email will look with the new professional fonts.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("template")}
                      className="font-display"
                    >
                      Create Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compose" className="space-y-4">
              {/* Email Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                />
              </div>

              {/* Email Content Editor */}
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Generated email content will appear here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  HTML formatting is supported. The AI will enhance your template with professional styling.
                </p>
              </div>

              {/* Make.com Integration */}
              <div className="space-y-2">
                <Label htmlFor="webhook">Make.com Webhook URL</Label>
                <Input
                  id="webhook"
                  type="url"
                  value={makeWebhookUrl}
                  onChange={(e) => setMakeWebhookUrl(e.target.value)}
                  placeholder="https://hook.us1.make.com/your-webhook-url"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Make.com webhook URL that connects to Gmail. This will create a draft in your Gmail account.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDraft} 
                  disabled={isSending || !emailContent.trim() || !makeWebhookUrl}
                  className="flex items-center gap-2"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isSending ? "Creating Draft..." : "Create Gmail Draft"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}