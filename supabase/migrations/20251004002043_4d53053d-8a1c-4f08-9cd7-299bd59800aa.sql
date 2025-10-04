-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public template viewing" 
ON public.email_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public template creation" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public template updates" 
ON public.email_templates 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default template
INSERT INTO public.email_templates (name, template_content, is_default) VALUES (
  'Default Lead Email',
  'Subject: Stratos Jets - Confirming Flight Details

Hi {{first_name}},

Thank you for your interest in Stratos Jets. In order for me to be the most efficient in providing guidance, please confirm the details below and answer any additional questions.

**FLIGHT DETAILS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  **Route**: {{departure_airport}} → {{arrival_airport}}
🔄  **Trip Type**: {{trip_type}}
👥  **Passengers**: {{passengers}} passenger{{IF passengers_gt_1}}s{{ENDIF}}
📅  **Departure**: {{departure_date}} at {{departure_time}}{{IF is_roundtrip}}
📅  **Return**: {{return_date}} at {{return_time}}{{ENDIF}}

{{AI: Add flight distance, estimated flight time, and any interesting facts about this specific route}}

Do you have a specific aircraft that you''ve flown this route with before? {{AI: ONLY recommend aircraft from the capableAircraft data that can actually complete this route nonstop. Include specific model names, passenger capacity, flight times, and key features. Be accurate about capabilities. Use language like "For this mission, our clients typically fly on" and "of course if you want more space, we''re happy to source something larger"}}

**Why Stratos Jets**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{AI: provide 4 or 5 bullet points about why Stratos Jets is better than other charter brokers}}

Once I have your details, I can provide some additional guidance around which planes could be best and their associated costs. From there, I can obtain hard quotes from our operators and get you booked.

--
Best,
Jesse',
  true
);