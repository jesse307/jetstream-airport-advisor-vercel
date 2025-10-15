-- Update the Default Lead Response template with Gmail-friendly visual enhancements
UPDATE public.email_templates
SET template_content = '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

<p style="font-size: 16px; line-height: 1.6;">Dear {{first_name}},</p>

<p style="font-size: 16px; line-height: 1.6;">Thank you for your interest in private jet charter services with <strong style="color: #0066cc;">Stratos Jets</strong>. We are excited to help you with your upcoming travel! ✈️</p>

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 24px 0;">
  <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">📍 Your Trip Details</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; font-size: 15px;"><strong>Route:</strong></td>
      <td style="padding: 8px 0; text-align: right; font-size: 15px;">{{departure_airport}} → {{arrival_airport}}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 15px;"><strong>Trip Type:</strong></td>
      <td style="padding: 8px 0; text-align: right; font-size: 15px;">{{trip_type}}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 15px;"><strong>Departure:</strong></td>
      <td style="padding: 8px 0; text-align: right; font-size: 15px;">{{departure_date}} at {{departure_time}}</td>
    </tr>
    {{IF is_roundtrip}}
    <tr>
      <td style="padding: 8px 0; font-size: 15px;"><strong>Return:</strong></td>
      <td style="padding: 8px 0; text-align: right; font-size: 15px;">{{return_date}} at {{return_time}}</td>
    </tr>
    {{ENDIF}}
    <tr>
      <td style="padding: 8px 0; font-size: 15px;"><strong>Passengers:</strong></td>
      <td style="padding: 8px 0; text-align: right; font-size: 15px;">{{passengers}} 👥</td>
    </tr>
  </table>
</div>

{{IF has_notes}}
<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin: 24px 0;">
  <p style="margin: 0; font-size: 15px;"><strong>💡 Special Requirements:</strong><br>{{notes}}</p>
</div>
{{ENDIF}}

<h3 style="color: #0066cc; font-size: 20px; margin: 32px 0 16px 0;">🎯 Next Steps</h3>
<p style="font-size: 16px; line-height: 1.6;">Our team is currently reviewing your request and will provide you with personalized aircraft options and pricing within the next few hours. We will ensure you receive the best possible options for your journey.</p>

<div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0066cc;">
  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #555;">{{AI: Write a brief, professional sentence about why this route is popular or any relevant insights about the airports involved}}</p>
</div>

<h3 style="color: #0066cc; font-size: 20px; margin: 32px 0 16px 0;">✨ What to Expect</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr>
    <td style="padding: 12px; background: #f0f9ff; border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 15px;"><strong>💰 Competitive Pricing</strong><br><span style="color: #666;">Best rates from our network of certified operators</span></div>
    </td>
  </tr>
  <tr><td style="height: 8px;"></td></tr>
  <tr>
    <td style="padding: 12px; background: #f0f9ff; border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 15px;"><strong>✈️ Tailored Options</strong><br><span style="color: #666;">Aircraft options matched to your passenger count and route</span></div>
    </td>
  </tr>
  <tr><td style="height: 8px;"></td></tr>
  <tr>
    <td style="padding: 12px; background: #f0f9ff; border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 15px;"><strong>🔍 Full Transparency</strong><br><span style="color: #666;">Complete breakdown of all costs and fees</span></div>
    </td>
  </tr>
  <tr><td style="height: 8px;"></td></tr>
  <tr>
    <td style="padding: 12px; background: #f0f9ff; border-radius: 8px;">
      <div style="font-size: 15px;"><strong>🤝 24/7 Support</strong><br><span style="color: #666;">We are here for you throughout your booking process</span></div>
    </td>
  </tr>
</table>

<div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 32px 0; text-align: center; border: 2px solid #4caf50;">
  <p style="margin: 0 0 12px 0; font-size: 16px; color: #2e7d32;"><strong>Questions? We are here to help!</strong></p>
  <p style="margin: 0; font-size: 15px; color: #555;">Reply to this email anytime or give us a call</p>
</div>

<p style="font-size: 16px; line-height: 1.6; margin-top: 32px;">We look forward to making your journey exceptional.</p>

<div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
  <p style="margin: 0; font-size: 16px; line-height: 1.8;">
    <strong style="color: #0066cc;">Best regards,</strong><br>
    <strong>Stratos Jets Charter Team</strong><br>
    <span style="color: #888; font-size: 14px;">Private Aviation Excellence</span>
  </p>
</div>

</div>'
WHERE name = 'Default Lead Response';