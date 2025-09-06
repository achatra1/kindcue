import { Clock, Calendar, Heart, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStats } from '@/hooks/useActivityStats';

export const ActivityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading } = useActivityStats(user?.id);

  const handleDashboardClick = () => {
    navigate('/activity-logs');
  };

  if (loading) {
    return (
      <div className="p-4 h-full">
        <Card className="p-4 h-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading activity stats...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 h-full">
      <Card 
        className="p-4 h-full cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={handleDashboardClick}
      >
        <div className="flex justify-center items-center h-full">
          <div className="grid grid-cols-2 gap-6 max-w-[280px]">
            {/* Total Active Hours */}
            <div className="flex flex-col items-center justify-center">
              <Clock className="h-6 w-6 text-primary mb-1" />
              <h3 className="text-base font-semibold text-foreground mb-0.5">
                {stats.totalActiveHours}h
              </h3>
              <p className="text-xs text-muted-foreground text-center">Total Active Hours</p>
            </div>

            {/* Current Streak */}
            <div className="flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 text-primary mb-1" />
              <h3 className="text-base font-semibold text-foreground mb-0.5">
                {stats.currentStreak}
              </h3>
              <p className="text-xs text-muted-foreground text-center">Day Streak</p>
            </div>

            {/* Mood Check-in */}
            <div className="flex flex-col items-center justify-center">
              <Heart className="h-6 w-6 text-primary mb-1" />
              <h3 className="text-base font-semibold text-foreground mb-0.5">
                {stats.averageMood > 0 ? (
                  stats.averageMood <= 1.5 ? '😢' : 
                  stats.averageMood <= 2.5 ? '😊' : '🤩'
                ) : '—'}
              </h3>
              <p className="text-xs text-muted-foreground text-center">Mood Check-in</p>
            </div>

            {/* Days Since Last Workout */}
            <div className="flex flex-col items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary mb-1" />
              <h3 className="text-base font-semibold text-foreground mb-0.5">
                {stats.daysSinceLastWorkout}
              </h3>
              <p className="text-xs text-muted-foreground text-center">
                {stats.daysSinceLastWorkout === 0 ? 'Worked out today!' : 
                 stats.daysSinceLastWorkout === 1 ? 'Day since workout' : 'Days since workout'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Motivational Message */}
        {stats.totalWorkouts > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center italic">
              {stats.totalWorkouts === 1 
                ? "Great start! Keep building that healthy habit." 
                : stats.currentStreak > 5 
                ? `Amazing ${stats.currentStreak}-day streak! You're on fire! 🔥`
                : stats.currentStreak > 0
                ? `Nice work! ${stats.currentStreak} days strong. Keep it up!`
                : "Ready for your next workout? You've got this! 💪"
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};