import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityStats {
  totalActiveHours: number;
  currentStreak: number;
  averageMood: number;
  daysSinceLastWorkout: number;
  totalWorkouts: number;
}

export const useActivityStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<ActivityStats>({
    totalActiveHours: 0,
    currentStreak: 0,
    averageMood: 0,
    daysSinceLastWorkout: 0,
    totalWorkouts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data: activities, error } = await supabase
          .from('activity_logs')
          .select('duration, notes, logged_at')
          .eq('user_id', userId)
          .order('logged_at', { ascending: false });

        if (error) {
          console.error('Error fetching activity stats:', error);
          setLoading(false);
          return;
        }

        if (!activities || activities.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate total active hours
        const totalMinutes = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
        const totalActiveHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

        // Calculate days since last workout
        const lastWorkoutDate = new Date(activities[0].logged_at);
        const today = new Date();
        const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate average mood from notes
        const moodRatings: number[] = [];
        activities.forEach(activity => {
          if (activity.notes) {
            const moodMatch = activity.notes.match(/Mood: (\d+)\/5/);
            if (moodMatch) {
              moodRatings.push(parseInt(moodMatch[1]));
            }
          }
        });
        const averageMood = moodRatings.length > 0 
          ? Math.round((moodRatings.reduce((sum, mood) => sum + mood, 0) / moodRatings.length) * 10) / 10
          : 0;

        // Calculate current streak (consecutive days with workouts)
        const workoutDates = activities.map(activity => {
          const date = new Date(activity.logged_at);
          return date.toDateString();
        });
        
        const uniqueDates = [...new Set(workoutDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        let currentStreak = 0;
        const todayStr = today.toDateString();
        const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString();
        
        // Check if we have a workout today or yesterday to start the streak
        if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
          let checkDate = new Date(today);
          
          // If no workout today, start from yesterday
          if (!uniqueDates.includes(todayStr)) {
            checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          }
          
          while (uniqueDates.includes(checkDate.toDateString())) {
            currentStreak++;
            checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
          }
        }

        setStats({
          totalActiveHours,
          currentStreak,
          averageMood,
          daysSinceLastWorkout,
          totalWorkouts: activities.length
        });

      } catch (error) {
        console.error('Error calculating activity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityStats();
  }, [userId]);

  return { stats, loading };
};