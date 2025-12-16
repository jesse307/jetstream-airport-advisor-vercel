import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SalesforceCredentials {
  username: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Scrape Salesforce lead webhook received - Method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const salesforceUsername = Deno.env.get("SALESFORCE_USERNAME");
    const salesforcePassword = Deno.env.get("SALESFORCE_PASSWORD");

    if (!supabaseUrl || !supabaseServiceKey || !browserlessApiKey) {
      throw new Error("Missing required environment variables");
    }

    if (!salesforceUsername || !salesforcePassword) {
      throw new Error("Missing Salesforce credentials in environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming request
    const body = await req.json();
    const salesforceUrl = body.url || body.salesforce_url || body.link;

    if (!salesforceUrl) {
      return new Response(
        JSON.stringify({ error: "No Salesforce URL provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Scraping Salesforce URL:", salesforceUrl);

    // Create Puppeteer script to scrape Salesforce
    const puppeteerScript = `
module.exports = async ({ page }) => {
  const username = '${salesforceUsername}';
  const password = '${salesforcePassword}';
  const targetUrl = '${salesforceUrl}';

  console.log('Navigating to Salesforce URL:', targetUrl);

  // Navigate to the Salesforce URL
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  // Check if we need to log in
  const needsLogin = await page.evaluate(() => {
    return document.querySelector('input[type="password"]') !== null ||
           document.querySelector('input[name="username"]') !== null ||
           window.location.href.includes('login');
  });

  if (needsLogin) {
    console.log('Login required, authenticating...');

    // Wait for username field and enter credentials
    await page.waitForSelector('input[name="username"], input[type="email"]', { timeout: 10000 });
    await page.type('input[name="username"], input[type="email"]', username);

    // Enter password
    await page.waitForSelector('input[name="pw"], input[type="password"]', { timeout: 10000 });
    await page.type('input[name="pw"], input[type="password"]', password);

    // Click login button
    await page.click('input[type="submit"], button[type="submit"]');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
    console.log('Login successful');
  } else {
    console.log('Already authenticated or no login required');
  }

  // Wait for page to load completely
  await page.waitForTimeout(3000);

  // Extract all text content and HTML
  const pageData = await page.evaluate(() => {
    // Get visible text
    const bodyText = document.body.innerText;

    // Get HTML for specific Salesforce sections
    const opportunitySection = document.querySelector('.slds-form-element, .detailList, .pbBody');
    const html = opportunitySection ? opportunitySection.innerHTML : document.body.innerHTML;

    // Try to find the lead/opportunity name
    const titleElement = document.querySelector('h1.pageType, h2.topName, .slds-page-header__title');
    const title = titleElement ? titleElement.textContent.trim() : '';

    return {
      text: bodyText,
      html: html,
      title: title,
      url: window.location.href
    };
  });

  console.log('Page scraped successfully. Title:', pageData.title);

  return pageData;
};
    `;

    // Call Browserless.io API with Puppeteer script
    console.log("Calling Browserless.io API...");
    const browserlessResponse = await fetch(
      `https://chrome.browserless.io/function?token=${browserlessApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: puppeteerScript,
          context: {},
        }),
      }
    );

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error("Browserless error:", browserlessResponse.status, errorText);
      throw new Error(`Browserless API error: ${errorText}`);
    }

    const scrapedData = await browserlessResponse.json();
    console.log("Scraped data received:", scrapedData.title || "No title");

    // Combine text and HTML for AI parsing
    const combinedContent = `Page Title: ${scrapedData.title}\n\nPage Content:\n${scrapedData.text}\n\nHTML Content:\n${scrapedData.html}`;

    // Call the parse-lead-data function to extract structured data
    console.log("Parsing lead data with AI...");
    const parseResponse = await fetch(
      `${supabaseUrl}/functions/v1/parse-lead-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          text: combinedContent,
        }),
      }
    );

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("Parse lead data error:", errorText);
      throw new Error(`Failed to parse lead data: ${errorText}`);
    }

    const parsedData = await parseResponse.json();
    console.log("Parsed lead data:", JSON.stringify(parsedData).substring(0, 200));

    // Store the lead in the database
    console.log("Creating lead in database...");
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        raw_data: scrapedData.text,
        parsed_data: parsedData,
        source: "salesforce_automation",
        salesforce_url: salesforceUrl,
        status: "new",
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      throw leadError;
    }

    console.log("Lead created successfully:", lead.id);

    // Trigger Make.com webhook if configured
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (makeWebhookUrl) {
      console.log("Triggering Make.com webhook...");
      try {
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            parsedData: parsedData,
            salesforceUrl: salesforceUrl,
          }),
        });
      } catch (webhookError) {
        console.error("Make.com webhook error:", webhookError);
        // Don't fail the whole request if webhook fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Salesforce lead scraped and processed successfully",
        leadId: lead.id,
        parsedData: parsedData,
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
    console.error("Error in scrape-salesforce-lead function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
