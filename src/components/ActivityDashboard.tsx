import { Activity, Calendar, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ActivityDashboard = () => {
  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Quick Stats */}
        <Card className="p-4 flex flex-col items-center justify-center">
          <Activity className="h-8 w-8 text-primary mb-2" />
          <h3 className="text-lg font-semibold text-foreground mb-1">7</h3>
          <p className="text-xs text-muted-foreground text-center">Workouts This Week</p>
        </Card>

        <Card className="p-4 flex flex-col items-center justify-center">
          <Target className="h-8 w-8 text-primary mb-2" />
          <h3 className="text-lg font-semibold text-foreground mb-1">3/5</h3>
          <p className="text-xs text-muted-foreground text-center">Weekly Goal</p>
        </Card>

        <Card className="p-4 flex flex-col items-center justify-center">
          <Calendar className="h-8 w-8 text-primary mb-2" />
          <h3 className="text-lg font-semibold text-foreground mb-1">12</h3>
          <p className="text-xs text-muted-foreground text-center">Day Streak</p>
        </Card>

        <Card className="p-4 flex flex-col items-center justify-center">
          <TrendingUp className="h-8 w-8 text-primary mb-2" />
          <h3 className="text-lg font-semibold text-foreground mb-1">+15%</h3>
          <p className="text-xs text-muted-foreground text-center">Progress This Month</p>
        </Card>
      </div>
    </div>
  );
};