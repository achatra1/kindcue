import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Timer, Dumbbell, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVoiceWorkout } from '@/hooks/useVoiceWorkout';
import { supabase } from '@/integrations/supabase/client';

interface VoiceWorkoutSessionProps {
  workoutTitle: string;
  workoutSuggestion: string;
  workoutSummary?: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const VoiceWorkoutSession = ({ 
  workoutTitle, 
  workoutSuggestion, 
  workoutSummary,
  userId, 
  onComplete, 
  onCancel 
}: VoiceWorkoutSessionProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const {
    isConnected,
    isListening,
    currentExercise,
    exerciseTimer,
    restTimer,
    isResting,
    completedExercises,
    totalDuration,
    messages,
    connect,
    disconnect,
    startListening,
    stopListening,
    startWorkout,
    formatTime
  } = useVoiceWorkout();

  useEffect(() => {
    // Auto-save when workout completes
    if (hasStarted && completedExercises > 0 && !currentExercise && !isResting && totalDuration > 60) {
      handleWorkoutComplete();
    }
  }, [completedExercises, currentExercise, isResting, totalDuration, hasStarted]);

  const handleStartVoiceWorkout = async () => {
    try {
      await connect();
      toast({
        title: "Connecting to Maya",
        description: "Your voice workout assistant is getting ready...",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to voice assistant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBeginWorkout = async () => {
    if (!isConnected) return;
    
    try {
      await startListening();
      startWorkout(workoutSuggestion);
      setHasStarted(true);
      
      toast({
        title: "Workout started! 🎯",
        description: "Maya will guide you through your personalized workout.",
      });
    } catch (error) {
      toast({
        title: "Failed to start workout",
        description: "Please check microphone permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const handleWorkoutComplete = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      toast({
        title: "Amazing work! 🌟",
        description: `You completed your ${formatTime(totalDuration)} workout with Maya!`,
      });

      disconnect();
      onComplete();
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Error completing workout",
        description: "Your workout was great! Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndWorkout = () => {
    disconnect();
    onCancel();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isConnected && !hasStarted) {
    return (
      <div className="space-y-6 h-full flex flex-col items-center justify-center text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Meet Maya your voice coach
            </h3>
          </div>
        </div>

        <Card className="p-4 max-w-md">
          <h4 className="font-medium text-foreground mb-2">Your Workout Preview:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {workoutSuggestion.split('\n')
              .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
              .map((exercise, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{exercise.replace(/^[•-]\s*/, '')}</span>
                </div>
              ))
            }
          </div>
        </Card>

        <div className="flex gap-3 w-full max-w-md">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleStartVoiceWorkout}
            className="flex-1 gap-2"
          >
            <Phone className="h-4 w-4" />
            Start
          </Button>
        </div>
      </div>
    );
  }

  if (isConnected && !hasStarted) {
    return (
      <div className="space-y-6 h-full flex flex-col items-center justify-center text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Phone className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Maya is Ready!
            </h3>
            <p className="text-muted-foreground text-sm">
              Your voice coach is connected and ready to guide you through your workout.
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-md">
          <Button 
            variant="outline" 
            onClick={handleEndWorkout}
            className="flex-1 gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            Disconnect
          </Button>
          <Button 
            onClick={handleBeginWorkout}
            className="flex-1 gap-2"
          >
            <Timer className="h-4 w-4" />
            Begin Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Workout Status */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Voice Workout with Maya
        </h3>
        
        {/* Current Activity Display */}
        {isResting ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Rest Time</p>
            <div className="text-3xl font-mono text-orange-600">
              {formatTime(restTimer)}
            </div>
          </div>
        ) : currentExercise ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Exercise</p>
            <p className="font-medium text-foreground">{currentExercise.name}</p>
            <div className="text-3xl font-mono text-primary">
              {formatTime(exerciseTimer)}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Listening for Maya's guidance...
          </div>
        )}
      </div>


      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="p-3 flex-1 max-h-32 overflow-y-auto">
          <div className="text-xs text-muted-foreground space-y-1">
            {messages.slice(-3).map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="space-y-3 mt-auto">
        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            variant={isListening ? "default" : "outline"}
            className="w-16 h-16 rounded-full"
          >
            {isListening ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleEndWorkout}
            disabled={isSaving}
            className="flex-1"
          >
            End Workout
          </Button>
          {(completedExercises > 0 || totalDuration > 60) && (
            <Button 
              onClick={handleWorkoutComplete}
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              <Clock className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Complete'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};