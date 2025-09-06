import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Target, Zap, Heart, Send, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuickStartProps {
  profile: any;
  userName: string;
}

interface QuickStartPreferences {
  time: string;
  equipment: string;
  focus: string;
  intensity: string;
}

export const QuickStart = ({ profile, userName }: QuickStartProps) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('');
  const [step, setStep] = useState<'selection' | 'generating' | 'result' | 'feedback' | 'improving'>('selection');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSummary, setWorkoutSummary] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [favoriteWorkouts, setFavoriteWorkouts] = useState<any[]>([]);
  const { toast } = useToast();

  const timeOptions = ['10 min', '20 min', '30 min'];
  const equipmentOptions = ['Bodyweight only', 'Home equipment', 'Gym style'];
  const focusOptions = ['Full body', 'Upper body', 'Lower body'];
  const intensityOptions = ['Low', 'Medium', 'High'];

  const isComplete = selectedTime && selectedEquipment && selectedFocus && selectedIntensity;

  // Fetch favorite workouts from activity logs
  useEffect(() => {
    const fetchFavoriteWorkouts = async () => {
      if (!profile?.user_id) return;
      
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', profile.user_id)
          .ilike('notes', '%⭐ Favorite workout!%')
          .order('logged_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching favorite workouts:', error);
          return;
        }

        setFavoriteWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching favorite workouts:', error);
      }
    };

    fetchFavoriteWorkouts();
  }, [profile?.user_id]);

  const handleQuickStart = async () => {
    if (!isComplete) return;
    
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

      const quickStartPreferences = `Time: ${selectedTime}, Equipment: ${selectedEquipment}, Focus: ${selectedFocus}, Intensity: ${selectedIntensity}`;

      const response = await fetch('https://qbzaiixsalxkoaguqbfo.supabase.co/functions/v1/chat-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please create a workout based on my quick start preferences: ${quickStartPreferences}

IMPORTANT: Format your response EXACTLY as follows:
1. Short Title (max 8 words)
2. Exercise List (one exercise per line with duration/reps)
3. Summary Card (2-3 encouraging sentences)
4. ONLY ask 1 short question if truly needed for clarification (use sparingly)
5. References (2-3 credible sources)

Keep the same format with References section at the end.`,
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
      setStep('selection');
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
    setStep('selection');
    setSelectedTime('');
    setSelectedEquipment('');
    setSelectedFocus('');
    setSelectedIntensity('');
    setWorkoutSuggestion('');
    setWorkoutTitle('');
    setWorkoutSummary('');
    setReferences([]);
    setFeedbackInput('');
  };

  const ChipGroup = ({ 
    title, 
    icon: Icon, 
    options, 
    selected, 
    onSelect 
  }: { 
    title: string; 
    icon: any; 
    options: string[]; 
    selected: string; 
    onSelect: (value: string) => void; 
  }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <Icon className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium text-foreground">{title}:</span>
      </div>
      <div className="flex flex-wrap gap-1 min-w-0">
        {options.map((option) => (
          <Badge
            key={option}
            variant={selected === option ? "default" : "outline"}
            className={`cursor-pointer text-xs px-2 py-1 ${
              selected === option 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onSelect(option)}
          >
            {option}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Main Title */}
      <div className="mb-2 text-center">
        <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Start
        </h3>
      </div>
      
      {step === 'selection' && (
        <div className="flex-1 grid grid-cols-2 gap-3">
          {/* Left Half - Customize */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Customize</h4>
            
            <div className="space-y-2">
              <ChipGroup
                title="Time"
                icon={Clock}
                options={timeOptions}
                selected={selectedTime}
                onSelect={setSelectedTime}
              />
              
              <ChipGroup
                title="Equipment"
                icon={Dumbbell}
                options={equipmentOptions}
                selected={selectedEquipment}
                onSelect={setSelectedEquipment}
              />
              
              <ChipGroup
                title="Focus"
                icon={Target}
                options={focusOptions}
                selected={selectedFocus}
                onSelect={setSelectedFocus}
              />
              
              <ChipGroup
                title="Intensity"
                icon={Zap}
                options={intensityOptions}
                selected={selectedIntensity}
                onSelect={setSelectedIntensity}
              />
            </div>
          </div>

          {/* Right Half - Favorites */}
          <div className="space-y-2 border-l border-border pl-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Favorites
            </h4>
            
            {favoriteWorkouts.length > 0 ? (
              <div className="space-y-1">
                {favoriteWorkouts.slice(0, 4).map((workout, index) => (
                  <Button
                    key={workout.id}
                    variant="ghost"
                    className="w-full justify-start text-xs p-2 h-auto text-left"
                    onClick={() => {
                      // Extract workout info and start it
                      toast({
                        title: "Favorite workout selected",
                        description: workout.activity_type,
                      });
                    }}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="truncate font-medium">{workout.activity_type}</span>
                      <span className="text-muted-foreground text-xs">
                        {workout.duration}min • {new Date(workout.logged_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Button>
                ))}
                {favoriteWorkouts.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground p-2 h-auto"
                  >
                    +{favoriteWorkouts.length - 4} more favorites
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No favorite workouts saved yet. Complete workouts to add them to your favorites!
              </p>
            )}
          </div>
        </div>
      )}

      {(step === 'generating' || step === 'improving') && (
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-medium text-sm">
              {step === 'generating' ? 'Creating your perfect workout...' : 'Improving your workout...'}
            </p>
            <p className="text-muted-foreground text-xs">
              {step === 'generating' ? 'Based on your preferences' : 'Taking your feedback into account'}
            </p>
          </div>
        </div>
      )}

      {step === 'result' && workoutSuggestion && (
        <div className="flex-1 flex flex-col space-y-3">
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
            >
              Start Workout
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setStep('feedback')}
              className="flex-1 text-sm"
            >
              Modify Workout
            </Button>
          </div>
        </div>
      )}

      {step === 'feedback' && (
          <div className="flex-1 flex flex-col space-y-3">
            {/* Show current workout context */}
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
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
          <textarea
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            placeholder="I'd prefer exercises I can do sitting down... or maybe something more challenging..."
            className="min-h-[60px] text-sm p-2 border rounded-md bg-background"
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

      {/* Centered Start Quick Workout Button - Only show in selection state */}
      {step === 'selection' && (
        <div className="mt-3 flex justify-center">
          <Button 
            onClick={handleQuickStart}
            disabled={!isComplete}
            className="text-sm bg-gradient-safety hover:opacity-90 px-6"
          >
            Start Quick Workout
          </Button>
        </div>
      )}
    </div>
  );
};