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
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <header className="shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img 
                src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
                alt="KindCue Logo" 
                className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
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
      <main className="px-4 py-4 overflow-hidden">
        <div className="h-full">
          {/* First Section - Chat Dialog and Activity Dashboard */}
          <div className="h-full min-h-[500px]">
            <div className="p-4 h-full flex flex-col">
              <div className="flex-1">
                <WellnessChat 
                  profile={profile} 
                  userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
                  userId={user.id}
                  onStepChange={setWellnessChatStep}
                />
              </div>
              {wellnessChatStep === 'input' && (
                <div className="mt-4">
                  <ActivityDashboard />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
