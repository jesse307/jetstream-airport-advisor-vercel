import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Mail, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor } from '@tinymce/tinymce-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const [emailTemplate, setEmailTemplate] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEmailTemplate(getDefaultTemplate());
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_default', true)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading template:', error);
        toast.error("Failed to load template");
        return;
      }

      if (data) {
        setEmailTemplate(data.template_content);
        setTemplateId(data.id);
      } else {
        // Set default template if none exists
        setEmailTemplate(getDefaultTemplate());
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error("An error occurred while loading the template");
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTemplate = () => {
    return `<p>Hi {{first_name}},</p>

<p>Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border-collapse: collapse;">
  <tr>
    <td style="background: linear-gradient(135deg, #1a3a4a 0%, #2d5165 100%); padding: 25px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; padding-bottom: 15px; border-bottom: 2px solid rgba(255,255,255,0.2);">
            ✈️ YOUR FLIGHT DETAILS
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
              <tr>
                <td align="center" style="padding: 0 15px;">
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
                  <div style="text-align: center; min-width: 100px;">
                    <div style="font-size: 28px; margin-bottom: 5px;">→</div>
                    <div style="height: 2px; background: linear-gradient(90deg, #ff6b35 0%, rgba(255,255,255,0.4) 50%, #ff6b35 100%); margin: 0 auto; width: 80px;"></div>
                    <div style="background: rgba(255,255,255,0.95); color: #2d5165; font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 20px; margin-top: 10px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      {{passengers}} PAX
                    </div>
                  </div>
                </td>
                
                <td align="center" style="padding: 0 15px;">
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

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
        <tr>
          <td style="padding: 15px; background: rgba(255,255,255,0.08); border-radius: 8px;">
            <table width="100%" cellpadding="8" cellspacing="0">
              <tr>
                <td style="color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; width: 40%;">📍 Trip Type:</td>
                <td style="color: #ffffff; font-size: 14px; font-weight: 600;">{{trip_type}}</td>
              </tr>
              <tr>
                <td style="color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500;">👥 Passengers:</td>
                <td style="color: #ffffff; font-size: 14px; font-weight: 600;">{{passengers}}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

<p>{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}</p>

<p>Do you have a specific aircraft that you've flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we're happy to source something larger"}}</p>

<p><strong>Why Stratos Jets</strong></p>
<p>{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}</p>

<p>Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.</p>

<p>--<br/>Best,<br/>Jesse</p>

<img src="https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/images/stratos_logo_email.png" alt="Stratos Jet Charters" style="max-width: 300px; margin-top: 20px;" />`;
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save templates");
        setIsSaving(false);
        return;
      }

      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({ 
            template_content: emailTemplate,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);

        if (error) {
          console.error('Error updating template:', error);
          toast.error("Failed to save template");
          return;
        }
      } else {
        // Create new template
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
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setEmailTemplate(getDefaultTemplate());
    toast.info("Template reset to default. Click Save to apply changes.");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your email templates and application settings
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="email-templates" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="email-templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email-templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Default Email Template
                </CardTitle>
                <CardDescription>
                  This template is used when composing emails to leads. You can use variables like {`{{first_name}}`}, {`{{departure_airport}}`}, etc.
                  Use {`{{IF is_roundtrip}}...{{ENDIF}}`} for conditional content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="template">Template Content</Label>
                      <Editor
                        apiKey="bh5y77uhl5utzv5u5zmjnmj002o26rj877w1i486g5wnexn6"
                        value={emailTemplate}
                        onEditorChange={(content) => setEmailTemplate(content)}
                        init={{
                          height: 500,
                          menubar: false,
                          plugins: ['lists', 'link', 'code', 'table', 'image', 'help', 'wordcount'],
                          toolbar: 'undo redo | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | link image | table | code | help',
                          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
                          branding: false,
                          promotion: false,
                          valid_elements: '*[*]',
                          extended_valid_elements: '*[*]',
                          valid_children: '+body[style],+body[meta],+body[link]',
                          verify_html: false,
                          entity_encoding: 'raw',
                          forced_root_block: false,
                          force_br_newlines: false,
                          force_p_newlines: false,
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available variables: {`{{first_name}}`}, {`{{last_name}}`}, {`{{email}}`}, {`{{phone}}`}, 
                        {`{{departure_airport}}`}, {`{{arrival_airport}}`}, {`{{departure_date}}`}, {`{{departure_time}}`}, 
                        {`{{return_date}}`}, {`{{return_time}}`}, {`{{passengers}}`}, {`{{trip_type}}`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveTemplate} 
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Template
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleResetToDefault}
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
