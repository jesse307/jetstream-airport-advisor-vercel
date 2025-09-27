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
    capableAircraft?: Array<{
      category: string;
      examples: string[];
      hourlyRate: number;
      flightTime: string;
      estimatedCost: string;
      capable: boolean;
    }>;
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
        // Keep trip_type placeholder intact for frontend capitalization
        // .replace(/\{\{trip_type\}\}/g, leadData.trip_type)
        .replace(/\{\{departure_airport\}\}/g, leadData.departure_airport)
        .replace(/\{\{arrival_airport\}\}/g, leadData.arrival_airport)
        .replace(/\{\{route\}\}/g, `${leadData.departure_airport} → ${leadData.arrival_airport}`)
        // Keep date/time placeholders intact for frontend formatting
        // .replace(/\{\{departure_date\}\}/g, leadData.departure_date)
        // .replace(/\{\{departure_time\}\}/g, leadData.departure_time)
        // .replace(/\{\{return_date\}\}/g, leadData.return_date || 'N/A')
        // .replace(/\{\{return_time\}\}/g, leadData.return_time || 'N/A')
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

    // Function to create dynamic context for AI sections
    const createDynamicContext = () => {
      const context = [];

      // Flight analysis context
      if (flightAnalysis) {
        context.push(`Flight Distance: ${flightAnalysis.distance} nautical miles`);
        context.push(`Estimated Flight Time: ${flightAnalysis.flightTime}`);
        context.push(`Recommended Aircraft: ${flightAnalysis.recommendedAircraft.join(', ')}`);
        context.push(`Estimated Cost Range: ${flightAnalysis.estimatedCost}`);
        
        if (flightAnalysis.capableAircraft) {
          const aircraftDetails = flightAnalysis.capableAircraft.map(a => 
            `${a.category} (${a.examples.join(', ')}) - ${a.flightTime}, ${a.estimatedCost}`
          ).join('; ');
          context.push(`Capable Aircraft: ${aircraftDetails}`);
        }
      }

      // Trip context
      context.push(`Trip Type: ${leadData.trip_type}`);
      context.push(`Passengers: ${leadData.passengers}`);
      context.push(`Route: ${leadData.departure_airport} to ${leadData.arrival_airport}`);
      
      if (leadData.notes) {
        context.push(`Special Notes: ${leadData.notes}`);
      }

      return context.join('\n');
    };

    if (template) {
      // Process the template and find AI sections to enhance
      let processedTemplate = replaceVariables(template);
      
      // Find all {{AI: ...}} blocks
      const aiBlockRegex = /\{\{AI:\s*(.*?)\}\}/g;
      const aiBlocks = [];
      let match;
      
      while ((match = aiBlockRegex.exec(processedTemplate)) !== null) {
        aiBlocks.push({
          fullMatch: match[0],
          instruction: match[1].trim(),
          index: match.index
        });
      }
      
      if (aiBlocks.length === 0) {
        // No AI blocks found, return the processed template as-is
        return new Response(JSON.stringify({ 
          email: processedTemplate,
          subject: "Stratos Jets - Confirming Flight Details",
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Generate content for each AI block
      const dynamicContext = createDynamicContext();
      
      const systemPrompt = `You are an expert private jet charter broker with 15+ years of experience. You will be given specific instructions for enhancing parts of an email template. For each instruction, provide ONLY the requested content in plain text without any additional formatting, HTML, or extra explanations.

CONTEXT FOR THIS LEAD:
${dynamicContext}

IMPORTANT: 
- Only provide the specific content requested
- Keep responses concise and professional
- Do not add extra formatting or HTML
- Write in plain text only
- Be specific and accurate with aircraft recommendations
- Use industry expertise to provide valuable insights`;

      // Process each AI block
      for (const block of aiBlocks) {
        const userPrompt = `Please provide content for this instruction: "${block.instruction}"
        
Context: This is for a ${leadData.trip_type} flight from ${leadData.departure_airport} to ${leadData.arrival_airport} for ${leadData.passengers} passenger${leadData.passengers > 1 ? 's' : ''}.`;
        
        try {
          console.log('Processing AI block:', block.instruction);
          console.log('OpenAI API Key available:', !!openAIApiKey);
          
          const requestBody = {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 300,
          };
          
          console.log('Making OpenAI API request with:', JSON.stringify(requestBody));
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log('OpenAI response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            // Replace with placeholder if API fails
            processedTemplate = processedTemplate.replace(block.fullMatch, `[AI content failed for: ${block.instruction}]`);
            continue;
          }

          const data = await response.json();
          console.log('OpenAI response data:', JSON.stringify(data));
          
          const aiContent = data.choices?.[0]?.message?.content?.trim();
          console.log('AI Content generated:', aiContent);
          
          if (!aiContent) {
            console.error('No content in OpenAI response');
            processedTemplate = processedTemplate.replace(block.fullMatch, `[No content generated for: ${block.instruction}]`);
            continue;
          }
          
          // Replace the AI block with the generated content
          processedTemplate = processedTemplate.replace(block.fullMatch, aiContent);
          console.log('Replaced AI block successfully');
        } catch (error) {
          console.error('Error processing AI block:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          processedTemplate = processedTemplate.replace(block.fullMatch, `[Error: ${errorMessage}]`);
        }
      }
      
      return new Response(JSON.stringify({ 
        email: processedTemplate,
        subject: "Stratos Jets - Confirming Flight Details",
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Fallback: No template provided, return error
      return new Response(JSON.stringify({ 
        error: 'No template provided',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-email function:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});