import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingChat from '@/components/OnboardingChat';
import { WellnessChat } from '@/components/WellnessChat';
import { ActivityDashboard } from '@/components/ActivityDashboard';
import { LogOut, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, isFirstTimeUser } = useProfile(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wellnessChatStep, setWellnessChatStep] = useState('input');
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
    <div className="flex flex-col h-screen bg-gradient-warm">
      {/* Header */}
      <header className="shrink-0 px-4 py-2 safe-area-inset-top">
        <div className="flex justify-between items-center">
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img 
                src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
                alt="KindCue Logo" 
                className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          
          <div className="absolute right-4 flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:block max-w-20 truncate">
              {user.user_metadata?.display_name || profile?.display_name || user.email}
            </span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-1 h-8 px-2"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-2 overflow-hidden pb-32">
        <div className="h-full flex flex-col">
          {/* Chat Section */}
          <div className="flex-1 min-h-0">
            <WellnessChat 
              profile={profile} 
              userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
              userId={user.id}
              onStepChange={setWellnessChatStep}
            />
          </div>
          
          {/* Activity Dashboard */}
          {wellnessChatStep === 'input' && (
            <div className="mt-4 shrink-0">
              <ActivityDashboard />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
