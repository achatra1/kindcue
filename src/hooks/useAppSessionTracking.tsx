import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAppSessionTracking = (userId: string | undefined) => {
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!userId) return;

    const startSession = async () => {
      try {
        const { data, error } = await supabase
          .from('app_sessions')
          .insert({
            user_id: userId,
            session_start: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error starting session:', error);
          return;
        }

        sessionIdRef.current = data.id;
        lastActivityRef.current = new Date();
      } catch (error) {
        console.error('Error starting session:', error);
      }
    };

    const endSession = async () => {
      if (!sessionIdRef.current) return;

      try {
        await supabase
          .from('app_sessions')
          .update({
            session_end: new Date().toISOString()
          })
          .eq('id', sessionIdRef.current);

        sessionIdRef.current = null;
      } catch (error) {
        console.error('Error ending session:', error);
      }
    };

    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    // Start session when component mounts
    startSession();

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity every 30 seconds
    const inactivityTimer = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();
      
      // If inactive for more than 5 minutes, end session
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        endSession();
      }
    }, 30000);

    // End session when user leaves
    const handleBeforeUnload = () => {
      endSession();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start a timer to end session if page stays hidden for too long
        setTimeout(() => {
          if (document.hidden) {
            endSession();
          }
        }, 2 * 60 * 1000); // 2 minutes
      } else {
        // Page became visible again, restart session if needed
        if (!sessionIdRef.current) {
          startSession();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      endSession();
      clearInterval(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  return null; // This hook doesn't return any UI
};