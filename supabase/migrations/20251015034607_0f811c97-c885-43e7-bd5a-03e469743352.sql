-- Update template to be more professional with cleaner design
UPDATE public.email_templates
SET template_content = '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">

<p style="font-size: 16px;">Dear {{first_name}},</p>

<p style="font-size: 16px;">Thank you for your interest in private jet charter services with <strong style="color: #0066cc;">Stratos Jets</strong>. We are excited to help you with your upcoming travel.</p>

<h3 style="color: #0066cc; font-size: 18px; margin: 24px 0 12px 0; border-bottom: 2px solid #0066cc; padding-bottom: 8px;">Trip Details</h3>

<ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
  <li style="padding: 8px 0; font-size: 15px;"><strong>Route:</strong> {{departure_airport}} → {{arrival_airport}}</li>
  <li style="padding: 8px 0; font-size: 15px;"><strong>Trip Type:</strong> {{trip_type}}</li>
  <li style="padding: 8px 0; font-size: 15px;"><strong>Departure:</strong> {{departure_date}} at {{departure_time}}</li>
  {{IF is_roundtrip}}
  <li style="padding: 8px 0; font-size: 15px;"><strong>Return:</strong> {{return_date}} at {{return_time}}</li>
  {{ENDIF}}
  <li style="padding: 8px 0; font-size: 15px;"><strong>Passengers:</strong> {{passengers}}</li>
</ul>

{{IF has_notes}}
<div style="border-left: 3px solid #ffc107; padding-left: 16px; margin: 24px 0;">
  <p style="margin: 0; font-size: 15px; color: #666;"><strong style="color: #333;">Special Requirements:</strong><br>{{notes}}</p>
</div>
{{ENDIF}}

<h3 style="color: #0066cc; font-size: 18px; margin: 32px 0 12px 0; border-bottom: 2px solid #0066cc; padding-bottom: 8px;">Next Steps</h3>

<p style="font-size: 16px;">Our team is currently reviewing your request and will provide you with personalized aircraft options and pricing within the next few hours. We will ensure you receive the best possible options for your journey.</p>

<div style="border-left: 3px solid #0066cc; padding-left: 16px; margin: 24px 0;">
  <p style="margin: 0; font-size: 15px; color: #666; font-style: italic;">{{AI: Write a brief, professional sentence about why this route is popular or any relevant insights about the airports involved}}</p>
</div>

<h3 style="color: #0066cc; font-size: 18px; margin: 32px 0 12px 0; border-bottom: 2px solid #0066cc; padding-bottom: 8px;">What to Expect</h3>

<ul style="padding-left: 20px; margin: 16px 0;">
  <li style="padding: 6px 0; font-size: 15px;">Competitive pricing from our network of certified operators</li>
  <li style="padding: 6px 0; font-size: 15px;">Aircraft options tailored to your passenger count and route</li>
  <li style="padding: 6px 0; font-size: 15px;">Full transparency on all costs and fees</li>
  <li style="padding: 6px 0; font-size: 15px;">24/7 support throughout your booking process</li>
</ul>

<p style="font-size: 16px; margin-top: 32px;">If you have any immediate questions or would like to discuss your requirements further, please do not hesitate to reach out. You can reply to this email or call us directly.</p>

<p style="font-size: 16px; margin-top: 24px;">We look forward to making your journey exceptional.</p>

<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
  <p style="margin: 0; font-size: 16px; line-height: 1.8;">
    <strong>Best regards,</strong><br>
    <strong>Stratos Jets Charter Team</strong><br>
    <span style="color: #666; font-size: 14px;">Private Aviation Excellence</span>
  </p>
</div>

</div>'
WHERE name = 'Default Lead Response';