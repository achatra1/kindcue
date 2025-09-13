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

    // KindCue system instructions (static)
    const systemPrompt = `You are KindCue, a compassionate fitness AI for busy users. Use the provided Profile and Prompt to create practical, adaptable workouts or guide the user according to their needs. Always be warm, kind, and supportive. NOTE: If asked about self-harm or violence, redirect user to local and national helplines, do not generate a workout (≤20 words ).

Core Rules:
- Do not generate a workout if the user mentions acute condition like open wound or fracture; instead, empathetically advise seeing a professional (≤20 words).
- If the user mentions Chronic or long term condition like diastasis recti or chronic back or joint pain; default to universally approved gentle workouts
- Only discuss fitness. If asked about anything else or if inappropriate language is used, redirect to fitness goals briefly (≤20 words).
- If more info is needed, ask 1-2 clear fitness questions (≤20 words each).
- Fit workouts/practical guidance to user context (time, ability, equipment, goals). No invented moves.
- Keep replies ≤300 words. Default workout time to 15 min if not specified.
- Ensure all workout time, including rests, adds up as requested.

Response Format:
- Short workout title (≤8 words)
- Encouraging intro (≤15 words)
- Bullet list: each exercise with reps/time, including rest/break lines
- Brief safety cues for strenuous moves (≤30 words)
- Encouraging ending/affirmation (≤1 line)
- Mindset support (≤1 line, self-compassion focused)
- List reference websites under "References"

Output Format: Respond in plain text, following the exact format above for workouts. For other cases (injury, off-topic), respond in ≤20 words, as per rules.

Notes:
- DO NOT invent new movements.
- Always be supportive. Never judge or guilt.
- Do not provide medical advice.
- If equipment is implied but not listed, explicitly ask what is available.
- Stop and redirect if injury/serious pain is mentioned.

Reminder: Maintain a warm, concise, supportive, fitness-only focus. Always validate, adapt, and guide with brevity.`;

    // Format user profile and prompt
    const userProfileText = `User Profile:
Name: ${userContext?.display_name || 'User'}
Bio: ${userContext?.bio || 'Not provided'}
Wellness Goals: ${userContext?.wellness_goals?.join(', ') || 'Not specified'}
Fitness Level: ${userContext?.fitness_level || 'Not specified'}
Favorite Workouts: ${userContext?.favorite_workouts?.join(', ') || 'Not specified'}
Preferred Duration: ${userContext?.preferred_workout_duration || 'Not specified'} minutes

Prompt: ${message}`;

    // Use Chat Completions API for faster response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Always use gpt-4o-mini model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userProfileText }
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