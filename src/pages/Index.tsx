import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingChat from '@/components/OnboardingChat';
import { WellnessChat } from '@/components/WellnessChat';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LogOut, Loader2 } from 'lucide-react';

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
            <div className="grid grid-rows-3 gap-8 h-full min-h-[calc(100vh-200px)]">
              {/* First Section - Chat Dialog */}
              <div className="row-span-1">
                <WellnessChat 
                  profile={profile} 
                  userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
                />
              </div>

              {/* Second Section - Placeholder */}
              <div className="row-span-1">
                <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50 h-full flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Section 2</h3>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </Card>
              </div>

              {/* Third Section - Placeholder */}
              <div className="row-span-1">
                <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50 h-full flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Section 3</h3>
                    <p className="text-muted-foreground">Coming soon...</p>
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
