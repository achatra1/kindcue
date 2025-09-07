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

    console.log('Processing wellness chat request with custom assistant:', { message, userContext, assistantId });

    // Create a new thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.json();
      console.error('Thread creation error:', error);
      throw new Error(`Thread creation error: ${error.error?.message || 'Unknown error'}`);
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;

    // Add user message to thread (include user context if provided)
    const fullMessage = userContext ? `${message}\n\nUser context: ${userContext}` : message;
    
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: fullMessage,
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      console.error('Message creation error:', error);
      throw new Error(`Message creation error: ${error.error?.message || 'Unknown error'}`);
    }

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.json();
      console.error('Run creation error:', error);
      throw new Error(`Run creation error: ${error.error?.message || 'Unknown error'}`);
    }

    const run = await runResponse.json();
    const runId = run.id;

    // Poll for completion
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait time
    
    while (runStatus === 'in_progress' || runStatus === 'queued') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant response timed out');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        console.error('Run status error:', error);
        throw new Error(`Run status error: ${error.error?.message || 'Unknown error'}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
      
      console.log(`Run status: ${runStatus}, attempt: ${attempts}`);
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // Get the assistant's response
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.json();
      console.error('Messages retrieval error:', error);
      throw new Error(`Messages retrieval error: ${error.error?.message || 'Unknown error'}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }

    const assistantResponse = assistantMessages[0].content[0].text.value;
    console.log('Successfully processed wellness chat with custom assistant');
    
    return new Response(JSON.stringify({ 
      response: assistantResponse,
      threadId: threadId // Return thread ID for potential follow-up conversations
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