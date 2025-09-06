import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Calendar, Clock, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  activity_type: string;
  duration: number | null;
  notes: string | null;
  logged_at: string;
}

const ActivityLogs = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
      setActivitiesLoading(false);
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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex-1 flex justify-center">
            <img 
              src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
              alt="KindCue Logo" 
              className="h-24 w-auto"
            />
          </div>
          
          <div className="absolute right-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.user_metadata?.display_name || profile?.display_name || user.email}
            </span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
            </div>
          </div>

          {activitiesLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No activities logged yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete workouts through the app to see your activity history here.
              </p>
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
      </main>
    </div>
  );
};

export default ActivityLogs;