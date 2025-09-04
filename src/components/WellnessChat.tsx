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
  const [step, setStep] = useState<'input' | 'generating' | 'result' | 'feedback' | 'improving'>('input');
  const [userInput, setUserInput] = useState('');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
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
          message: `Based on how I'm feeling today: "${userInput}", please suggest a personalized workout. 

IMPORTANT: Format your response EXACTLY as follows:
1. Short Title (max 8 words)
2. Exercise List (one exercise per line with duration/reps)
3. Summary Card (2-3 encouraging sentences)
4. ONLY ask 1 short question if truly needed for clarification (use sparingly)
5. References (2-3 credible sources)

Example format:
**Gentle Morning Stretch Flow**

• Neck rolls - 2 minutes
• Shoulder shrugs - 1 minute  
• Cat-cow pose - 3 minutes
• Child's pose - 5 minutes

This gentle routine will help you ease into your day with mindful movement. Perfect for when you need something nurturing and restorative.

Need floor space or prefer seated?

References:
- Mayo Clinic: Stretching Guidelines
- American Council on Exercise: Flexibility Training
- Harvard Health: Benefits of Stretching`,
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout suggestion');
      }

      const data = await response.json();
      const fullResponse = data.response || data.message || 'No workout suggestion received';
      
      // Extract references if they exist
      const referencesMatch = fullResponse.match(/References?:\s*([\s\S]*?)$/i);
      const extractedReferences = referencesMatch ? 
        referencesMatch[1].split('\n').filter(ref => ref.trim().startsWith('-')).map(ref => ref.trim().substring(1).trim()) : [];
      
      // Remove references from main content
      const cleanedResponse = fullResponse.replace(/References?:\s*[\s\S]*$/i, '').trim();
      
      setWorkoutSuggestion(cleanedResponse);
      setReferences(extractedReferences);
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

  const handleFeedback = async () => {
    if (!feedbackInput.trim()) return;
    
    setStep('improving');
    
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
          message: `Please improve this workout based on my feedback: "${feedbackInput}"

Previous workout:
${workoutSuggestion}

IMPORTANT: Format your improved response EXACTLY as follows:
1. Short Title (max 8 words)
2. Exercise List (one exercise per line with duration/reps)
3. Summary Card (2-3 encouraging sentences)
4. ONLY ask 1 short question if truly needed for clarification (use sparingly)
5. References (2-3 credible sources)

Keep the same format as before with References section at the end.`,
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve workout suggestion');
      }

      const data = await response.json();
      const fullResponse = data.response || data.message || 'No improved workout received';
      
      // Extract references if they exist
      const referencesMatch = fullResponse.match(/References?:\s*([\s\S]*?)$/i);
      const extractedReferences = referencesMatch ? 
        referencesMatch[1].split('\n').filter(ref => ref.trim().startsWith('-')).map(ref => ref.trim().substring(1).trim()) : [];
      
      // Remove references from main content
      const cleanedResponse = fullResponse.replace(/References?:\s*[\s\S]*$/i, '').trim();
      
      setWorkoutSuggestion(cleanedResponse);
      setReferences(extractedReferences);
      setFeedbackInput('');
      setStep('result');
    } catch (error) {
      console.error('Error improving workout:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't improve your workout suggestion. Please try again.",
        variant: "destructive",
      });
      setStep('result');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setUserInput('');
    setWorkoutSuggestion('');
    setReferences([]);
    setFeedbackInput('');
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

        {(step === 'generating' || step === 'improving') && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-medium">
              {step === 'generating' ? 'Creating your perfect workout...' : 'Improving your workout...'}
            </p>
            <p className="text-muted-foreground text-sm">
              {step === 'generating' ? 'Based on how you\'re feeling and your preferences' : 'Taking your feedback into account'}
            </p>
          </div>
        )}

        {step === 'result' && workoutSuggestion && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-foreground font-medium">Your Personalized Workout</p>
              </div>
              <div className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {workoutSuggestion}
              </div>
              {references.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <button 
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    onClick={() => {
                      toast({
                        title: "References",
                        description: references.join(' • '),
                        duration: 5000,
                      });
                    }}
                  >
                    View References ({references.length})
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleStartOver}
                  className="flex-1"
                >
                  New Workout
                </Button>
                <Button 
                  className="flex-1 bg-gradient-safety hover:opacity-90"
                >
                  Start Workout
                </Button>
              </div>
              <Button 
                variant="secondary"
                onClick={() => setStep('feedback')}
                className="w-full"
              >
                Provide Feedback
              </Button>
            </div>
          </div>
        )}

        {step === 'feedback' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-foreground font-medium mb-3">
                How can we improve this workout for you?
              </p>
              <p className="text-muted-foreground text-sm">
                Share what you'd like to change - different exercises, duration, intensity, or any other preferences.
              </p>
            </div>
            <Textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="I'd prefer exercises I can do sitting down... or maybe something more challenging..."
              className="min-h-[80px]"
            />
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setStep('result')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFeedback}
                disabled={!feedbackInput.trim()}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                Improve Workout
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};