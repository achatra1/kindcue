import { Home, Zap, Activity, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'quick-start', label: 'Quick Start', icon: Zap, path: '/quick-start' },
  { id: 'activity-logs', label: 'Activity', icon: Activity, path: '/activity-logs' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-10 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-1 px-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-0.5 px-0.5 transition-colors rounded-lg ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`h-3 w-3 mb-0.5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};