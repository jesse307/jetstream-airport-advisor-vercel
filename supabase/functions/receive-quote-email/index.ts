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
    
    // Always read as text first to handle Make.com's inconsistent formatting
    const textBody = await req.text();
    console.log("Raw body (first 200 chars):", textBody.substring(0, 200));
    
    let emailData: any = {};
    
    // Try to parse as JSON if it looks like JSON
    if (textBody.trim().startsWith("{") || textBody.trim().startsWith("[")) {
      try {
        emailData = JSON.parse(textBody);
        console.log("Successfully parsed as JSON");
      } catch (e) {
        console.log("Failed to parse as JSON:", e);
        emailData = { raw_text: textBody };
      }
    } else {
      // If it's HTML or other format, store it as raw text
      console.log("Non-JSON content received");
      emailData = { raw_text: textBody };
    }
    
    console.log("Received email data:", JSON.stringify(emailData).substring(0, 200));

    // Handle Resend inbound email format
    const senderEmail = emailData.from?.address || emailData.from || emailData.sender || emailData.From || null;
    const subject = emailData.subject || emailData.Subject || null;
    const htmlBody = emailData.html || emailData.body_html || emailData.html_body || "";
    const emailTextBody = emailData.text || emailData.body || emailData.body_text || "";
    
    // Extract URLs from email content
    const urlRegex = /https?:\/\/[^\s<>"']+/gi;
    const htmlUrls = htmlBody.match(urlRegex) || [];
    const textUrls = emailTextBody.match(urlRegex) || [];
    const extractedUrls = [...new Set([...htmlUrls, ...textUrls])];
    
    console.log("Extracted URLs from email:", extractedUrls);

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
    
    const systemPrompt = `You are a quote extraction assistant. Extract ONLY the charter quote options from emails, ignoring all other content like greetings, signatures, or unrelated text.

For each quote option found, extract:
- Aircraft type/model
- Price (with currency if available)
- Number of passengers
- Aircraft category (Light, Mid, Heavy, etc.)
- Any certifications or notes
- The URL/link associated with that specific quote
- Route information if available
- Date information if available

Return an array of quotes, with each quote having its own URL. Make sure each quote's URL is correctly matched to that specific quote option.`;

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
          { role: "user", content: `Extract all quote options from this email. Each quote should have its own URL.\n\nSubject: ${subject}\nFrom: ${senderEmail}\n\nBody:\n${emailBody}${attachmentInfo}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_quotes",
              description: "Extract all quote options with their details and URLs",
              parameters: {
                type: "object",
                properties: {
                  quotes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        aircraft_type: { type: "string", description: "Aircraft model or type" },
                        price: { type: "string", description: "Price amount" },
                        currency: { type: "string", description: "Currency code (USD, EUR, etc.)" },
                        passengers: { type: "number", description: "Number of passengers" },
                        category: { type: "string", description: "Aircraft category (Light, Mid, Heavy, etc.)" },
                        certifications: { type: "string", description: "Any certifications or safety ratings" },
                        url: { type: "string", description: "The specific URL/link for this quote" },
                        route: { type: "string", description: "Flight route" },
                        dates: { type: "string", description: "Travel dates" }
                      },
                      required: ["aircraft_type"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["quotes"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_quotes" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status, await aiResponse.text());
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");
    
    let extractedQuotes = [];
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]) {
      const toolCall = aiData.choices[0].message.tool_calls[0];
      const parsedData = JSON.parse(toolCall.function.arguments);
      extractedQuotes = parsedData.quotes || [];
      console.log("Extracted quotes:", extractedQuotes);
    }

    // Update the quote with extracted data
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        extracted_data: { quotes: extractedQuotes },
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
        message: "Quotes received and processed",
        quoteId: quoteRecord.id,
        quotesExtracted: extractedQuotes.length
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
