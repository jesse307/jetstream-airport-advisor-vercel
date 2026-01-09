import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Test 1: Basic function works
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: "✅ Step 1: Edge Function is running!\n\n" } }]
        })}\n\n`));

        // Test 2: Environment variables
        const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!ANTHROPIC_API_KEY) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: "❌ Step 2: ANTHROPIC_API_KEY is NOT configured!\n\n" } }]
          })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: `✅ Step 2: ANTHROPIC_API_KEY is configured (${ANTHROPIC_API_KEY.slice(0, 10)}...)\n\n` } }]
          })}\n\n`));
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: "❌ Step 3: Supabase credentials missing!\n\n" } }]
          })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: "✅ Step 3: Supabase credentials configured\n\n" } }]
          })}\n\n`));
        }

        // Test 3: Try importing Anthropic SDK
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: "⏳ Step 4: Testing Anthropic SDK import...\n\n" } }]
          })}\n\n`));

          const Anthropic = (await import("npm:@anthropic-ai/sdk@0.32.0")).default;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: "✅ Step 4: Anthropic SDK imported successfully!\n\n" } }]
          })}\n\n`));

          // Test 4: Try creating Anthropic client
          if (ANTHROPIC_API_KEY) {
            const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content: "✅ Step 5: Anthropic client created!\n\n" } }]
            })}\n\n`));

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content: "🎉 All diagnostics passed! Your chatbot should work.\n\n" } }]
            })}\n\n`));
          }
        } catch (sdkError) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: `❌ Step 4 Failed: ${sdkError.message}\n\n` } }]
          })}\n\n`));
        }

        // Send [DONE]
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: `❌ Error: ${error.message}\n\n` } }]
        })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
});
