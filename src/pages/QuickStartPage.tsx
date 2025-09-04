import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { QuickStart } from '@/components/QuickStart';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';

const QuickStartPage = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        <div className="h-[calc(100vh-200px)]">
          <div className="p-4 h-full">
            <QuickStart 
              profile={profile}
              userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuickStartPage;