import { useState, useEffect } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Plus, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  activity_type: string;
  duration: number | null;
  notes: string | null;
  logged_at: string;
}

const ActivityLogs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading your activities...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Activity
          </Button>
        </div>

        {activities.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No activities logged yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your wellness journey by logging your first activity.
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Your First Activity
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                      {activity.duration && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {activity.duration} minutes
                        </div>
                      )}
                    </div>
                    
                    {activity.notes && (
                      <p className="text-foreground mb-2">{activity.notes}</p>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(activity.logged_at)} at {formatTime(activity.logged_at)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ActivityLogs;