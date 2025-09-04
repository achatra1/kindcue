import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingChat from '@/components/OnboardingChat';
import { WellnessChat } from '@/components/WellnessChat';
import { QuickStart } from '@/components/QuickStart';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LogOut, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, isFirstTimeUser } = useProfile(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  const handleQuickStart = (preferences: any) => {
    // TODO: Generate workout based on quick start preferences
    console.log('Quick start preferences:', preferences);
  };

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
          <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <img 
                  src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
                  alt="KindCue Logo" 
                  className="h-12 w-auto"
                />
              </div>
              
              <div className="flex items-center gap-2">
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

          <main className="flex-1 px-4 py-4 overflow-hidden">
            <div className="h-full space-y-4">
              {/* First Section - Chat Dialog */}
              <div className="h-1/3 min-h-[250px]">
                <WellnessChat 
                  profile={profile} 
                  userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
                />
              </div>

              {/* Second Section - Quick Start */}
              <div className="h-1/3 min-h-[200px]">
                <QuickStart 
                  profile={profile}
                  onQuickStart={handleQuickStart}
                />
              </div>

              {/* Third Section - Placeholder */}
              <div className="h-1/3 min-h-[200px]">
                <Card className="p-4 bg-card/95 backdrop-blur-sm border-border/50 h-full flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Section 3</h3>
                    <p className="text-muted-foreground text-sm">Coming soon...</p>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
