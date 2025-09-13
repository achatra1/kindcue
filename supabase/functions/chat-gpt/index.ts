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
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    if (!assistantId) {
      throw new Error('OpenAI Assistant ID not configured');
    }

    console.log('Processing wellness chat request:', { message, userContext });

    // Create system prompt with user context
    const systemPrompt = `You are a personalized wellness assistant. Here's the user's profile:
Name: ${userContext?.name || 'User'}
Bio: ${userContext?.bio || 'Not provided'}
Wellness Goals: ${userContext?.wellness_goals?.join(', ') || 'Not specified'}
Fitness Level: ${userContext?.fitness_level || 'Not specified'}
Favorite Workouts: ${userContext?.favorite_workouts?.join(', ') || 'Not specified'}
Preferred Duration: ${userContext?.preferred_workout_duration || 'Not specified'} minutes

Provide personalized workout suggestions based on their profile and current feelings.`;

    // Use Chat Completions API for faster response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;
    
    console.log('Successfully processed wellness chat');
    
    return new Response(JSON.stringify({ 
      response: assistantResponse
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