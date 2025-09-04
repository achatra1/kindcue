import { Activity, Calendar, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ActivityDashboard = () => {
  return (
    <div className="p-4 h-full">
      <Card className="p-4 h-full">
        <div className="grid grid-cols-2 gap-3 h-full">
          {/* Quick Stats */}
          <div className="flex flex-col items-center justify-center">
            <Activity className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">7</h3>
            <p className="text-xs text-muted-foreground text-center">Workouts This Week</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Target className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">3/5</h3>
            <p className="text-xs text-muted-foreground text-center">Weekly Goal</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Calendar className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">12</h3>
            <p className="text-xs text-muted-foreground text-center">Day Streak</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary mb-1" />
            <h3 className="text-base font-semibold text-foreground mb-0.5">+15%</h3>
            <p className="text-xs text-muted-foreground text-center">Progress This Month</p>
          </div>
        </div>
      </Card>
    </div>
  );
};