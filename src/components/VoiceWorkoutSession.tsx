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
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const VoiceWorkoutSession = ({ 
  workoutTitle, 
  workoutSuggestion, 
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
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: workoutTitle || 'Voice-Guided Workout',
          duration: Math.floor(totalDuration / 60),
          notes: `Voice-guided workout with Maya. Completed ${completedExercises} exercises.`,
          logged_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Amazing work! 🌟",
        description: `You completed your ${formatTime(totalDuration)} workout with Maya!`,
      });

      disconnect();
      onComplete();
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error saving workout",
        description: "Your workout was great, but we couldn't save it. Please try again.",
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
              Meet Maya, Your Voice Coach
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Maya will guide you through your personalized workout with real-time coaching, 
              precise timing, and motivational support.
            </p>
          </div>
        </div>

        <Card className="p-4 max-w-md">
          <h4 className="font-medium text-foreground mb-2">Your Workout Preview:</h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {workoutTitle}
          </p>
        </Card>

        <div className="flex gap-3 w-full max-w-md">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Back to Text
          </Button>
          <Button 
            onClick={handleStartVoiceWorkout}
            className="flex-1 gap-2"
          >
            <Phone className="h-4 w-4" />
            Connect to Maya
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

      {/* Workout Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-foreground">{completedExercises}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{formatTime(totalDuration)}</div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {isListening ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-muted-foreground">Microphone</div>
          </div>
        </div>
      </Card>

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