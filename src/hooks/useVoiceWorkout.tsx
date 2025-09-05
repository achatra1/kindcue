import { useState, useRef, useCallback } from 'react';
import { AudioRecorder, AudioQueue, encodeAudioForAPI } from '@/utils/voiceUtils';

interface Exercise {
  name: string;
  duration: number;
  instructions: string;
  reps?: number;
}

interface VoiceWorkoutState {
  isConnected: boolean;
  isListening: boolean;
  currentExercise: Exercise | null;
  exerciseTimer: number;
  restTimer: number;
  isResting: boolean;
  completedExercises: number;
  totalDuration: number;
  messages: string[];
}

export const useVoiceWorkout = () => {
  const [state, setState] = useState<VoiceWorkoutState>({
    isConnected: false,
    isListening: false,
    currentExercise: null,
    exerciseTimer: 0,
    restTimer: 0,
    isResting: false,
    completedExercises: 0,
    totalDuration: 0,
    messages: []
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext();
      audioQueueRef.current = new AudioQueue(audioContextRef.current);

      // Connect to voice assistant WebSocket
      wsRef.current = new WebSocket('wss://qbzaiixsalxkoaguqbfo.functions.supabase.co/voice-workout-assistant');

      wsRef.current.onopen = () => {
        console.log('Connected to voice workout assistant');
        setState(prev => ({ ...prev, isConnected: true }));
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Voice assistant message:', data);

        switch (data.type) {
          case 'session.created':
            console.log('Voice session created');
            break;

          case 'response.audio.delta':
            if (audioQueueRef.current && data.delta) {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await audioQueueRef.current.addToQueue(bytes);
            }
            break;

          case 'response.audio_transcript.delta':
            if (data.delta) {
              setState(prev => ({
                ...prev,
                messages: [...prev.messages.slice(-4), data.delta]
              }));
            }
            break;

          case 'function_call':
            handleFunctionCall(data);
            break;

          default:
            console.log('Unhandled message type:', data.type);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setState(prev => ({ ...prev, isConnected: false }));
      };

      // Initialize audio recorder
      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

    } catch (error) {
      console.error('Error connecting to voice assistant:', error);
      throw error;
    }
  }, []);

  const handleFunctionCall = (data: any) => {
    const { name, arguments: args } = data;

    switch (name) {
      case 'start_exercise':
        startExerciseTimer(args);
        break;
      case 'start_rest':
        startRestTimer(args);
        break;
      case 'workout_complete':
        completeWorkout(args);
        break;
    }
  };

  const startExerciseTimer = (args: any) => {
    const exercise: Exercise = {
      name: args.exercise_name,
      duration: args.duration_seconds,
      instructions: args.instructions || '',
      reps: args.reps
    };

    setState(prev => ({
      ...prev,
      currentExercise: exercise,
      exerciseTimer: exercise.duration,
      isResting: false
    }));

    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }

    exerciseTimerRef.current = setInterval(() => {
      setState(prev => {
        const newTimer = prev.exerciseTimer - 1;
        if (newTimer <= 0) {
          if (exerciseTimerRef.current) {
            clearInterval(exerciseTimerRef.current);
            exerciseTimerRef.current = null;
          }
          return {
            ...prev,
            exerciseTimer: 0,
            completedExercises: prev.completedExercises + 1,
            totalDuration: prev.totalDuration + exercise.duration
          };
        }
        return { ...prev, exerciseTimer: newTimer };
      });
    }, 1000);
  };

  const startRestTimer = (args: any) => {
    const restDuration = args.duration_seconds;

    setState(prev => ({
      ...prev,
      restTimer: restDuration,
      isResting: true,
      currentExercise: null
    }));

    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    restTimerRef.current = setInterval(() => {
      setState(prev => {
        const newTimer = prev.restTimer - 1;
        if (newTimer <= 0) {
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
          }
          return {
            ...prev,
            restTimer: 0,
            isResting: false,
            totalDuration: prev.totalDuration + restDuration
          };
        }
        return { ...prev, restTimer: newTimer };
      });
    }, 1000);
  };

  const completeWorkout = (args: any) => {
    setState(prev => ({
      ...prev,
      currentExercise: null,
      isResting: false,
      totalDuration: args.total_duration,
      completedExercises: args.exercises_completed
    }));

    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
      exerciseTimerRef.current = null;
    }
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
  };

  const startListening = useCallback(async () => {
    if (!audioRecorderRef.current) return;

    try {
      await audioRecorderRef.current.start();
      setState(prev => ({ ...prev, isListening: true }));
    } catch (error) {
      console.error('Error starting audio recorder:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: message }]
        }
      }));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  const startWorkout = useCallback((workoutPlan: string) => {
    const message = `Hi Maya! I'm ready to start my workout. Here's my personalized workout plan: ${workoutPlan}. Please guide me through each exercise with proper timing and encouragement. Make sure we finish in the planned time.`;
    sendMessage(message);
  }, [sendMessage]);

  const disconnect = useCallback(() => {
    stopListening();
    
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      isConnected: false,
      isListening: false,
      currentExercise: null,
      exerciseTimer: 0,
      restTimer: 0,
      isResting: false,
      completedExercises: 0,
      totalDuration: 0,
      messages: []
    });
  }, [stopListening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendMessage,
    startWorkout,
    formatTime
  };
};