-- Insert default lead response template with dynamic variables
INSERT INTO public.email_templates (
  user_id,
  name,
  subject,
  template_content,
  is_default
) VALUES (
  'd6d76c40-3091-426f-b31d-c4b4fc91c119',
  'Default Lead Response',
  'Your Charter Quote - {{route}}',
  '<p>Dear {{first_name}},</p>

<p>Thank you for your interest in private jet charter services with Stratos Jets. We are excited to help you with your upcoming {{trip_type}} flight.</p>

<h3>Trip Details:</h3>
<ul>
  <li><strong>Route:</strong> {{departure_airport}} → {{arrival_airport}}</li>
  <li><strong>Trip Type:</strong> {{trip_type}}</li>
  <li><strong>Departure:</strong> {{departure_date}} at {{departure_time}}</li>
  {{IF is_roundtrip}}
  <li><strong>Return:</strong> {{return_date}} at {{return_time}}</li>
  {{ENDIF}}
  <li><strong>Passengers:</strong> {{passengers}}</li>
</ul>

{{IF has_notes}}
<p><strong>Special Requirements:</strong><br>{{notes}}</p>
{{ENDIF}}

<h3>Next Steps:</h3>
<p>Our team is currently reviewing your request and will provide you with personalized aircraft options and pricing within the next few hours. We will ensure you receive the best possible options for your journey.</p>

<p>{{AI: Write a brief, professional sentence about why this route is popular or any relevant insights about the airports involved}}</p>

<h3>What to Expect:</h3>
<ul>
  <li>Competitive pricing from our network of certified operators</li>
  <li>Aircraft options tailored to your passenger count and route</li>
  <li>Full transparency on all costs and fees</li>
  <li>24/7 support throughout your booking process</li>
</ul>

<p>If you have any immediate questions or would like to discuss your requirements further, please do not hesitate to reach out. You can reply to this email or call us directly.</p>

<p>We look forward to making your journey exceptional.</p>

<p>Best regards,<br>
<strong>Stratos Jets Charter Team</strong><br>
Private Aviation Excellence</p>',
  true
);