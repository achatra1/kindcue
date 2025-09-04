import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot } from 'lucide-react';

interface OnboardingChatProps {
  onComplete: () => void;
  userId: string;
}

const OnboardingChat = ({ onComplete, userId }: OnboardingChatProps) => {
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;

    setIsSubmitting(true);

    try {
      // Summarize and save to profile
      const summary = generateSummary(userResponse);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: summary,
          wellness_goals: extractGoals(userResponse),
          fitness_level: extractFitnessLevel(userResponse),
          favorite_workouts: extractWorkouts(userResponse),
          preferred_workout_duration: extractDuration(userResponse)
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Profile Updated!",
        description: "Thanks for sharing! Your preferences have been saved.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSummary = (response: string): string => {
    // Simple summary generation - in a real app, you might use AI for this
    const words = response.toLowerCase();
    let summary = "User preferences: ";
    
    if (words.includes('weight loss') || words.includes('lose weight')) {
      summary += "Weight management goals. ";
    }
    if (words.includes('strength') || words.includes('muscle')) {
      summary += "Strength building focus. ";
    }
    if (words.includes('cardio') || words.includes('running')) {
      summary += "Enjoys cardio activities. ";
    }
    if (words.includes('beginner') || words.includes('new')) {
      summary += "Beginner fitness level. ";
    }
    if (words.includes('busy') || words.includes('time')) {
      summary += "Limited time availability. ";
    }
    
    return summary || response.substring(0, 200);
  };

  const extractGoals = (response: string): string[] => {
    const goals = [];
    const words = response.toLowerCase();
    
    if (words.includes('weight loss') || words.includes('lose weight')) goals.push('weight_loss');
    if (words.includes('strength') || words.includes('muscle')) goals.push('strength_building');
    if (words.includes('flexibility') || words.includes('yoga')) goals.push('flexibility');
    if (words.includes('endurance') || words.includes('cardio')) goals.push('endurance');
    if (words.includes('wellness') || words.includes('health')) goals.push('general_wellness');
    
    return goals.length > 0 ? goals : ['general_wellness'];
  };

  const extractFitnessLevel = (response: string): string => {
    const words = response.toLowerCase();
    
    if (words.includes('beginner') || words.includes('new') || words.includes('starting')) return 'beginner';
    if (words.includes('intermediate') || words.includes('some experience')) return 'intermediate';
    if (words.includes('advanced') || words.includes('experienced')) return 'advanced';
    
    return 'beginner';
  };

  const extractWorkouts = (response: string): string[] => {
    const workouts = [];
    const words = response.toLowerCase();
    
    if (words.includes('yoga')) workouts.push('yoga');
    if (words.includes('running') || words.includes('jogging')) workouts.push('running');
    if (words.includes('swimming')) workouts.push('swimming');
    if (words.includes('walking')) workouts.push('walking');
    if (words.includes('strength') || words.includes('weights')) workouts.push('strength_training');
    if (words.includes('cycling') || words.includes('bike')) workouts.push('cycling');
    
    return workouts.length > 0 ? workouts : ['walking'];
  };

  const extractDuration = (response: string): number => {
    const words = response.toLowerCase();
    
    if (words.includes('15') || words.includes('fifteen')) return 15;
    if (words.includes('30') || words.includes('thirty')) return 30;
    if (words.includes('45') || words.includes('forty-five')) return 45;
    if (words.includes('60') || words.includes('hour')) return 60;
    if (words.includes('quick') || words.includes('short')) return 15;
    if (words.includes('long') || words.includes('extended')) return 60;
    
    return 30; // default
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      {/* Logo in top left */}
      <div className="absolute top-4 left-4">
        <img 
          src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
          alt="KindCue Logo" 
          className="h-16 w-auto"
        />
      </div>
      
      <Card className="w-full max-w-2xl p-6 bg-card/95 backdrop-blur-sm border-border/50">
        <div className="space-y-6">
          {/* Bot Message */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-foreground leading-relaxed">
                  Tell me about your workout preferences, health goals, time availability and fitness level. 
                  It will help me cater to your personal needs better.
                </p>
              </div>
            </div>
          </div>

          {/* User Input */}
          <div className="space-y-4">
            <Textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Share as much or as little as you'd like... For example: I'm a beginner looking to lose weight, I have about 30 minutes available most days, and I enjoy walking and light strength training."
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!userResponse.trim() || isSubmitting}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Your information helps us personalize your wellness journey
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingChat;