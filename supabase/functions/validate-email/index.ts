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
    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    const abstractApiKey = Deno.env.get('ABSTRACT_API_KEY');
    if (!abstractApiKey) {
      throw new Error('ABSTRACT_API_KEY not configured');
    }

    console.log('Validating email:', email);

    // Use AbstractAPI Email Reputation (not validation)
    const response = await fetch(
      `https://emailreputation.abstractapi.com/v1/?api_key=${abstractApiKey}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AbstractAPI error:', response.status, errorText);
      throw new Error(`Email validation API request failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('Email validation result:', data);

    // Email Reputation API returns reputation score and other metrics
    // Score ranges from 0.01 (very poor) to 0.99 (excellent)
    const reputationScore = data.reputation || 0;
    const isValid =
      reputationScore >= 0.5 && // Good reputation threshold
      data.is_valid_format?.value !== false &&
      !data.is_disposable_email?.value;

    return new Response(
      JSON.stringify({
        success: true,
        isValid: isValid,
        reputation: reputationScore, // 0.01 to 0.99
        isDisposable: data.is_disposable_email?.value || false,
        isFreeEmail: data.is_free_email?.value || false,
        isRoleEmail: data.is_role_email?.value || false, // info@, support@, etc.
        qualityScore: reputationScore, // Using reputation as quality score
        smtpValid: data.smtp_check?.value || null,
        suggestion: data.autocorrect || null,
        reason: reputationScore >= 0.5 ? 'Good reputation' : 'Poor reputation'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error validating email:', error);
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
