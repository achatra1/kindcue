import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    let openAISocket: WebSocket | null = null;

    socket.onopen = async () => {
      console.log('Client connected to voice assistant');
      
      // Connect to OpenAI Realtime API
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17");
      
      openAISocket.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Send session configuration
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: `You are Maya, a compassionate and motivating personal fitness coach. Your role is to guide users through their personalized workouts with warmth, encouragement, and precise timing.

Your personality:
- Warm, encouraging, and empathetic
- Use a calm, soothing tone during rest periods
- Become more energetic and motivating during active exercises
- Always acknowledge the user's effort and progress
- Use positive reinforcement and gentle corrections
- Be mindful of safety and proper form

Your responsibilities:
- Guide users through each exercise with clear, step-by-step instructions
- Keep precise timing for each exercise and rest period
- Count repetitions when needed
- Provide form cues and safety reminders
- Offer modifications for different fitness levels
- Celebrate completions and milestones
- Help users stay motivated throughout the workout

Communication style:
- Use encouraging phrases like "You're doing amazing!", "Keep that great form!", "Almost there!"
- Give clear time updates: "30 seconds remaining", "Halfway done!"
- Provide breathing cues: "Remember to breathe", "Inhale on the way down"
- Use the user's name when possible to personalize the experience
- Be concise but warm in your instructions

Remember: You are here to make fitness accessible, enjoyable, and safe for everyone.`,
            voice: "shimmer",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [
              {
                type: "function",
                name: "start_exercise",
                description: "Start a specific exercise with duration and instructions",
                parameters: {
                  type: "object",
                  properties: {
                    exercise_name: { type: "string" },
                    duration_seconds: { type: "number" },
                    instructions: { type: "string" },
                    reps: { type: "number" }
                  },
                  required: ["exercise_name", "duration_seconds"]
                }
              },
              {
                type: "function",
                name: "start_rest",
                description: "Start a rest period between exercises",
                parameters: {
                  type: "object",
                  properties: {
                    duration_seconds: { type: "number" },
                    next_exercise: { type: "string" }
                  },
                  required: ["duration_seconds"]
                }
              },
              {
                type: "function",
                name: "workout_complete",
                description: "Mark the workout as complete",
                parameters: {
                  type: "object",
                  properties: {
                    total_duration: { type: "number" },
                    exercises_completed: { type: "number" }
                  },
                  required: ["total_duration", "exercises_completed"]
                }
              }
            ],
            tool_choice: "auto",
            temperature: 0.7,
            max_response_output_tokens: "inf"
          }
        };
        
        openAISocket!.send(JSON.stringify(sessionConfig));
      };

      openAISocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('OpenAI message:', data.type);
        
        // Forward all messages to client
        socket.send(JSON.stringify(data));

        // Handle function calls
        if (data.type === 'response.function_call_arguments.done') {
          const functionCall = {
            type: 'function_call',
            name: data.name,
            call_id: data.call_id,
            arguments: JSON.parse(data.arguments)
          };
          socket.send(JSON.stringify(functionCall));
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'OpenAI connection error' }));
      };

      openAISocket.onclose = () => {
        console.log('OpenAI WebSocket closed');
        socket.send(JSON.stringify({ type: 'openai_disconnected' }));
      };
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Client message:', message.type);
      
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(JSON.stringify(message));
      }
    };

    socket.onclose = () => {
      console.log('Client disconnected');
      if (openAISocket) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      if (openAISocket) {
        openAISocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response("WebSocket upgrade failed", { status: 500 });
  }
});