import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);

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
                  Welcome back, {user?.user_metadata?.display_name || profile?.display_name || user?.email}
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
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};