import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, Clock, CheckCircle, Heart, Star } from 'lucide-react';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [moodRating, setMoodRating] = useState(0);
  const [workoutRating, setWorkoutRating] = useState(0);
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

  const handleMarkComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    setShowFeedback(true);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save to activity logs
      const { error: activityError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: workoutTitle || 'Custom Workout',
          duration: Math.floor(time / 60), // Convert to minutes
          notes: `Mood: ${moodRating}/5, Effectiveness: ${workoutRating}/5 - ${workoutSuggestion.substring(0, 50)}...`,
          logged_at: new Date().toISOString()
        });

      if (activityError) {
        throw activityError;
      }

      // Save to favorites if marked as favorite
      if (isFavorite) {
        // First check if this workout already exists in favorites
        const { data: existingFavorite, error: checkError } = await supabase
          .from('favorite_workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('workout_title', workoutTitle || 'Custom Workout')
          .eq('workout_content', workoutSuggestion)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing favorites:', checkError);
        }

        if (existingFavorite) {
          toast({
            title: "Already in favorites! ⭐",
            description: "This workout is already saved in your favorites.",
            variant: "default",
          });
        } else {
          // Insert new favorite
          const { error: favoriteError } = await supabase
            .from('favorite_workouts')
            .insert({
              user_id: userId,
              workout_title: workoutTitle || 'Custom Workout',
              workout_content: workoutSuggestion,
              workout_duration: Math.floor(time / 60)
            });

          if (favoriteError) {
            console.error('Error saving favorite:', favoriteError);
            toast({
              title: "Error saving favorite",
              description: "Please try again.",
              variant: "destructive",
            });
          } else {
            // Check if we reached the limit (the trigger handles deletion automatically)
            const { data: favoriteCount } = await supabase
              .from('favorite_workouts')
              .select('id', { count: 'exact' })
              .eq('user_id', userId);

            if (favoriteCount && favoriteCount.length >= 8) {
              toast({
                title: "Added to favorites! 🌟",
                description: "Your oldest favorite was removed to make room (8 max).",
              });
            } else {
              toast({
                title: "Added to favorites! 🌟",
                description: "You can find this workout in your Quick Start favorites.",
              });
            }
          }
        }
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
          {workoutSuggestion
            .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
            .replace(/\*\*References?\*\*:.*$/im, '') // Remove references section
            .trim()
          }
        </div>
      </Card>

      {/* Timer Controls */}
      <div className="space-y-3">
        {!isActive ? (
          <div className="flex justify-center">
            <Button onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              Start Workout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handlePause} variant="outline" className="gap-2 flex-1">
              <Pause className="h-4 w-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button onClick={handleStop} variant="outline" className="gap-2 flex-1">
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <Button 
              onClick={handleMarkComplete}
              disabled={isSaving}
              className="gap-2 flex-1"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
          </div>
        )}
      </div>


      {/* Feedback Section */}
      {showFeedback && (
        <Card className="p-4 space-y-4">
          <div className="text-center">
            <h4 className="font-semibold text-foreground mb-4">How was your workout?</h4>
            
            {/* Add to Favorites */}
            <div className="space-y-2 mb-4">
              <Button
                variant={isFavorite ? "default" : "outline"}
                onClick={() => setIsFavorite(!isFavorite)}
                className="gap-2 w-full"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
              </Button>
              {isFavorite && (
                <p className="text-xs text-muted-foreground">
                  View your favorites on the home page
                </p>
              )}
            </div>

            {/* Mood Check-in */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-foreground">How do you feel:</label>
              <div className="flex gap-2 justify-center">
                {['Sad', 'Happy', 'Amazing'].map((mood, index) => (
                  <Button
                    key={mood}
                    variant={moodRating === index + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMoodRating(index + 1)}
                    className="px-3 py-1 text-xs"
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>

            {/* Workout Effectiveness Rating */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-foreground">Workout Effectiveness (1-5 stars)</label>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    onClick={() => setWorkoutRating(rating)}
                    className="w-8 h-8 p-0"
                  >
                    <Star className={`h-4 w-4 ${workoutRating >= rating ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4 mb-8">
              <Button 
                variant="outline" 
                onClick={() => setShowFeedback(false)}
                className="flex-1"
              >
                Skip
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={isSaving}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};