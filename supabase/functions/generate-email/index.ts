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

    // Function to replace template variables with conditional logic
    const replaceVariables = (text: string) => {
      let processedText = text
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

      // Process conditional logic blocks
      processedText = processConditionals(processedText);
      
      return processedText;
    };

    // Function to process conditional logic in templates
    const processConditionals = (text: string) => {
      let processedText = text;

      // Handle {{IF condition}} ... {{ENDIF}} blocks
      const conditionalRegex = /\{\{IF\s+([^}]+)\}\}([\s\S]*?)\{\{ENDIF\}\}/g;
      
      processedText = processedText.replace(conditionalRegex, (match, condition, content) => {
        const shouldInclude = evaluateCondition(condition.trim());
        return shouldInclude ? content : '';
      });

      // Handle {{IF condition}} ... {{ELSE}} ... {{ENDIF}} blocks
      const conditionalElseRegex = /\{\{IF\s+([^}]+)\}\}([\s\S]*?)\{\{ELSE\}\}([\s\S]*?)\{\{ENDIF\}\}/g;
      
      processedText = processedText.replace(conditionalElseRegex, (match, condition, ifContent, elseContent) => {
        const shouldInclude = evaluateCondition(condition.trim());
        return shouldInclude ? ifContent : elseContent;
      });

      return processedText;
    };

    // Function to evaluate conditions in templates
    const evaluateCondition = (condition: string): boolean => {
      // Handle missing departure_time
      if (condition === 'missing_departure_time') {
        return !leadData.departure_time || leadData.departure_time.trim() === '';
      }
      
      // Handle missing return_time for round trips
      if (condition === 'missing_return_time_roundtrip') {
        return leadData.trip_type === 'round-trip' && (!leadData.return_time || leadData.return_time.trim() === '');
      }

      // Handle passenger count conditions
      if (condition.includes('passengers_')) {
        const match = condition.match(/passengers_(gt|lt|gte|lte|eq)_(\d+)/);
        if (match) {
          const operator = match[1];
          const value = parseInt(match[2]);
          const passengerCount = leadData.passengers;
          
          switch (operator) {
            case 'gt': return passengerCount > value;
            case 'lt': return passengerCount < value;
            case 'gte': return passengerCount >= value;
            case 'lte': return passengerCount <= value;
            case 'eq': return passengerCount === value;
          }
        }
      }

      // Handle trip type conditions
      if (condition === 'is_roundtrip') {
        return leadData.trip_type === 'round-trip';
      }
      if (condition === 'is_oneway') {
        return leadData.trip_type === 'one-way';
      }

      // Handle notes conditions
      if (condition === 'has_notes') {
        return !!(leadData.notes && leadData.notes.trim() !== '');
      }
      if (condition.includes('notes_contains_')) {
        const searchTerm = condition.replace('notes_contains_', '').toLowerCase();
        return !!(leadData.notes && leadData.notes.toLowerCase().includes(searchTerm));
      }

      return false;
    };

    // Function to create dynamic AI prompts based on flight analysis
    const createDynamicPrompts = () => {
      const prompts = [];

      // Range-based prompts
      if (flightAnalysis && flightAnalysis.distance) {
        const distance = flightAnalysis.distance;
        if (distance > 2000) {
          prompts.push("LONG_RANGE: This is a long-range flight over 2000nm. Emphasize fuel stops, crew rest requirements, and recommend long-range aircraft. Mention the comfort benefits for extended flights.");
        } else if (distance > 1000) {
          prompts.push("MEDIUM_RANGE: This is a medium-range flight (1000-2000nm). Focus on efficiency and recommend mid-size jets. Highlight time savings compared to commercial flights.");
        } else {
          prompts.push("SHORT_RANGE: This is a short-range flight under 1000nm. Emphasize quick turnarounds, efficiency of light jets, and convenience for business trips.");
        }
      }

      // Aircraft-specific prompts
      if (flightAnalysis && flightAnalysis.recommendedAircraft) {
        const aircraft = flightAnalysis.recommendedAircraft;
        if (aircraft.some(a => a.toLowerCase().includes('heavy') || a.toLowerCase().includes('gulfstream') || a.toLowerCase().includes('falcon'))) {
          prompts.push("HEAVY_JET: Recommended aircraft includes heavy jets. Emphasize luxury amenities, spacious cabins, long-range capabilities, and premium service.");
        } else if (aircraft.some(a => a.toLowerCase().includes('very light') || a.toLowerCase().includes('eclipse') || a.toLowerCase().includes('vlj'))) {
          prompts.push("VERY_LIGHT_JET: Recommended aircraft includes very light jets. Focus on exceptional efficiency, cost-effectiveness, perfect for short trips, and ideal for 1-6 passengers. Emphasize speed of booking and minimal airport requirements.");
        } else if (aircraft.some(a => a.toLowerCase().includes('super light') || a.toLowerCase().includes('cj4') || a.toLowerCase().includes('300e'))) {
          prompts.push("SUPER_LIGHT_JET: Recommended aircraft includes super light jets. Perfect balance of efficiency and performance, ideal for 7-9 passengers with longer range capabilities than light jets. Emphasize the sweet spot between cost and comfort.");
        } else if (aircraft.some(a => a.toLowerCase().includes('citation') || a.toLowerCase().includes('phenom') || a.toLowerCase().includes('light'))) {
          prompts.push("LIGHT_JET: Recommended aircraft includes light jets. Focus on efficiency, cost-effectiveness, and perfect size for smaller groups.");
        }
      }

      // Passenger-based prompts
      if (leadData.passengers >= 1 && leadData.passengers <= 6) {
        prompts.push("VERY_LIGHT_IDEAL: This passenger count (1-6) is ideal for very light jets. Emphasize the cost efficiency, quick turnarounds, and access to smaller airports that larger aircraft cannot reach.");
      } else if (leadData.passengers >= 7 && leadData.passengers <= 9) {
        prompts.push("SUPER_LIGHT_IDEAL: This passenger count (7-9) is perfect for super light jets. Emphasize the sweet spot between efficiency and performance, offering more range than light jets while maintaining cost-effectiveness.");
      } else if (leadData.passengers > 10) {
        prompts.push("LARGE_GROUP: This is a large group (10+ passengers). Emphasize group travel benefits, spacious cabins, and the ability to keep the team together. Mention cost-per-person advantages.");
      }

      // Urgency-based prompts
      const departureDate = new Date(leadData.departure_date);
      const today = new Date();
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysUntilDeparture <= 7) {
        prompts.push("URGENT: Departure is within 7 days. Create urgency about aircraft availability and emphasize your ability to handle last-minute requests.");
      } else if (daysUntilDeparture > 30) {
        prompts.push("ADVANCE_BOOKING: This is advance booking (30+ days). Mention early booking advantages, better aircraft availability, and potential cost savings.");
      }

      // Notes-based prompts
      if (leadData.notes) {
        const notesLower = leadData.notes.toLowerCase();
        if (notesLower.includes('business') || notesLower.includes('meeting') || notesLower.includes('conference')) {
          prompts.push("BUSINESS_TRAVEL: This appears to be business travel. Emphasize productivity benefits, wifi connectivity, mobile office capabilities, and professional service.");
        }
        if (notesLower.includes('leisure') || notesLower.includes('vacation') || notesLower.includes('family') || notesLower.includes('holiday')) {
          prompts.push("LEISURE_TRAVEL: This appears to be leisure travel. Focus on comfort, luxury amenities, relaxation benefits, and making their vacation start the moment they board.");
        }
      }

      return prompts;
    };

    let systemPrompt: string;
    let userPrompt: string;

    if (template) {
      // Use the provided template with AI enhancement
      const processedTemplate = replaceVariables(template);
      const dynamicPrompts = createDynamicPrompts();
      
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

DYNAMIC CONTEXT FOR THIS SPECIFIC LEAD:
${dynamicPrompts.length > 0 ? dynamicPrompts.join('\n') : 'No specific dynamic context available.'}

The template has already been personalized with the customer's information and processed conditional logic. Your job is to make it shine with professional polish and compelling copy that incorporates the dynamic context above.`;

      userPrompt = `Please enhance this email template with professional pizazz and HTML formatting:

ORIGINAL TEMPLATE:
${processedTemplate}

${flightAnalysis ? `FLIGHT ANALYSIS (incorporate if relevant):
- Distance: ${flightAnalysis.distance} nautical miles
- Recommended Aircraft: ${flightAnalysis.recommendedAircraft.join(', ')}
- Estimated Flight Time: ${flightAnalysis.flightTime}
- Estimated Cost Range: ${flightAnalysis.estimatedCost}` : ''}

Transform this into a compelling, professionally formatted email that will convert this lead into a booking. Use the dynamic context provided in the system prompt to make it highly relevant and persuasive.`;
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