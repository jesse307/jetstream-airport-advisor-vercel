import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Test function called!");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send a simple test message
        const chunk = {
          choices: [{
            delta: {
              content: "🎉 Edge Function is working! The chatbot will work once you deploy the full version."
            }
          }]
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

        // Send [DONE]
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
