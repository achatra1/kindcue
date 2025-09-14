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
      <div className="p-1 h-full">
        <Card className="p-2 h-full flex items-center justify-center">
          <div className="text-[8px] text-muted-foreground">Loading activity stats...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-1 h-full">
      <Card 
        className="p-2 h-full cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={handleDashboardClick}
      >
        <div className="flex justify-center items-center h-full">
          <div className="grid grid-cols-4 gap-2 max-w-full">
            {/* Total Active Hours */}
            <div className="flex flex-col items-center justify-center">
              <Clock className="h-3 w-3 text-primary mb-0.5" />
              <h3 className="text-xs font-bold text-foreground mb-0">
                {stats.totalActiveHours}h
              </h3>
              <p className="text-[8px] text-muted-foreground text-center leading-tight">Active Hours</p>
            </div>

            {/* Current Streak */}
            <div className="flex flex-col items-center justify-center">
              <Calendar className="h-3 w-3 text-primary mb-0.5" />
              <h3 className="text-xs font-bold text-foreground mb-0">
                {stats.currentStreak}
              </h3>
              <p className="text-[8px] text-muted-foreground text-center leading-tight">Day Streak</p>
            </div>

            {/* Mood Check-in */}
            <div className="flex flex-col items-center justify-center">
              <Heart className="h-3 w-3 text-primary mb-0.5" />
              <h3 className="text-xs font-bold text-foreground mb-0">
                {stats.averageMood > 0 ? (
                  stats.averageMood <= 1.5 ? '😢' : 
                  stats.averageMood <= 2.5 ? '😊' : '🤩'
                ) : '—'}
              </h3>
              <p className="text-[8px] text-muted-foreground text-center leading-tight">Mood</p>
            </div>

            {/* Days Since Last Workout */}
            <div className="flex flex-col items-center justify-center">
              <BarChart3 className="h-3 w-3 text-primary mb-0.5" />
              <h3 className="text-xs font-bold text-foreground mb-0">
                {stats.daysSinceLastWorkout}
              </h3>
              <p className="text-[8px] text-muted-foreground text-center leading-tight">
                {stats.daysSinceLastWorkout === 0 ? 'Today!' : 
                 stats.daysSinceLastWorkout === 1 ? 'Day ago' : 'Days ago'}
              </p>
            </div>
          </div>
        </div>
        
      </Card>
    </div>
  );
};