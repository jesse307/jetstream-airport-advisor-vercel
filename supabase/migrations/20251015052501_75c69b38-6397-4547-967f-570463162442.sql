-- Update email template with responsive table-based HTML structure
UPDATE email_templates 
SET template_content = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 20px !important;
      }
      .content-cell {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: auto; max-width: 600px; width: 100%; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Brand Header -->
          <tr>
            <td style="background: #1a73e8; height: 4px;"></td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 32px 40px; color: #222; font-size: 15px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">Dear {{first_name}},</p>
              
              <p style="margin: 0 0 20px 0;">Thank you for reaching out to <strong>Stratos Jets</strong>. I want to be sure we have your trip details correct before moving forward. Please review the information below and let me know if anything needs adjustment.</p>
              
              <!-- Trip Details Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0 16px 0;">
                <tr>
                  <td style="border-top: 1px solid #ddd; padding-top: 16px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Trip Details</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">✈️ <strong>Route:</strong> {{departure_airport}} → {{arrival_airport}}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">🗓️ <strong>Trip Type:</strong> {{trip_type}}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">🕐 <strong>Departure:</strong> {{departure_date}} at {{departure_time}}</td>
                </tr>
                {{IF is_roundtrip}}
                <tr>
                  <td style="padding: 4px 0;">🔁 <strong>Return:</strong> {{return_date}} at {{return_time}}</td>
                </tr>
                {{ENDIF}}
                <tr>
                  <td style="padding: 4px 0;">👥 <strong>Passengers:</strong> {{passengers}}</td>
                </tr>
              </table>
              
              <!-- Additional Questions Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0 12px 0;">
                <tr>
                  <td style="border-top: 1px solid #eee; padding-top: 12px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Additional Questions</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Do you have a preferred aircraft for this route?</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Will you be traveling with extra or oversized luggage?</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Will you be bringing any pets on board?</td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0;">Once I have your confirmed details, I''ll send over aircraft options, estimated pricing, and any route-specific considerations. If anything looks off, just reply with an update. Happy to talk by phone or text if that''s easier.</p>
              
              <!-- Signature -->
              <p style="margin: 32px 0 4px 0; border-top: 1px solid #eee; padding-top: 20px;">Best,<br><strong>Jesse</strong></p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 12px 0 0 0;">
                <tr>
                  <td style="font-size: 14px; line-height: 1.6; color: #444;">
                    <strong style="font-size: 16px; color: #1a1a1a;">Jesse Marsh</strong><br>
                    Flight Advisor — Stratos Jet Charters, Inc.<br>
                    <a href="tel:19737848000" style="color: #1a73e8; text-decoration: none;">Direct: 973-784-8000</a> <span style="color: #888;">(Text Enabled)</span><br>
                    <a href="mailto:jesse.marsh@stratosjets.com" style="color: #1a73e8; text-decoration: none;">jesse.marsh@stratosjets.com</a><br>
                    <a href="https://www.stratosjets.com" style="color: #1a73e8; text-decoration: none;">www.stratosjets.com</a> &nbsp;|&nbsp; 
                    <a href="https://www.linkedin.com/in/jessemarshnj/" style="color: #1a73e8; text-decoration: none;">LinkedIn</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <img src="https://hwemookrxvflpinfpkrj.supabase.co/storage/v1/object/public/email-assets/Stratos.png" alt="Stratos Jet Charters" style="max-width: 140px; height: auto; display: block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
'
WHERE is_default = true;