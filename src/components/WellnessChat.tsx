import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkoutSession } from '@/components/WorkoutSession';
import { VoiceWorkoutSession } from '@/components/VoiceWorkoutSession';

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
  userId: string;
}

export const WellnessChat = ({ profile, userName, userId }: WellnessChatProps) => {
  const [step, setStep] = useState<'input' | 'generating' | 'result' | 'feedback' | 'improving' | 'workout' | 'voice-workout'>('input');
  const [userInput, setUserInput] = useState('');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSummary, setWorkoutSummary] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const { toast } = useToast();

  const handleStartWorkout = () => {
    setStep('workout');
  };

  const handleWorkoutComplete = () => {
    setStep('input');
    setUserInput('');
    setWorkoutSuggestion('');
    setWorkoutTitle('');
    setWorkoutSummary('');
    setReferences([]);
  };

  const handleStartVoiceWorkout = () => {
    setStep('voice-workout');
  };


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
      
      // Extract title (first line with **title** format)
      const titleMatch = cleanedResponse.match(/\*\*(.*?)\*\*/);
      const extractedTitle = titleMatch ? titleMatch[1] : '';
      
      // Extract summary (text after exercises, before questions)
      const lines = cleanedResponse.split('\n');
      let summaryLines: string[] = [];
      let inSummary = false;
      
      for (const line of lines) {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          inSummary = false;
          continue;
        }
        if (!line.trim().startsWith('**') && !line.trim().startsWith('•') && !line.trim().startsWith('-') && line.trim() && !inSummary) {
          const isQuestion = line.toLowerCase().includes('?') && (line.toLowerCase().includes('prefer') || line.toLowerCase().includes('need') || line.toLowerCase().includes('comfortable'));
          if (!isQuestion) {
            inSummary = true;
          }
        }
        if (inSummary && line.trim() && !line.toLowerCase().includes('?')) {
          summaryLines.push(line.trim());
        }
        if (line.toLowerCase().includes('?')) {
          break;
        }
      }
      
      setWorkoutTitle(extractedTitle);
      setWorkoutSummary(summaryLines.join(' '));
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
      
      // Extract title (first line with **title** format)
      const titleMatch = cleanedResponse.match(/\*\*(.*?)\*\*/);
      const extractedTitle = titleMatch ? titleMatch[1] : '';
      
      // Extract summary (text after exercises, before questions)
      const lines = cleanedResponse.split('\n');
      let summaryLines: string[] = [];
      let inSummary = false;
      
      for (const line of lines) {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          inSummary = false;
          continue;
        }
        if (!line.trim().startsWith('**') && !line.trim().startsWith('•') && !line.trim().startsWith('-') && line.trim() && !inSummary) {
          const isQuestion = line.toLowerCase().includes('?') && (line.toLowerCase().includes('prefer') || line.toLowerCase().includes('need') || line.toLowerCase().includes('comfortable'));
          if (!isQuestion) {
            inSummary = true;
          }
        }
        if (inSummary && line.trim() && !line.toLowerCase().includes('?')) {
          summaryLines.push(line.trim());
        }
        if (line.toLowerCase().includes('?')) {
          break;
        }
      }
      
      setWorkoutTitle(extractedTitle);
      setWorkoutSummary(summaryLines.join(' '));
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
    setWorkoutTitle('');
    setWorkoutSummary('');
    setReferences([]);
    setFeedbackInput('');

  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {step === 'input' && (
          <div className="space-y-3">
            <div className="p-3 text-center">
              <p className="text-foreground font-medium text-sm mb-2">
                🎉 Ready to make today amazing, {profile?.display_name || userName}?
              </p>
              <p className="text-muted-foreground text-xs">
                Share whatever's on your mind - your energy level, mood, any physical sensations, or what you need right now.
              </p>
            </div>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="I'm feeling energetic and ready to move... or maybe I'm tired and need something gentle..."
              className="min-h-[60px] text-sm"
            />
            <Button 
              onClick={handleSubmitFeeling}
              disabled={!userInput.trim()}
              className="w-full gap-2 text-sm"
            >
              <Send className="h-3 w-3" />
              Get My Personalized Workout
            </Button>
          </div>
        )}

        {(step === 'generating' || step === 'improving') && (
          <div className="space-y-3 text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-medium text-sm">
              {step === 'generating' ? 'Creating your perfect workout...' : 'Improving your workout...'}
            </p>
            <p className="text-muted-foreground text-xs">
              {step === 'generating' ? 'Based on how you\'re feeling and your preferences' : 'Taking your feedback into account'}
            </p>
          </div>
        )}

        {step === 'result' && workoutSuggestion && (
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="bg-muted/30 rounded-lg p-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-foreground font-medium text-sm">Your Personalized Workout</p>
              </div>
              <div className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                {workoutSuggestion}
              </div>
              {references.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border">
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
            <div className="flex gap-2 shrink-0">
              <Button 
                className="flex-1 bg-gradient-safety hover:opacity-90 text-sm"
                onClick={handleStartWorkout}
              >
                Start Workout
              </Button>
              <Button 
                variant="secondary"
                onClick={handleStartVoiceWorkout}
                className="flex-1 text-sm gap-2"
              >
                🎤 Voice Coach
              </Button>
              <Button 
                variant="outline"
                onClick={() => setStep('feedback')}
                className="text-sm"
              >
                Modify
              </Button>
            </div>
          </div>
        )}

        {step === 'feedback' && (
          <div className="space-y-3">
            {/* Show current workout context */}
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-foreground font-medium text-sm mb-1">
                {workoutTitle && `Modifying: ${workoutTitle}`}
              </p>
              {workoutSummary && (
                <p className="text-muted-foreground text-xs">
                  {workoutSummary}
                </p>
              )}
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-foreground font-medium mb-2 text-sm">
                How can we improve this workout for you?
              </p>
              <p className="text-muted-foreground text-xs">
                Share what you'd like to change - different exercises, duration, intensity, or any other preferences.
              </p>
            </div>
            <Textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="I'd prefer exercises I can do sitting down... or maybe something more challenging..."
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('result')}
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFeedback}
                disabled={!feedbackInput.trim()}
                className="flex-1 gap-1 text-sm"
              >
                <Send className="h-3 w-3" />
                Improve Workout
              </Button>
            </div>
          </div>
        )}

        {step === 'voice-workout' && (
          <VoiceWorkoutSession
            workoutTitle={workoutTitle}
            workoutSuggestion={workoutSuggestion}
            userId={userId}
            onComplete={handleWorkoutComplete}
            onCancel={() => setStep('result')}
          />
        )}

        {step === 'workout' && (
          <WorkoutSession
            workoutTitle={workoutTitle}
            workoutSuggestion={workoutSuggestion}
            userId={userId}
            onComplete={handleWorkoutComplete}
            onCancel={() => setStep('result')}
          />
        )}
      </div>
    </div>
  );
};