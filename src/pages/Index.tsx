import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingChat from '@/components/OnboardingChat';
import { Heart, LogOut, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-warm">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">KindCue</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {user.user_metadata?.display_name || user.email}
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

      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Your Wellness Journey Starts Here
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Take a gentle step forward today. Every moment of self-care matters, and we're here to support you with compassion and understanding.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-card rounded-lg p-6 shadow-gentle border border-border/50">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Quick Check-in</h3>
              <p className="text-muted-foreground mb-4">
                How are you feeling today? Let's start with a gentle assessment.
              </p>
              <Button className="bg-gradient-safety hover:opacity-90 transition-opacity">
                Start Check-in
              </Button>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-gentle border border-border/50">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Gentle Movement</h3>
              <p className="text-muted-foreground mb-4">
                Discover short, nurturing exercises that fit your current energy level.
              </p>
              <Button className="bg-gradient-encouragement hover:opacity-90 transition-opacity">
                Find Movement
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
