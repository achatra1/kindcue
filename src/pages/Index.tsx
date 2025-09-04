import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingChat from '@/components/OnboardingChat';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Heart, LogOut, Loader2, Activity, Target, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, isFirstTimeUser } = useProfile(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!profileLoading && isFirstTimeUser) {
      setShowOnboarding(true);
    }
  }, [profileLoading, isFirstTimeUser]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /auth
  }

  if (showOnboarding && user) {
    return (
      <OnboardingChat
        onComplete={() => setShowOnboarding(false)}
        userId={user.id}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-warm">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <img 
                  src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
                  alt="KindCue Logo" 
                  className="h-16 w-auto"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome back, {user.user_metadata?.display_name || profile?.display_name || user.email}
                </span>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                  Welcome to your wellness journey
                </h1>
                <p className="text-lg text-muted-foreground">
                  Every step forward is a victory. Let's make today count with gentle, compassionate self-care.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Quick Check-in</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    How are you feeling today? Let's start with a gentle assessment of your current state.
                  </p>
                  <Button className="w-full bg-gradient-safety hover:opacity-90 transition-opacity">
                    Start Check-in
                  </Button>
                </Card>
                
                <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Today's Goal</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Set a small, achievable wellness goal for today. Remember, progress over perfection.
                  </p>
                  <Button variant="outline" className="w-full">
                    Set Daily Goal
                  </Button>
                </Card>

                <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Your Progress</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Celebrate your journey so far. Every small step is meaningful progress.
                  </p>
                  <Button variant="secondary" className="w-full">
                    View Progress
                  </Button>
                </Card>
              </div>

              <Card className="p-8 bg-card/95 backdrop-blur-sm border-border/50 text-center">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Ready for something new?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Explore personalized wellness activities, track your progress, or discover something unexpected to brighten your day. 
                  Your wellness journey is unique, and we're here to support you every step of the way.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button onClick={() => navigate('/surprise')} className="gap-2 bg-gradient-encouragement hover:opacity-90">
                    <Heart className="h-4 w-4" />
                    Surprise Me
                  </Button>
                  <Button onClick={() => navigate('/activity-logs')} variant="outline" className="gap-2">
                    <Activity className="h-4 w-4" />
                    View Activities
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
