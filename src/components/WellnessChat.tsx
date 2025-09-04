import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  display_name: string | null;
  bio: string | null;
  wellness_goals: string[] | null;
  fitness_level: string | null;
  favorite_workouts: string[] | null;
  preferred_workout_duration: number | null;
}

interface WellnessChatProps {
  profile: Profile | null;
  userName: string;
}

export const WellnessChat = ({ profile, userName }: WellnessChatProps) => {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  const [userInput, setUserInput] = useState('');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const { toast } = useToast();


  const handleSubmitFeeling = async () => {
    if (!userInput.trim()) return;
    
    setStep('generating');
    
    try {
      const userContext = {
        name: profile?.display_name || userName,
        bio: profile?.bio,
        wellness_goals: profile?.wellness_goals,
        fitness_level: profile?.fitness_level,
        favorite_workouts: profile?.favorite_workouts,
        preferred_workout_duration: profile?.preferred_workout_duration
      };

      const response = await fetch('https://qbzaiixsalxkoaguqbfo.supabase.co/functions/v1/chat-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on how I'm feeling today: "${userInput}", please suggest a personalized workout that matches my current state and preferences.`,
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout suggestion');
      }

      const data = await response.json();
      setWorkoutSuggestion(data.message);
      setStep('result');
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't generate your workout suggestion. Please try again.",
        variant: "destructive",
      });
      setStep('input');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setUserInput('');
    setWorkoutSuggestion('');
  };

  return (
    <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50 h-full">
      <div className="space-y-4">
        {step === 'input' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-foreground font-medium mb-4">
                🎉 Ready to make today amazing, {profile?.display_name || userName}?
              </p>
              <p className="text-foreground font-medium mb-3">
                How are you feeling today?
              </p>
              <p className="text-muted-foreground text-sm">
                Share whatever's on your mind - your energy level, mood, any physical sensations, or what you need right now.
              </p>
            </div>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="I'm feeling energetic and ready to move... or maybe I'm tired and need something gentle..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmitFeeling}
              disabled={!userInput.trim()}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              Get My Personalized Workout
            </Button>
          </div>
        )}

        {step === 'generating' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-medium">
              Creating your perfect workout...
            </p>
            <p className="text-muted-foreground text-sm">
              Based on how you're feeling and your preferences
            </p>
          </div>
        )}

        {step === 'result' && workoutSuggestion && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-foreground font-medium">Your Personalized Workout</p>
              </div>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {workoutSuggestion}
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                className="flex-1 bg-gradient-safety hover:opacity-90"
              >
                Start Workout
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};