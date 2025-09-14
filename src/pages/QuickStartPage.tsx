import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      <main className="flex-1 overflow-y-auto px-4 py-2 pb-32">
        <QuickStart 
          profile={profile}
          userName={user.user_metadata?.display_name || profile?.display_name || user.email || 'Friend'}
          userId={user.id}
        />
      </main>
    </div>
  );
};

export default QuickStartPage;