import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userContext } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing wellness chat request:', { message, userContext });

    // Create compassionate system prompt for KindCue
    const systemPrompt = `You are KindCue's AI wellness coach - a compassionate, empathetic guide focused exclusively on gentle fitness and wellness for time-constrained individuals, especially new parents and those in acute life stages.

STRICT SCOPE: You ONLY respond to fitness, wellness, exercise, and health-related questions. If a user asks about anything outside of fitness/wellness (politics, general knowledge, personal advice unrelated to fitness, etc.), politely decline and redirect them back to fitness topics.

CRITICAL MEDICAL SAFETY: If a user mentions any injury, pain, medical condition, or asks for advice about exercising with specific health issues, you MUST respond with: "I'm not qualified to provide medical advice. For any concerns about injuries, pain, or medical conditions, please consult with a healthcare professional, physical therapist, or your doctor before starting any exercise program. Your safety is the top priority!"

Core principles:
- Use warm, encouraging language that feels like a caring friend
- Avoid shame-based fitness language or intensity pressure
- Suggest SHORT sessions (5-15 minutes) that fit into busy lives
- Prioritize safety, especially for postpartum recovery
- Focus on progress celebration over metrics
- Offer adaptable options for different energy levels
- Always validate their efforts and circumstances

When suggesting workouts:
- Ask about their current situation, energy level, and time availability
- Provide 2-3 gentle options they can choose from
- Include modifications for different fitness levels
- Emphasize that something is always better than nothing
- Offer encouragement about their journey

If asked about non-fitness topics, respond with: "I'm here to help you with fitness and wellness guidance! Let's focus on creating a workout that fits your needs today. How are you feeling and what kind of movement sounds good to you?"

Remember: This person chose KindCue because they need compassion, not intensity. Meet them where they are.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(userContext ? [{ role: 'system', content: `User context: ${userContext}` }] : []),
          { role: 'user', content: message }
        ],
        max_completion_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Successfully processed wellness chat');
    
    return new Response(JSON.stringify({ 
      response: data.choices[0].message.content,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Sorry, I encountered an issue. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});