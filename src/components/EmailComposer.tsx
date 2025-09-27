import React, { useState } from "react";
import { X, Send, Wand2, Loader2, FileText, Copy, Eye, Code, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
  const [subject, setSubject] = useState("Stratos Jets - Confirming Flight Details");
  const [emailContent, setEmailContent] = useState("");
  const [isShowingTemplate, setIsShowingTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHtmlEditor, setIsHtmlEditor] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(`Subject: Stratos Jets - Confirming Flight Details

Hi {{first_name}},

Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.

FLIGHT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
🔄  **Trip Type**: {{trip_type}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}
📅  **Departure**: {{departure_date}} at {{departure_time}}{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}{{ENDIF}}

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

Do you have a specific aircraft that you've flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we're happy to source something larger"}}

Why Stratos Jets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}

Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.

--
Best,
Jesse`);
  const [makeWebhookUrl] = useState("https://hook.us2.make.com/ywmt9116r48viqppk2lqhhf9s7x57q4w");

  // Reset email content when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const populatedTemplate = populateTemplate(emailTemplate, leadData);
      setEmailContent(populatedTemplate);
    }
  }, [isOpen]); // Reset content every time dialog opens

  const populateTemplate = (template: string, data: any) => {
    let populated = template;
    
    // Format date to US format (MM/DD/YYYY)
    const formatToUSDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US');
      } catch {
        return dateString;
      }
    };
    
    // Format time to AM/PM format
    const formatToAMPM = (timeString: string) => {
      try {
        if (!timeString || timeString.trim() === '') return timeString;
        // Handle different time formats
        let time = timeString.trim();
        
        // If already in AM/PM format, return as is
        if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
          return time;
        }
        
        // Parse 24-hour format (HH:MM)
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return timeString;
        
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      } catch {
        return timeString;
      }
    };
    
    // Replace basic variables
    populated = populated.replace(/\{\{first_name\}\}/g, data.first_name);
    populated = populated.replace(/\{\{last_name\}\}/g, data.last_name);
    populated = populated.replace(/\{\{departure_airport\}\}/g, data.departure_airport);
    populated = populated.replace(/\{\{arrival_airport\}\}/g, data.arrival_airport);
    populated = populated.replace(/\{\{trip_type\}\}/g, data.trip_type);
    
    // Format and replace date/time variables
    populated = populated.replace(/\{\{departure_date\}\}/g, formatToUSDate(data.departure_date));
    populated = populated.replace(/\{\{departure_time\}\}/g, formatToAMPM(data.departure_time));
    populated = populated.replace(/\{\{passengers\}\}/g, data.passengers.toString());
    
    // Handle conditional logic for round-trip
    if (data.trip_type === 'round-trip' && data.return_date && data.return_time) {
      populated = populated.replace(/\{\{IF is_roundtrip\}\}/g, '');
      populated = populated.replace(/\{\{ENDIF\}\}/g, '');
      populated = populated.replace(/\{\{return_date\}\}/g, formatToUSDate(data.return_date));
      populated = populated.replace(/\{\{return_time\}\}/g, formatToAMPM(data.return_time));
    } else {
      // Remove return line for one-way trips
      populated = populated.replace(/\{\{IF is_roundtrip\}\}[\s\S]*?\{\{ENDIF\}\}/g, '');
    }
    
    // Handle passenger pluralization
    populated = populated.replace(/\{\{IF passengers_gt_1\}\}s\{\{ENDIF\}\}/g, data.passengers > 1 ? 's' : '');
    
    // Remove remaining AI placeholders for clean initial display
    populated = populated.replace(/\{\{AI:.*?\}\}/g, '[AI will enhance this section]');
    
    return populated;
  };

  const handleCreateDraft = async () => {
    if (!emailContent.trim()) {
      toast.error("Please generate email content first");
      return;
    }

    setIsSending(true);
    
    // Convert plain text to HTML for Gmail
    const htmlContent = emailContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/━{10,}/g, '<hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;">');
    
    const webhookData = {
      to: leadData.email,
      subject: subject,
      body: htmlContent,
      leadData: leadData,
      action: "create_draft",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending to Make.com webhook:", {
      url: makeWebhookUrl,
      dataSize: JSON.stringify(webhookData).length
    });

    // Get Make.com API key from Supabase secrets
    let makeApiKey: string | undefined;
    try {
      const { data: secretData } = await supabase.functions.invoke('get-make-api-key');
      makeApiKey = secretData?.apiKey;
    } catch (error) {
      console.error("Error fetching Make.com API key:", error);
    }

    try {
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(makeApiKey && { "x-make-apikey": makeApiKey }),
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
            ...(makeApiKey && { "x-make-apikey": makeApiKey }),
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
        toast.success("AI has enhanced your email!");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Compose Email
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

          <div className="space-y-4">
            {/* Change Template Button */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Reset template to original formatting
                  const originalTemplate = `Subject: Stratos Jets - Confirming Flight Details

Hi {{first_name}},

Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.

FLIGHT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
🔄  **Trip Type**: {{trip_type}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}
📅  **Departure**: {{departure_date}} at {{departure_time}}{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}{{ENDIF}}

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

Do you have a specific aircraft that you've flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we're happy to source something larger"}}

Why Stratos Jets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}

Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.

--
Best,
Jesse`;
                  setEmailTemplate(originalTemplate);
                  const newContent = populateTemplate(originalTemplate, leadData);
                  setEmailContent(newContent);
                  toast.success("Template formatting restored");
                }}
                className="text-sm"
              >
                Reset Formatting
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsShowingTemplate(!isShowingTemplate)}
                className="text-sm"
              >
                {isShowingTemplate ? "Hide Template" : "Change Template"}
              </Button>
            </div>

            {/* Template Editor (conditionally shown) */}
            {isShowingTemplate && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Email Template
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={!isHtmlEditor ? "default" : "outline"}
                        onClick={() => setIsHtmlEditor(false)}
                        className="h-7 px-2"
                      >
                        <Type className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                      <Button
                        size="sm"
                        variant={isHtmlEditor ? "default" : "outline"}
                        onClick={() => setIsHtmlEditor(true)}
                        className="h-7 px-2"
                      >
                        <Code className="h-3 w-3 mr-1" />
                        HTML
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Modify the template and the compose area will update automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isHtmlEditor ? (
                    <div className="border rounded-md">
                      <ReactQuill
                        value={emailTemplate}
                        onChange={(value) => {
                          setEmailTemplate(value);
                          const newContent = populateTemplate(value, leadData);
                          setEmailContent(newContent);
                        }}
                        theme="snow"
                        style={{ minHeight: "200px" }}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link'],
                            ['clean']
                          ],
                        }}
                        formats={[
                          'header', 'bold', 'italic', 'underline', 'strike',
                          'color', 'background', 'list', 'bullet', 'align', 'link'
                        ]}
                      />
                    </div>
                  ) : (
                    <Textarea
                      value={emailTemplate}
                      onChange={(e) => {
                        setEmailTemplate(e.target.value);
                        const newContent = populateTemplate(e.target.value, leadData);
                        setEmailContent(newContent);
                      }}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Email Compose Area */}
            <div className="space-y-4">
              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="font-medium"
                />
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[400px] font-mono text-lg"
                  placeholder="Email content will appear here..."
                />
                <p className="text-xs text-muted-foreground">
                  Plain text format - will be converted to HTML when sent to Gmail
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={generateEmail}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {isGenerating ? "Using AI..." : "Use AI"}
                  </Button>
                  
                  <Button 
                    onClick={handleCreateDraft} 
                    disabled={isSending || !emailContent.trim()}
                    className="flex items-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSending ? "Pushing to Gmail..." : "Push to Gmail"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}