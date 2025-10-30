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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
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

    // Check if JSON contains quotes array directly
    const quotesArray = emailData.quotes || [];
    
    // Handle Resend inbound email format for backward compatibility
    const senderEmail = emailData.from?.address || emailData.from || emailData.sender || emailData.From || emailData.sender_email || null;
    const subject = emailData.subject || emailData.Subject || "Quote Submission";

    // Store quote directly
    const { data: quoteRecord, error: insertError } = await supabase
      .from("quotes")
      .insert({
        raw_email_data: emailData,
        sender_email: senderEmail,
        subject: subject,
        extracted_data: { quotes: quotesArray },
        processed: true,
        status: 'completed'
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

    console.log("Quote record created:", quoteRecord.id, "with", quotesArray.length, "quotes");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Quotes received and processed",
        quoteId: quoteRecord.id,
        quotesExtracted: quotesArray.length
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
