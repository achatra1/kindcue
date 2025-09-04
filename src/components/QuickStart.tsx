import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Target, Zap, Heart } from 'lucide-react';

interface QuickStartProps {
  profile: any;
  onQuickStart: (preferences: QuickStartPreferences) => void;
}

interface QuickStartPreferences {
  time: string;
  equipment: string;
  focus: string;
  intensity: string;
}

export const QuickStart = ({ profile, onQuickStart }: QuickStartProps) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('');

  const timeOptions = ['10 min', '20 min', '30 min'];
  const equipmentOptions = ['Bodyweight only', 'Home equipment', 'Gym style'];
  const focusOptions = ['Full body', 'Upper body', 'Lower body'];
  const intensityOptions = ['Low', 'Medium', 'High'];

  const isComplete = selectedTime && selectedEquipment && selectedFocus && selectedIntensity;

  const handleQuickStart = () => {
    if (isComplete) {
      onQuickStart({
        time: selectedTime,
        equipment: selectedEquipment,
        focus: selectedFocus,
        intensity: selectedIntensity
      });
    }
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
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <div className="flex flex-wrap gap-1">
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
    <Card className="p-3 bg-card/95 backdrop-blur-sm border-border/50 h-full flex flex-col">
      {/* Main Title */}
      <div className="mb-2 text-center">
        <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Start
        </h3>
      </div>
      
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
            
            <Button 
              onClick={handleQuickStart}
              disabled={!isComplete}
              className="w-full text-sm bg-gradient-safety hover:opacity-90"
            >
              Start Quick Workout
            </Button>
          </div>
        </div>

        {/* Right Half - Favorites */}
        <div className="space-y-2 border-l border-border pl-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Favorites
          </h4>
          
          {profile?.favorite_workouts && profile.favorite_workouts.length > 0 ? (
            <div className="space-y-1">
              {profile.favorite_workouts.slice(0, 4).map((workout: string, index: number) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-xs p-2 h-auto text-left"
                  onClick={() => {/* TODO: Load favorite workout */}}
                >
                  <span className="truncate">{workout}</span>
                </Button>
              ))}
              {profile.favorite_workouts.length > 4 && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground p-2 h-auto"
                >
                  +{profile.favorite_workouts.length - 4} more favorites
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
    </Card>
  );
};