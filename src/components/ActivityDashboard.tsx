import { Clock, Calendar, Heart, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const ActivityDashboard = () => {
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    navigate('/activity-logs');
  };

  return (
    <div className="p-4 h-full">
      <Card 
        className="p-4 h-full cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={handleDashboardClick}
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          {/* Active Hours */}
          <div className="flex flex-col items-center justify-center">
            <Clock className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">2.5h</h3>
            <p className="text-xs text-muted-foreground text-center">Active Hours Today</p>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center justify-center">
            <Calendar className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">12</h3>
            <p className="text-xs text-muted-foreground text-center">Day Streak</p>
          </div>

          {/* Mood Check-in */}
          <div className="flex flex-col items-center justify-center">
            <Heart className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">😊</h3>
            <p className="text-xs text-muted-foreground text-center">Today's Mood</p>
          </div>

          {/* View Details */}
          <div className="flex flex-col items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">View</h3>
            <p className="text-xs text-muted-foreground text-center">Activity Logs</p>
          </div>
        </div>
      </Card>
    </div>
  );
};