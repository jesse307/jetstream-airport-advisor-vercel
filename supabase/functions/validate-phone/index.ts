import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Support both Account SID + Auth Token and API Key authentication
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    console.log('Validating phone:', phone);

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Determine auth method based on credential format
    // API Keys start with "SK", Account SIDs start with "AC"
    const authUsername = twilioAccountSid.startsWith('SK') ? twilioAccountSid : twilioAccountSid;
    const authPassword = twilioAuthToken;

    console.log('Auth username starts with:', authUsername.substring(0, 4));
    console.log('Clean phone:', cleanPhone);

    // Use Twilio Lookup API v2
    const response = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(cleanPhone)}?Fields=line_type_intelligence,caller_name`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${authUsername}:${authPassword}`),
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', response.status, errorText);

      // If phone is invalid, Twilio returns 404
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            isValid: false,
            reason: 'Phone number not found or invalid format'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      throw new Error(`Twilio API request failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('Phone validation result:', data);

    // Extract relevant data from Twilio response
    const lineTypeIntel = data.line_type_intelligence || {};
    const callerName = data.caller_name || {};

    return new Response(
      JSON.stringify({
        success: true,
        isValid: data.valid || false,
        phoneNumber: data.phone_number || phone, // E.164 formatted number
        nationalFormat: data.national_format || null,
        countryCode: data.country_code || null,
        carrier: lineTypeIntel.carrier_name || null,
        lineType: lineTypeIntel.type || null, // mobile, landline, voip
        callerName: callerName.caller_name || null,
        callerType: callerName.caller_type || null, // BUSINESS, CONSUMER
        errorCode: lineTypeIntel.error_code || null
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error validating phone:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
