import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkoutSession } from '@/components/WorkoutSession';
import { VoiceWorkoutSession } from '@/components/VoiceWorkoutSession';
import { useNavigate } from 'react-router-dom';

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
  onStepChange?: (step: string) => void;
}

export const WellnessChat = ({ profile, userName, userId, onStepChange }: WellnessChatProps) => {
  const [step, setStep] = useState<'input' | 'generating' | 'result' | 'feedback' | 'improving' | 'workout' | 'voice-workout' | 'workout-options'>('input');
  const [userInput, setUserInput] = useState('');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSummary, setWorkoutSummary] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

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
    
    // Detect self-harm content and short-circuit with support message
    if (detectSelfHarmInText(userInput)) {
      const crisisMsg = getCrisisSupportMessage(profile?.display_name || userName);
      setWorkoutSuggestion(crisisMsg);
      setWorkoutTitle('');
      setWorkoutSummary('');
      setReferences([]);
      setStep('result');
      return;
    }
    
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
          message: userInput,
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout suggestion');
      }

      const data = await response.json();
      const fullResponse = data.response || data.message || 'No workout suggestion received';
      
      // Extract and parse markdown-style references
      const referencesMatch = fullResponse.match(/\*\*References?\*\*:\s*(.*?)$/i);
      const extractedReferences = referencesMatch ? 
        referencesMatch[1].split('|')
          .map(ref => ref.trim())
          .filter(ref => ref.length > 0) : [];
      
      // Keep references embedded in the content instead of removing them
      const cleanedResponse = fullResponse;
      
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
    
    // Detect self-harm content and short-circuit with support message
    if (detectSelfHarmInText(feedbackInput)) {
      const crisisMsg = getCrisisSupportMessage(profile?.display_name || userName);
      setWorkoutSuggestion(crisisMsg);
      setWorkoutTitle('');
      setWorkoutSummary('');
      setReferences([]);
      setFeedbackInput('');
      setStep('result');
      return;
    }

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
          message: `${feedbackInput}

Previous workout:
${workoutSuggestion}`,
          userContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve workout suggestion');
      }

      const data = await response.json();
      const fullResponse = data.response || data.message || 'No improved workout received';
      
      // Extract and parse markdown-style references
      const referencesMatch = fullResponse.match(/\*\*References?\*\*:\s*(.*?)$/i);
      const extractedReferences = referencesMatch ? 
        referencesMatch[1].split('|')
          .map(ref => ref.trim())
          .filter(ref => ref.length > 0) : [];
      
      // Keep references embedded in the content instead of removing them
      const cleanedResponse = fullResponse;
      
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
    // Navigate to home screen and reset state
    navigate('/');
    setStep('input');
    setUserInput('');
    setWorkoutSuggestion('');
    setWorkoutTitle('');
    setWorkoutSummary('');
    setReferences([]);
    setFeedbackInput('');
  };

  // Function to determine if the response contains an actual workout
  const hasActualWorkout = (response: string) => {
    const lowercaseResponse = response.toLowerCase();
    
    // Check for workout indicators
    const workoutIndicators = [
      '•', '-', // bullet points
      'reps', 'seconds', 'minutes', 'sets',
      'hold for', 'repeat', 'times',
      'push-up', 'squat', 'lunge', 'plank', 'stretch',
      'exercise', 'movement', 'workout'
    ];
    
    // Check for question patterns that indicate no workout
    const questionPatterns = [
      'what type of',
      'do you prefer',
      'would you like',
      'can you tell me',
      'what equipment',
      'how much time',
      'what is your',
      'are you comfortable',
      'do you have any'
    ];
    
    // If response is mostly questions, likely not a workout
    const questionCount = questionPatterns.filter(pattern => 
      lowercaseResponse.includes(pattern)
    ).length;
    
    // If response has workout indicators and not primarily questions
    const hasWorkoutContent = workoutIndicators.some(indicator => 
      lowercaseResponse.includes(indicator)
    );
    
    // If it's mostly questions (2 or more question patterns) and no clear workout content
    if (questionCount >= 2 && !hasWorkoutContent) {
      return false;
    }
    
    // If it has workout content, it's likely a workout
    return hasWorkoutContent;
  };

  // Function to detect if the response mentions acute injury or fracture
  const hasAcuteInjury = (response: string) => {
    const lowercaseResponse = response.toLowerCase();
    
    const acuteInjuryIndicators = [
      'acute',
      'fracture',
      'broken bone',
      'open wound',
      'severe pain',
      'see a doctor',
      'medical professional',
      'healthcare provider',
      'immediate medical',
      'seek medical',
      'consult a doctor',
      'serious injury'
    ];
    
    return acuteInjuryIndicators.some(indicator => 
      lowercaseResponse.includes(indicator)
    );
  };

  // Function to detect mentions of self-harm or suicidal thoughts
  const hasSelfHarmContent = (response: string) => {
    const lowercaseResponse = response.toLowerCase();
    
    const selfHarmIndicators = [
      'self-harm',
      'suicide',
      'suicidal',
      'kill myself',
      'end my life',
      'hurt myself',
      'harm myself',
      'want to die',
      'better off dead',
      'no point in living',
      'local and national helplines',
      'crisis helpline',
      'mental health crisis'
    ];
    
    return selfHarmIndicators.some(indicator => 
      lowercaseResponse.includes(indicator)
    );
  };

  // Detect self-harm in raw user input (pre-AI)
  const detectSelfHarmInText = (text: string) => {
    const t = text.toLowerCase();
    const indicators = [
      'self-harm', 'self harm', 'suicide', 'suicidal', 'kill myself', 'end my life', 'hurt myself', 'harm myself', 'want to die', 'better off dead', 'no point in living', 'end it all'
    ];
    return indicators.some((k) => t.includes(k));
  };

  // Compose a brief, empathetic crisis support message
  const getCrisisSupportMessage = (name?: string | null) => {
    const firstLine = name ? `${name}, I'm really sorry you're feeling this way.` : "I'm really sorry you're feeling this way.";
    return `${firstLine} You matter. Please contact a helpline now:\n• US: Call/Text 988 (24/7)\n• UK/ROI: Samaritans 116 123\n• Elsewhere: Search 'suicide crisis helpline' for your country\nIf you’re in immediate danger, call your local emergency number.`;
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
                Share whatever's on your mind - your energy level, mood or what you need right now.
              </p>
            </div>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="I'm feeling energetic and ready to move... or maybe I'm tired and need something gentle..."
              className="min-h-[60px] text-[10px]"
            />
            <Button 
              onClick={handleSubmitFeeling}
              disabled={!userInput.trim()}
              className="w-full gap-2 text-xs"
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
          <div className="space-y-2">
            <div className="bg-muted/30 rounded-lg p-2 max-h-[300px] overflow-y-auto">
              <div className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                {workoutSuggestion
                  .replace(/^\d+\.\s*/gm, '') // Remove numbered lists (e.g., "1. " "2. ")
                  .split(/(\[.*?\]\(.*?\))/g).map((part, index) => {
                  // Check for markdown links [text](url)
                  const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                  if (linkMatch) {
                    return (
                      <a
                        key={index}
                        href={linkMatch[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {linkMatch[1]}
                      </a>
                    );
                  }
                  
                  // Check for plain URLs and make them clickable
                  const urlPattern = /(https?:\/\/[^\s]+)/g;
                  if (urlPattern.test(part)) {
                    return part.split(urlPattern).map((segment, segIndex) => {
                      if (segment.match(urlPattern)) {
                        return (
                          <a
                            key={`${index}-${segIndex}`}
                            href={segment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {segment}
                          </a>
                        );
                      }
                      return segment;
                    });
                  }
                  
                  return part;
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {hasSelfHarmContent(workoutSuggestion) ? (
                // For self-harm/suicidal content, only show cancel button
                <Button 
                  variant="outline"
                  onClick={handleStartOver}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              ) : hasAcuteInjury(workoutSuggestion) ? (
                // For acute injury cases, only show cancel button
                <Button 
                  variant="outline"
                  onClick={handleStartOver}
                  className="w-full text-xs"
                >
                  Return to Home
                </Button>
              ) : hasActualWorkout(workoutSuggestion) ? (
                // For actual workouts, show start and modify buttons
                <>
                  <Button 
                    className="flex-1 bg-gradient-safety hover:opacity-90 text-xs"
                    onClick={handleStartWorkout}
                  >
                    Start Workout
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setStep('feedback')}
                    className="flex-1 text-xs"
                  >
                    Modify
                  </Button>
                </>
              ) : (
                // For questions/feedback, only show tell me more button
                <Button 
                  variant="outline"
                  onClick={() => setStep('feedback')}
                  className="w-full text-xs"
                >
                  Tell me more
                </Button>
              )}
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
            workoutSummary={workoutSummary}
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