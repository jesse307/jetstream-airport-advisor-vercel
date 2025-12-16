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
export default async function ({ page }) {
  const username = '${salesforceUsername}';
  const password = '${salesforcePassword}';
  const targetUrl = '${salesforceUrl}';
  const loginUrl = 'https://fms.stratosjets.com';

  console.log('Navigating to Salesforce URL:', targetUrl);

  // Navigate to the Salesforce URL
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  // Check if we need to log in (check for redirect to login page or login form)
  const needsLogin = await page.evaluate(() => {
    return document.querySelector('input[type="password"]') !== null ||
           document.querySelector('input[name="username"]') !== null ||
           document.querySelector('input[id="username"]') !== null ||
           window.location.href.includes('login') ||
           window.location.href === 'https://fms.stratosjets.com/' ||
           window.location.href === 'https://fms.stratosjets.com';
  });

  if (needsLogin) {
    console.log('Login required, authenticating to fms.stratosjets.com...');
    console.log('Current URL:', page.url());

    // If we're on the lead page but need login, we were redirected - navigate to login
    const currentUrl = page.url();
    if (currentUrl.includes('/s/lead') || currentUrl === targetUrl) {
      console.log('Redirected from lead page, navigating to login...');
      await page.goto(loginUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Wait for page to settle and check what fields are available
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Debug: log what we find on the page
    const pageInfo = await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input')).map(inp => ({
        type: inp.type,
        name: inp.name,
        id: inp.id,
        placeholder: inp.placeholder
      }));
      return {
        url: window.location.href,
        title: document.title,
        inputs: allInputs
      };
    });
    console.log('Page info:', JSON.stringify(pageInfo));

    // Try to find and fill the login form
    try {
      // Wait for any input field to appear
      await page.waitForSelector('input', { timeout: 10000 });

      // Type username - try different approaches
      const usernameTyped = await page.evaluate((user) => {
        const usernameInput = document.querySelector('input[name="username"]') ||
                              document.querySelector('input[type="email"]') ||
                              document.querySelector('input[id="username"]') ||
                              document.querySelector('input[type="text"]');
        if (usernameInput) {
          usernameInput.value = user;
          usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
          usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, username);

      if (!usernameTyped) {
        throw new Error('Could not find username field');
      }

      // Type password
      const passwordTyped = await page.evaluate((pass) => {
        const passwordInput = document.querySelector('input[name="pw"]') ||
                              document.querySelector('input[type="password"]') ||
                              document.querySelector('input[id="password"]');
        if (passwordInput) {
          passwordInput.value = pass;
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, password);

      if (!passwordTyped) {
        throw new Error('Could not find password field');
      }

      // Click login button
      await new Promise(resolve => setTimeout(resolve, 500));

      const buttonClicked = await page.evaluate(() => {
        const button = document.querySelector('input[type="submit"]') ||
                       document.querySelector('button[type="submit"]') ||
                       document.querySelector('input[name="Login"]') ||
                       document.querySelector('button[name="Login"]') ||
                       document.querySelector('button') ||
                       document.querySelector('input[type="button"]');
        if (button) {
          button.click();
          return true;
        }
        return false;
      });

      if (!buttonClicked) {
        throw new Error('Could not find login button');
      }

      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
      console.log('Login successful, current URL:', page.url());

      // Navigate to the target URL if we're not already there
      if (page.url() !== targetUrl) {
        console.log('Navigating to target URL after login...');
        await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      }
    } catch (loginError) {
      console.error('Login error:', loginError.message);
      throw new Error(\`Failed to login: \${loginError.message}\`);
    }
  } else {
    console.log('Already authenticated or no login required');
  }

  // Wait for page to load completely
  await new Promise(resolve => setTimeout(resolve, 3000));

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

  return {
    data: pageData,
    type: 'application/json'
  };
}
    `;

    // Call Browserless.io API with Puppeteer script
    console.log("Calling Browserless.io API...");
    const browserlessResponse = await fetch(
      `https://chrome.browserless.io/function?token=${browserlessApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/javascript",
        },
        body: puppeteerScript,
      }
    );

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error("Browserless error:", browserlessResponse.status, errorText);
      throw new Error(`Browserless API error: ${errorText}`);
    }

    const browserlessResult = await browserlessResponse.json();
    const scrapedData = browserlessResult.data || browserlessResult;
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
          unstructuredData: combinedContent,
        }),
      }
    );

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("Parse lead data error:", errorText);
      throw new Error(`Failed to parse lead data: ${errorText}`);
    }

    const parsedData = await parseResponse.json();
    console.log("Parsed lead data:", JSON.stringify(parsedData));

    // Store the lead in the database using the parsed data
    console.log("Creating lead in database...");

    // Map the parsed data to the leads table schema
    // Normalize trip_type to match allowed values ('one-way' or 'round-trip')
    let tripType = parsedData.trip_type || parsedData.tripType || "";
    console.log("Original trip_type value:", tripType);

    if (typeof tripType === 'string') {
      tripType = tripType.toLowerCase().trim().replace(/[\s_]+/g, '-');
    }

    // Ensure it's one of the allowed values
    if (tripType !== 'one-way' && tripType !== 'round-trip') {
      // Default to one-way unless there's a return date
      tripType = (parsedData.return_date || parsedData.returnDate) ? 'round-trip' : 'one-way';
    }

    console.log("Normalized trip_type:", tripType);

    // Build lead data object with proper type checking
    const leadData: any = {
      first_name: parsedData.first_name || parsedData.firstName || "Unknown",
      last_name: parsedData.last_name || parsedData.lastName || "Unknown",
      email: parsedData.email || "unknown@example.com",
      phone: parsedData.phone || parsedData.phoneNumber || null,
      departure_airport: parsedData.departure_airport || parsedData.departureAirport || "TBD",
      arrival_airport: parsedData.arrival_airport || parsedData.arrivalAirport || "TBD",
      departure_date: parsedData.departure_date || parsedData.departureDate || new Date().toISOString().split('T')[0],
      departure_time: parsedData.departure_time || parsedData.departureTime || null,
      return_date: parsedData.return_date || parsedData.returnDate || null,
      return_time: parsedData.return_time || parsedData.returnTime || null,
      passengers: parsedData.passengers || 1,
      status: "new",
      notes: `Imported from Salesforce\nOriginal URL: ${salesforceUrl}\nRaw Title: ${scrapedData.title}\n\nRaw Data:\n${scrapedData.text.substring(0, 500)}...`,
      analysis_data: {
        salesforce_url: salesforceUrl,
        scraped_at: new Date().toISOString(),
        parsed_data: parsedData,
        raw_title: scrapedData.title
      },
      source_url: salesforceUrl
    };

    // Set trip_type - must be 'One Way' or 'Round Trip' (title case with spaces)
    if (tripType === 'round-trip' || tripType === 'Round Trip') {
      leadData.trip_type = 'Round Trip';
    } else {
      leadData.trip_type = 'One Way';
    }

    console.log("Lead data to insert:", JSON.stringify(leadData).substring(0, 500));
    console.log("Final trip_type value:", leadData.trip_type, "Type:", typeof leadData.trip_type);
    console.log("All lead data keys:", Object.keys(leadData));

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      console.error("Lead error details:", JSON.stringify(leadError));
      throw leadError;
    }

    console.log("Lead created successfully:", lead.id);

    // Trigger Make.com webhook if configured
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (makeWebhookUrl) {
      console.log("Triggering Make.com webhook...");
      try {
        const webhookPayload = {
          // Lead identification
          leadId: lead.id,
          source: "salesforce",
          salesforceUrl: salesforceUrl,
          createdAt: lead.created_at,

          // Client information
          client: {
            firstName: lead.first_name,
            lastName: lead.last_name,
            fullName: `${lead.first_name} ${lead.last_name}`,
            email: lead.email,
            phone: lead.phone,
          },

          // Trip details
          trip: {
            type: lead.trip_type,
            departureAirport: lead.departure_airport,
            arrivalAirport: lead.arrival_airport,
            departureDate: lead.departure_date,
            departureTime: lead.departure_time,
            returnDate: lead.return_date,
            returnTime: lead.return_time,
            passengers: lead.passengers,
          },

          // Additional data
          status: lead.status,
          notes: lead.notes,

          // Raw parsed data for reference
          rawParsedData: parsedData.parsedData || parsedData,
        };

        console.log("Sending webhook payload:", JSON.stringify(webhookPayload).substring(0, 300));

        const webhookResponse = await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        if (webhookResponse.ok) {
          console.log("Make.com webhook triggered successfully");
        } else {
          console.error("Make.com webhook failed:", webhookResponse.status, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Make.com webhook error:", webhookError);
        // Don't fail the whole request if webhook fails
      }
    } else {
      console.log("No MAKE_WEBHOOK_URL configured, skipping webhook");
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
