import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Quote email webhook received - Method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!lovableApiKey) {
      throw new Error("Missing Lovable API key");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const emailData = await req.json();
    
    console.log("Received email data:", JSON.stringify(emailData).substring(0, 200));

    // Extract basic email info
    const senderEmail = emailData.from || emailData.sender || emailData.From || null;
    const subject = emailData.subject || emailData.Subject || null;

    // Store raw email first
    const { data: quoteRecord, error: insertError } = await supabase
      .from("quotes")
      .insert({
        raw_email_data: emailData,
        sender_email: senderEmail,
        subject: subject,
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting quote:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Quote record created:", quoteRecord.id);

    // Use AI to extract quote details
    const emailBody = emailData.body || emailData.text || emailData.html || JSON.stringify(emailData);
    const attachmentInfo = emailData.attachments ? `\n\nAttachments: ${JSON.stringify(emailData.attachments)}` : '';
    
    const systemPrompt = `You are a quote extraction assistant. Extract structured information from charter quote emails.
Extract the following information if available:
- Charter operator/company name
- Aircraft type/model
- Route (departure and arrival airports)
- Date(s) of travel
- Number of passengers
- Price/cost information
- Any special requirements or notes
- Contact information

Return the data in a structured JSON format.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract quote details from this email:\n\nSubject: ${subject}\nFrom: ${senderEmail}\n\nBody:\n${emailBody}${attachmentInfo}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_quote_details",
              description: "Extract structured quote information from the email",
              parameters: {
                type: "object",
                properties: {
                  operator: { type: "string", description: "Charter operator/company name" },
                  aircraft_type: { type: "string", description: "Aircraft model or type" },
                  departure_airport: { type: "string", description: "Departure airport code or name" },
                  arrival_airport: { type: "string", description: "Arrival airport code or name" },
                  travel_date: { type: "string", description: "Date of travel" },
                  passengers: { type: "number", description: "Number of passengers" },
                  price: { type: "string", description: "Price or cost information" },
                  currency: { type: "string", description: "Currency code (USD, EUR, etc.)" },
                  notes: { type: "string", description: "Additional notes or requirements" },
                  contact_name: { type: "string", description: "Contact person name" },
                  contact_email: { type: "string", description: "Contact email" },
                  contact_phone: { type: "string", description: "Contact phone number" }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_quote_details" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status, await aiResponse.text());
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");
    
    let extractedData = {};
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]) {
      const toolCall = aiData.choices[0].message.tool_calls[0];
      extractedData = JSON.parse(toolCall.function.arguments);
      console.log("Extracted data:", extractedData);
    }

    // Update the quote with extracted data
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        extracted_data: extractedData,
        processed: true,
        status: 'completed'
      })
      .eq('id', quoteRecord.id);

    if (updateError) {
      console.error("Error updating quote:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Quote received and processed",
        quoteId: quoteRecord.id,
        extractedData
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in receive-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
