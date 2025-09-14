import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Target, Zap, Heart, Send, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSession } from '@/components/WorkoutSession';

interface QuickStartProps {
  profile: any;
  userName: string;
  userId: string;
}

interface QuickStartPreferences {
  time: string;
  equipment: string;
  focus: string;
  intensity: string;
}

export const QuickStart = ({ profile, userName, userId }: QuickStartProps) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('');
  const [step, setStep] = useState<'selection' | 'generating' | 'result' | 'feedback' | 'improving' | 'workout'>('selection');
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSummary, setWorkoutSummary] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [favoriteWorkouts, setFavoriteWorkouts] = useState<any[]>([]);
  const { toast } = useToast();

  const timeOptions = ['10 min', '20 min', '30 min'];
  const equipmentOptions = ['Bodyweight only', 'Home equipment', 'Gym style'];
  const focusOptions = ['Full body', 'Upper body', 'Lower body'];
  const intensityOptions = ['Low', 'Medium', 'High'];

  const isComplete = selectedTime || selectedEquipment || selectedFocus || selectedIntensity;

  // Fetch favorite workouts from the new favorite_workouts table
  useEffect(() => {
    const fetchFavoriteWorkouts = async () => {
      if (!profile?.user_id) return;
      
      try {
        const { data, error } = await supabase
          .from('favorite_workouts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(8);

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

      const quickStartPreferences = [
        selectedTime && `Time: ${selectedTime}`,
        selectedEquipment && `Equipment: ${selectedEquipment}`,
        selectedFocus && `Focus: ${selectedFocus}`,
        selectedIntensity && `Intensity: ${selectedIntensity}`
      ].filter(Boolean).join(', ');

      const basePrompt = quickStartPreferences 
        ? `Please create a workout based on my quick start preferences: ${quickStartPreferences}`
        : `Please create a personalized workout based on my profile and preferences`;

      const response = await fetch('https://qbzaiixsalxkoaguqbfo.supabase.co/functions/v1/chat-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${basePrompt}

IMPORTANT: Format your response EXACTLY as follows:
1. Short Title (max 8 words)
2. Exercise List (one exercise per line with duration/reps)
3. One short encouraging motivational line (maximum 15 words)
4. ONLY ask 1 short question if truly needed for clarification (use sparingly)

At the end of your workout description, add 2-3 credible references as clickable markdown links in this format:
**References:** [Mayo Clinic](https://mayoclinic.org) | [American Heart Association](https://heart.org) | [CDC Physical Activity](https://cdc.gov)

Use real, credible fitness and wellness URLs.`,
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
      
      // Remove references from main content but keep them embedded
      let cleanedResponse = fullResponse;
      
      // Extract title (first line with **title** format or numbered title)
      const titleMatch = cleanedResponse.match(/(?:\d+\.\s*)?(?:Short Title[:\s]*)?(?:\*\*)?(.*?)(?:\*\*)?$/m);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : '';
      
      // Remove the title line from content
      cleanedResponse = cleanedResponse.replace(/(?:\d+\.\s*)?(?:Short Title[:\s]*)?(?:\*\*)?(.*?)(?:\*\*)?$/m, '').trim();
      
      // Clean up numbering and headers
      cleanedResponse = cleanedResponse
        .replace(/\d+\.\s*(?:Short Title|Exercise List|Summary Card)[:\s]*/gi, '') // Remove numbered headers
        .replace(/Exercise List[:\s]*/gi, '') // Remove "Exercise List" header
        .replace(/Summary Card[:\s]*/gi, '') // Remove "Summary Card" header
        .replace(/^\d+\.\s*/gm, '') // Remove numbering from beginning of lines
        .trim();
      
      // Extract summary (text after exercises, before questions)
      const lines = cleanedResponse.split('\n');
      let summaryLines: string[] = [];
      let exerciseLines: string[] = [];
      let inExercises = true;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // If line starts with bullet point or dash, it's an exercise
        if (trimmedLine.match(/^[-•]\s/)) {
          exerciseLines.push(trimmedLine);
          inExercises = true;
        } 
        // If it's not an exercise and we were in exercises, switch to summary
        else if (inExercises && !trimmedLine.includes('?')) {
          inExercises = false;
          summaryLines.push(trimmedLine);
        }
        // Continue collecting summary lines
        else if (!inExercises && !trimmedLine.includes('?')) {
          summaryLines.push(trimmedLine);
        }
        // Stop at questions
        else if (trimmedLine.includes('?')) {
          break;
        }
      }
      
      // Combine exercises and summary
      const formattedContent = [
        ...exerciseLines,
        '',
        ...summaryLines
      ].filter(line => line.trim()).join('\n');
      
      setWorkoutTitle(extractedTitle);
      setWorkoutSummary(summaryLines.join(' '));
      setWorkoutSuggestion(formattedContent);
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

Please provide an improved version with the same format:
1. Short Title (max 8 words)
2. Exercise List (one exercise per line with duration/reps)
3. One short encouraging motivational line (maximum 15 words)

At the end, add 2-3 credible references as clickable markdown links in this format:
**References:** [Mayo Clinic](https://mayoclinic.org) | [American Heart Association](https://heart.org) | [CDC Physical Activity](https://cdc.gov)`,
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
      let cleanedResponse = fullResponse;
      
      // Extract title (first line with **title** format or numbered title)
      const titleMatch = cleanedResponse.match(/(?:\d+\.\s*)?(?:Short Title[:\s]*)?(?:\*\*)?(.*?)(?:\*\*)?$/m);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : '';
      
      // Remove the title line from content
      cleanedResponse = cleanedResponse.replace(/(?:\d+\.\s*)?(?:Short Title[:\s]*)?(?:\*\*)?(.*?)(?:\*\*)?$/m, '').trim();
      
      // Clean up numbering and headers
      cleanedResponse = cleanedResponse
        .replace(/\d+\.\s*(?:Short Title|Exercise List|Summary Card)[:\s]*/gi, '') // Remove numbered headers
        .replace(/Exercise List[:\s]*/gi, '') // Remove "Exercise List" header
        .replace(/Summary Card[:\s]*/gi, '') // Remove "Summary Card" header
        .replace(/^\d+\.\s*/gm, '') // Remove numbering from beginning of lines
        .trim();
      
      // Extract summary (text after exercises, before questions)
      const lines = cleanedResponse.split('\n');
      let summaryLines: string[] = [];
      let exerciseLines: string[] = [];
      let inExercises = true;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // If line starts with bullet point or dash, it's an exercise
        if (trimmedLine.match(/^[-•]\s/)) {
          exerciseLines.push(trimmedLine);
          inExercises = true;
        } 
        // If it's not an exercise and we were in exercises, switch to summary
        else if (inExercises && !trimmedLine.includes('?')) {
          inExercises = false;
          summaryLines.push(trimmedLine);
        }
        // Continue collecting summary lines
        else if (!inExercises && !trimmedLine.includes('?')) {
          summaryLines.push(trimmedLine);
        }
        // Stop at questions
        else if (trimmedLine.includes('?')) {
          break;
        }
      }
      
      // Combine exercises and summary
      const formattedContent = [
        ...exerciseLines,
        '',
        ...summaryLines
      ].filter(line => line.trim()).join('\n');
      
      setWorkoutTitle(extractedTitle);
      setWorkoutSummary(summaryLines.join(' '));
      setWorkoutSuggestion(formattedContent);
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

  const handleStartWorkout = () => {
    setStep('workout');
  };

  const handleWorkoutComplete = () => {
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
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-medium text-foreground">{title}:</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <Badge
            key={option}
            variant={selected === option ? "default" : "outline"}
            className={`cursor-pointer text-[10px] px-1.5 py-0.5 ${
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
      {step === 'selection' && (
        <div className="flex-1 grid grid-cols-2 gap-3">
          {/* Left Half - Customize */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-foreground">Customize</h4>
            
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
            <h4 className="text-xs font-medium text-foreground flex items-center gap-2">
              <Heart className="h-3 w-3 text-primary" />
              Favorites
            </h4>
            
            {favoriteWorkouts.length > 0 ? (
              <div className="space-y-1">
                {favoriteWorkouts.slice(0, 4).map((workout) => (
                  <Button
                    key={workout.id}
                    variant="ghost"
                    className="w-full justify-start text-[10px] p-1.5 h-auto text-left"
                    onClick={() => {
                      // Load the favorite workout content
                      setWorkoutTitle(workout.workout_title);
                      setWorkoutSuggestion(workout.workout_content);
                      setWorkoutSummary(`Favorite workout • ${workout.workout_duration}min`);
                      setStep('result');
                      toast({
                        title: "Favorite workout loaded",
                        description: workout.workout_title,
                      });
                    }}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium text-left whitespace-normal word-break break-all leading-tight">{workout.workout_title}</span>
                      <span className="text-muted-foreground text-[8px]">
                        {workout.workout_duration}min • {new Date(workout.created_at).toLocaleDateString()}
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
              <p className="text-[10px] text-muted-foreground">
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
            <p className="text-foreground font-medium text-xs">
              {step === 'generating' ? 'Creating your perfect workout...' : 'Improving your workout...'}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {step === 'generating' ? 'Based on your preferences' : 'Taking your feedback into account'}
            </p>
          </div>
        </div>
      )}

      {step === 'result' && workoutSuggestion && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Workout Title as Header */}
          {workoutTitle && (
            <div className="text-center">
              <h2 className="text-base font-semibold text-foreground">{workoutTitle}</h2>
            </div>
          )}
          
          <div className="bg-muted/30 rounded-lg p-4 flex-1 overflow-y-auto min-h-[200px]">
            <div className="text-foreground whitespace-pre-wrap text-xs leading-relaxed">
              {workoutSuggestion.split(/(\[.*?\]\(.*?\))/g).map((part, index) => {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                  return (
                    <a
                      key={index}
                      href={linkMatch[2]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {linkMatch[1]}
                    </a>
                  );
                }
                return part;
              })}
            </div>
          </div>
          
          
          <div className="flex gap-2 shrink-0">
            <Button 
              className="flex-1 bg-gradient-safety hover:opacity-90 text-xs"
              onClick={handleStartWorkout}
            >
              Start Workout
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setStep('feedback')}
              className="flex-1 text-xs"
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
            <p className="text-foreground font-medium text-xs mb-1">
              {workoutTitle && `Modifying: ${workoutTitle}`}
            </p>
            {workoutSummary && (
              <p className="text-muted-foreground text-[10px]">
                {workoutSummary}
              </p>
            )}
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-foreground font-medium mb-2 text-xs">
              How can we improve this workout for you?
            </p>
            <p className="text-muted-foreground text-[10px]">
              Share what you'd like to change - different exercises, duration, intensity, or any other preferences.
            </p>
          </div>
          <textarea
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            placeholder="I'd prefer exercises I can do sitting down... or maybe something more challenging..."
            className="min-h-[60px] text-xs p-2 border rounded-md bg-background"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setStep('result')}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFeedback}
              disabled={!feedbackInput.trim()}
              className="flex-1 gap-1 text-xs"
            >
              <Send className="h-3 w-3" />
              Improve Workout
            </Button>
          </div>
        </div>
      )}

      {step === 'workout' && (
        <WorkoutSession
          workoutTitle={workoutTitle}
          workoutSuggestion={workoutSuggestion}
          userId={userId}
          onComplete={handleWorkoutComplete}
          onCancel={handleWorkoutComplete}
        />
      )}

      {/* Centered Start Quick Workout Button - Only show in selection state */}
      {step === 'selection' && (
        <div className="mt-3 flex justify-center">
          <Button 
            onClick={handleQuickStart}
            disabled={!isComplete}
            className="text-xs bg-gradient-safety hover:opacity-90 px-6"
          >
            Start Quick Workout
          </Button>
        </div>
      )}
    </div>
  );
};