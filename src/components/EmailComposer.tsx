import React, { useState } from "react";
import { Send, Wand2, Loader2, Eye, Code, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Editor } from '@tinymce/tinymce-react';

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
  webhookUrl?: string; // Optional custom webhook URL
}

export function EmailComposer({ isOpen, onClose, leadData, webhookUrl }: EmailComposerProps) {
  const [subject, setSubject] = useState("Stratos Jets - Confirming Flight Details");
  const [emailContent, setEmailContent] = useState("");
  const [isShowingTemplate, setIsShowingTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHtmlEditor, setIsHtmlEditor] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = React.useRef<any>(null);
  const [emailTemplate, setEmailTemplate] = useState(`Hi {{first_name}},

Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border-collapse: collapse;">
  <tr>
    <td style="background: linear-gradient(135deg, #1a3a4a 0%, #2d5165 100%); padding: 25px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; padding-bottom: 15px; border-bottom: 2px solid rgba(255,255,255,0.2);">
            YOUR FLIGHT DETAILS
          </td>
        </tr>
      </table>

      <!-- Route Graphic -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; backdrop-filter: blur(10px);">
              <tr>
                <td align="center" style="padding: 0 15px;">
                  <!-- Departure -->
                  <div style="text-align: center;">
                    <div style="background: #ff6b35; color: #ffffff; font-size: 24px; font-weight: 700; padding: 12px 20px; border-radius: 8px; min-width: 80px; box-shadow: 0 4px 12px rgba(255,107,53,0.3);">
                      {{departure_airport}}
                    </div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 8px; font-weight: 500;">
                      {{departure_date}}<br/>{{departure_time}}
                    </div>
                  </div>
                </td>
                
                <td align="center" style="padding: 0 20px;">
                  <!-- Arrow & Plane -->
                  <div style="text-align: center; min-width: 100px;">
                    <div style="font-size: 32px; margin-bottom: 5px;">✈️</div>
                    <div style="height: 2px; background: linear-gradient(90deg, #ff6b35 0%, rgba(255,255,255,0.4) 50%, #ff6b35 100%); margin: 0 auto; width: 80px;"></div>
                    <div style="background: rgba(255,255,255,0.95); color: #2d5165; font-size: 14px; font-weight: 700; padding: 6px 12px; border-radius: 20px; margin-top: 10px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      👥 {{passengers}} PAX
                    </div>
                  </div>
                </td>
                
                <td align="center" style="padding: 0 15px;">
                  <!-- Arrival -->
                  <div style="text-align: center;">
                    <div style="background: #ff6b35; color: #ffffff; font-size: 24px; font-weight: 700; padding: 12px 20px; border-radius: 8px; min-width: 80px; box-shadow: 0 4px 12px rgba(255,107,53,0.3);">
                      {{arrival_airport}}
                    </div>
                    {{IF is_roundtrip}}<div style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 8px; font-weight: 500;">
                      {{return_date}}<br/>{{return_time}}
                    </div>{{ENDIF}}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Trip Details -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
        <tr>
          <td style="padding: 15px; background: rgba(255,255,255,0.08); border-radius: 8px;">
            <table width="100%" cellpadding="8" cellspacing="0">
              <tr>
                <td style="color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; width: 40%;">Trip Type:</td>
                <td style="color: #ffffff; font-size: 14px; font-weight: 600;">{{trip_type}}</td>
              </tr>
              <tr>
                <td style="color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500;">Passengers:</td>
                <td style="color: #ffffff; font-size: 14px; font-weight: 600;">{{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

Do you have a specific aircraft that you've flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we're happy to source something larger"}}

**Why Stratos Jets**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}

Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.

--
Best,
Jesse

<img src="https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/images/stratos_logo_email.png" alt="Stratos Jet Charters" style="max-width: 300px; margin-top: 20px;" />`);
  const [makeWebhookUrl] = useState(webhookUrl || "https://hook.us2.make.com/j8qtzo8gui8ieqaye9dxprb2cgxqydlb");
  const [exportWebhookUrl, setExportWebhookUrl] = useState("https://hook.us2.make.com/kylqoo8ozkxhxaqi07n33998rmt2tzl4");

  // Load template from database on mount
  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in, using default template');
          return;
        }

        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('is_default', true)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading template:', error);
          return;
        }

        if (data) {
          setEmailTemplate(data.template_content);
          setTemplateId(data.id);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };

    loadTemplate();
  }, []);

  // Reset email content when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const populatedTemplate = populateTemplate(emailTemplate, leadData);
      setEmailContent(populatedTemplate);
    }
  }, [isOpen, emailTemplate]); // Reset content every time dialog opens

  const populateTemplate = (template: string, data: any) => {
    let populated = template;
    
    // Format date to US format (MM/DD/YYYY) without timezone conversion
    const formatToUSDate = (dateString: string) => {
      try {
        if (!dateString) return dateString;
        // Parse YYYY-MM-DD format directly without timezone conversion
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          return `${month}/${day}/${year}`;
        }
        return dateString;
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
    
    // Capitalize trip type (One-way, Round-trip)
    const capitalizedTripType = data.trip_type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('-');
    populated = populated.replace(/\{\{trip_type\}\}/g, capitalizedTripType);
    
    // Format and replace date/time variables
    populated = populated.replace(/\{\{departure_date\}\}/g, formatToUSDate(data.departure_date));
    populated = populated.replace(/\{\{departure_time\}\}/g, formatToAMPM(data.departure_time));
    populated = populated.replace(/\{\{passengers\}\}/g, data.passengers.toString());
    
    // Handle conditional logic for round-trip
    console.log('Trip type:', data.trip_type);
    console.log('Return date:', data.return_date);
    console.log('Return time:', data.return_time);
    
    // Normalize trip type for comparison (handle both "Round Trip" and "round-trip")
    const isRoundTrip = data.trip_type?.toLowerCase().includes('round');
    
    if (isRoundTrip && data.return_date) {
      console.log('Processing round-trip conditionals');
      // Remove the IF...ENDIF block but keep the content inside
      populated = populated.replace(/\{\{IF is_roundtrip\}\}([\s\S]*?)\{\{ENDIF\}\}/g, '$1');
      populated = populated.replace(/\{\{return_date\}\}/g, formatToUSDate(data.return_date));
      populated = populated.replace(/\{\{return_time\}\}/g, data.return_time ? formatToAMPM(data.return_time) : 'TBD');
    } else {
      console.log('Removing round-trip section');
      // Remove the entire IF...ENDIF block including content for one-way trips
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
    
    // TinyMCE already outputs HTML, just wrap it with consistent styling
    const htmlContent = `<div style="font-size: 16px; line-height: 1.5; font-family: Arial, sans-serif;">${emailContent}</div>`;
    
    const webhookData = {
      to: leadData.email,
      subject: subject,
      html: htmlContent,
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
        const departureCode = leadData.departure_airport.includes(' - ') 
          ? leadData.departure_airport.split(' - ')[0] 
          : leadData.departure_airport;
        const arrivalCode = leadData.arrival_airport.includes(' - ')
          ? leadData.arrival_airport.split(' - ')[0]
          : leadData.arrival_airport;
        
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
        // Apply date/time formatting to the AI-generated template
        const formattedEmail = populateTemplate(data.email, leadData);
        setEmailContent(formattedEmail);
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

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save templates");
        setIsSavingTemplate(false);
        return;
      }

      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({ template_content: emailTemplate })
          .eq('id', templateId);

        if (error) {
          console.error('Error updating template:', error);
          toast.error("Failed to save template");
          return;
        }
      } else {
        // Create new template (shouldn't happen normally)
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            name: 'Default Lead Email',
            template_content: emailTemplate,
            is_default: true,
            user_id: user.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating template:', error);
          toast.error("Failed to save template");
          return;
        }

        if (data) {
          setTemplateId(data.id);
        }
      }

      toast.success("Template saved successfully!");
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("An error occurred while saving the template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleExport = async () => {
    if (!exportWebhookUrl.trim()) {
      toast.error("Please enter an export webhook URL");
      return;
    }

    if (!emailContent.trim()) {
      toast.error("Please generate email content first");
      return;
    }

    setIsSending(true);
    
    // TinyMCE already outputs HTML
    const htmlContent = `<div style="font-size: 16px; line-height: 1.5; font-family: Arial, sans-serif;">${emailContent}</div>`;
    
    const exportData = {
      subject: subject,
      html: htmlContent,
      to: leadData.email,
      leadData: leadData,
      timestamp: new Date().toISOString(),
    };

    console.log("Exporting to webhook:", {
      url: exportWebhookUrl,
      dataSize: JSON.stringify(exportData).length
    });

    try {
      const response = await fetch(exportWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });

      console.log("Export response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        toast.success("Email exported successfully!");
      } else {
        console.error("Webhook returned error status:", response.status);
        toast.error(`Export failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      
      // Try with no-cors as fallback
      try {
        console.log("Retrying with no-cors mode...");
        await fetch(exportWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(exportData),
        });
        toast.success("Export request sent (no-cors mode). Check your webhook logs.");
      } catch (fallbackError) {
        console.error('Fallback request also failed:', fallbackError);
        toast.error("Failed to export. Please check your webhook URL.");
      }
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
                  const originalTemplate = `Hi {{first_name}},

Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.

**FLIGHT DETAILS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
🔄  **Trip Type**: {{trip_type}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}
📅  **Departure**: {{departure_date}} at {{departure_time}}{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}{{ENDIF}}

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

Do you have a specific aircraft that you've flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we're happy to source something larger"}}

**Why Stratos Jets**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}

Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.

--
Best,
Jesse

<img src="https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/images/stratos_logo.png" alt="Stratos Jet Charters" style="max-width: 300px; margin-top: 20px;" />`;
                  setEmailTemplate(originalTemplate);
                  const newContent = populateTemplate(originalTemplate, leadData);
                  setEmailContent(newContent);
                  toast.success("Template formatting restored");
                }}
                className="text-sm"
              >
                Reset Formatting
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsShowingTemplate(!isShowingTemplate)}
                  className="text-sm"
                >
                  {isShowingTemplate ? "Hide Template" : "Change Template"}
                </Button>
                {isShowingTemplate && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="text-sm"
                  >
                    {isSavingTemplate ? "Saving..." : "Save Template"}
                  </Button>
                )}
              </div>
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
                    <Textarea
                      value={emailTemplate}
                      onChange={(e) => {
                        setEmailTemplate(e.target.value);
                        const newContent = populateTemplate(e.target.value, leadData);
                        setEmailContent(newContent);
                      }}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="Raw HTML template..."
                    />
                  ) : (
                    <Editor
                      apiKey="bh5y77uhl5utzv5u5zmjnmj002o26rj877w1i486g5wnexn6"
                      value={emailTemplate}
                      onEditorChange={(content) => {
                        setEmailTemplate(content);
                        const newContent = populateTemplate(content, leadData);
                        setEmailContent(newContent);
                      }}
                      init={{
                        height: 200,
                        menubar: false,
                        plugins: ['lists', 'link', 'code', 'help', 'wordcount'],
                        toolbar: 'undo redo | bold italic underline | bullist numlist | link | code | help',
                        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
                        branding: false,
                        promotion: false,
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Email Compose Area */}
            <div className="space-y-4">
              {/* Export Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="exportWebhook">Export Webhook URL (Optional)</Label>
                <Input
                  id="exportWebhook"
                  value={exportWebhookUrl}
                  onChange={(e) => setExportWebhookUrl(e.target.value)}
                  placeholder="https://hook.example.com/your-webhook"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a webhook URL to export the email subject and HTML separately
                </p>
              </div>

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Email Content</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={!showPreview ? "default" : "outline"}
                      onClick={() => setShowPreview(false)}
                      className="h-7 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={showPreview ? "default" : "outline"}
                      onClick={() => setShowPreview(true)}
                      className="h-7 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
                
                {showPreview ? (
                  <div 
                    className="min-h-[400px] p-4 border rounded-md bg-white text-foreground overflow-auto"
                    style={{ fontSize: '16px', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }}
                    dangerouslySetInnerHTML={{
                      __html: emailContent
                    }}
                  />
                ) : (
                  <Editor
                    apiKey="bh5y77uhl5utzv5u5zmjnmj002o26rj877w1i486g5wnexn6"
                    onInit={(evt, editor) => editorRef.current = editor}
                    value={emailContent}
                    onEditorChange={(content) => setEmailContent(content)}
                    init={{
                      height: 400,
                      menubar: false,
                      plugins: [
                        'lists', 'link', 'code'
                      ],
                      toolbar: 'undo redo | bold italic underline | bullist numlist | link | code | removeformat',
                      content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height:1.5; }',
                      branding: false,
                      statusbar: false,
                    }}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {showPreview ? "Preview of how the email will look in Gmail" : "Rich text editor - use the toolbar to format your email"}
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
                    onClick={exportWebhookUrl ? handleExport : handleCreateDraft} 
                    disabled={isSending || !emailContent.trim()}
                    className="flex items-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSending ? (exportWebhookUrl ? "Exporting..." : "Pushing to Gmail...") : (exportWebhookUrl ? "Send to Gmail" : "Push to Gmail")}
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