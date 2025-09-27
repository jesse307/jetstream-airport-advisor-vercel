import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  leadData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    trip_type: 'one-way' | 'round-trip';
    departure_airport: string;
    arrival_airport: string;
    departure_date: string;
    departure_time: string;
    return_date?: string;
    return_time?: string;
    passengers: number;
    notes?: string;
  };
  template?: string;
  flightAnalysis?: {
    distance: number;
    recommendedAircraft: string[];
    estimatedCost: string;
    flightTime: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData, template, flightAnalysis }: EmailGenerationRequest = await req.json();
    
    console.log('Generating email for lead:', leadData.first_name, leadData.last_name);

    // Function to replace template variables
    const replaceVariables = (text: string) => {
      return text
        .replace(/\{\{first_name\}\}/g, leadData.first_name)
        .replace(/\{\{last_name\}\}/g, leadData.last_name)
        .replace(/\{\{full_name\}\}/g, `${leadData.first_name} ${leadData.last_name}`)
        .replace(/\{\{email\}\}/g, leadData.email)
        .replace(/\{\{phone\}\}/g, leadData.phone)
        .replace(/\{\{trip_type\}\}/g, leadData.trip_type)
        .replace(/\{\{departure_airport\}\}/g, leadData.departure_airport)
        .replace(/\{\{arrival_airport\}\}/g, leadData.arrival_airport)
        .replace(/\{\{route\}\}/g, `${leadData.departure_airport} → ${leadData.arrival_airport}`)
        .replace(/\{\{departure_date\}\}/g, leadData.departure_date)
        .replace(/\{\{departure_time\}\}/g, leadData.departure_time)
        .replace(/\{\{return_date\}\}/g, leadData.return_date || 'N/A')
        .replace(/\{\{return_time\}\}/g, leadData.return_time || 'N/A')
        .replace(/\{\{passengers\}\}/g, leadData.passengers.toString())
        .replace(/\{\{notes\}\}/g, leadData.notes || 'No special notes');
    };

    let systemPrompt: string;
    let userPrompt: string;

    if (template) {
      // Use the provided template with AI enhancement
      const processedTemplate = replaceVariables(template);
      
      systemPrompt = `You are an expert private jet charter broker with 15+ years of experience. Take the provided email template and enhance it with professional pizazz while maintaining the original structure and personalization.

IMPORTANT GUIDELINES:
- Keep all the original personalized content and structure
- Add professional formatting with HTML
- Enhance the language to be more compelling and persuasive
- Add elegant styling while keeping it clean and readable
- Include appropriate paragraph breaks and formatting
- Make it sound more premium and luxury-focused
- Add subtle urgency and call-to-action elements
- Ensure it sounds personal, not template-like

The template has already been personalized with the customer's information. Your job is to make it shine with professional polish and compelling copy.`;

      userPrompt = `Please enhance this email template with professional pizazz and HTML formatting:

ORIGINAL TEMPLATE:
${processedTemplate}

${flightAnalysis ? `FLIGHT ANALYSIS (incorporate if relevant):
- Distance: ${flightAnalysis.distance} nautical miles
- Recommended Aircraft: ${flightAnalysis.recommendedAircraft.join(', ')}
- Estimated Flight Time: ${flightAnalysis.flightTime}
- Estimated Cost Range: ${flightAnalysis.estimatedCost}` : ''}

Transform this into a compelling, professionally formatted email that will convert this lead into a booking.`;
    } else {
      // Original AI generation logic
      systemPrompt = `You are an expert private jet charter broker with 15+ years of experience. Generate a professional, personalized email quote for a charter flight request.

IMPORTANT GUIDELINES:
- Use a warm, professional tone that builds trust
- Include specific flight details and aircraft recommendations
- Mention unique benefits of private jet travel
- Create urgency while remaining helpful
- Include next steps and contact information
- Use dynamic content based on the specific trip parameters

DYNAMIC CONTENT RULES:
- IF trip_type is "round-trip": Mention convenience of having aircraft wait vs repositioning costs
- IF passengers > 8: Recommend mid-size or heavy jets and mention group travel benefits  
- IF passengers <= 4: Mention efficiency of light jets for smaller groups
- IF distance > 2000nm: Discuss fuel stops and recommend long-range aircraft
- IF departure is within 7 days: Create urgency about aircraft availability
- IF trip includes weekend: Mention popularity of weekend travel and booking early
- IF departure/arrival airports are major hubs: Mention FBO options and service quality
- IF notes contain "business": Emphasize productivity benefits and wifi connectivity
- IF notes contain "leisure/vacation": Focus on comfort and luxury amenities

EMAIL STRUCTURE:
1. Personalized greeting with trip summary
2. Flight details and timing
3. Aircraft recommendations with specific benefits
4. Pricing indication (if analysis provided)
5. Value propositions specific to their trip
6. Next steps and urgency elements
7. Professional signature

Keep the tone conversational but expert. Avoid generic template language.`;

      userPrompt = `Generate a charter flight quote email for:

CLIENT: ${leadData.first_name} ${leadData.last_name}
EMAIL: ${leadData.email}
PHONE: ${leadData.phone}

TRIP DETAILS:
- Type: ${leadData.trip_type}
- Route: ${leadData.departure_airport} to ${leadData.arrival_airport}
- Departure: ${leadData.departure_date} at ${leadData.departure_time}
${leadData.return_date ? `- Return: ${leadData.return_date} at ${leadData.return_time}` : ''}
- Passengers: ${leadData.passengers}
${leadData.notes ? `- Special Notes: ${leadData.notes}` : ''}

${flightAnalysis ? `FLIGHT ANALYSIS:
- Distance: ${flightAnalysis.distance} nautical miles
- Recommended Aircraft: ${flightAnalysis.recommendedAircraft.join(', ')}
- Estimated Flight Time: ${flightAnalysis.flightTime}
- Estimated Cost Range: ${flightAnalysis.estimatedCost}` : ''}

Generate a compelling, personalized email that will convert this lead into a booking. Use HTML formatting for a professional appearance.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedEmail = data.choices[0].message.content;

    console.log('Email generated successfully');

    return new Response(JSON.stringify({ 
      email: generatedEmail,
      subject: `Private Jet Charter Quote - ${leadData.departure_airport} to ${leadData.arrival_airport}`,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-email function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});