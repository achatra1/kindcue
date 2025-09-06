import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutSessionProps {
  workoutTitle: string;
  workoutSuggestion: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const WorkoutSession = ({ 
  workoutTitle, 
  workoutSuggestion, 
  userId, 
  onComplete, 
  onCancel 
}: WorkoutSessionProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
  };

  const handleComplete = async () => {
    if (time < 60) {
      toast({
        title: "Workout too short",
        description: "Please workout for at least 1 minute before completing.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: workoutTitle || 'Custom Workout',
          duration: Math.floor(time / 60), // Convert to minutes
          notes: `Completed: ${workoutSuggestion.substring(0, 100)}...`,
          logged_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Workout completed! 🎉",
        description: `Great job! You worked out for ${formatTime(time)}.`,
      });

      onComplete();
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error saving workout",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Workout Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {workoutTitle || 'Your Workout'}
        </h3>
        <div className="flex items-center justify-center gap-2 text-2xl font-mono text-primary">
          <Clock className="h-6 w-6" />
          {formatTime(time)}
        </div>
      </div>

      {/* Workout Content */}
      <Card className="p-4 flex-1 overflow-y-auto">
        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {workoutSuggestion}
        </div>
      </Card>

      {/* Timer Controls */}
      <div className="flex gap-2 justify-center">
        {!isActive ? (
          <Button onClick={handleStart} className="gap-2">
            <Play className="h-4 w-4" />
            Start Workout
          </Button>
        ) : (
          <>
            <Button onClick={handlePause} variant="outline" className="gap-2 flex-1">
              <Pause className="h-4 w-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button onClick={handleStop} variant="outline" className="gap-2 flex-1">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Mark Complete Button - Always Visible */}
      <div className="flex justify-center">
        <Button 
          onClick={handleComplete}
          disabled={time < 60 || isSaving}
          className="gap-2 w-full"
        >
          <CheckCircle className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Mark Complete'}
        </Button>
      </div>


      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};