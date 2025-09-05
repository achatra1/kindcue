import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MoodLog {
  id: string;
  mood_value: number;
  mood_emoji: string;
  notes: string | null;
  logged_at: string;
}

interface MoodSummary {
  averageMood: number;
  dominantEmoji: string;
  motivationalMessage: string;
  moodCount: number;
}

export const useMoodData = (userId: string | undefined) => {
  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMoodData = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('logged_at', thirtyDaysAgo.toISOString())
          .order('logged_at', { ascending: false });

        if (error) {
          console.error('Error fetching mood data:', error);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          // Default mood summary when no data
          setMoodSummary({
            averageMood: 4,
            dominantEmoji: '😊',
            motivationalMessage: "Start tracking your mood to see your wellness journey!",
            moodCount: 0
          });
          setLoading(false);
          return;
        }

        // Calculate mood summary
        const moodLogs = data as MoodLog[];
        const totalMood = moodLogs.reduce((sum, log) => sum + log.mood_value, 0);
        const averageMood = totalMood / moodLogs.length;

        // Find most common emoji
        const emojiCounts = moodLogs.reduce((counts, log) => {
          counts[log.mood_emoji] = (counts[log.mood_emoji] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);

        const dominantEmoji = Object.entries(emojiCounts).reduce((a, b) => 
          emojiCounts[a[0]] > emojiCounts[b[0]] ? a : b
        )[0];

        // Generate motivational message based on average mood
        let motivationalMessage = "";
        if (averageMood >= 4.5) {
          motivationalMessage = "You're radiating positivity! Keep this amazing energy flowing! ✨";
        } else if (averageMood >= 4) {
          motivationalMessage = "Your mood has been great lately! You're doing wonderful things! 🌟";
        } else if (averageMood >= 3.5) {
          motivationalMessage = "You're maintaining good balance. Every step forward counts! 💪";
        } else if (averageMood >= 3) {
          motivationalMessage = "You're showing resilience. Brighter days are ahead! 🌅";
        } else if (averageMood >= 2.5) {
          motivationalMessage = "Every day is a new opportunity to feel better. You've got this! 🤗";
        } else {
          motivationalMessage = "You're being brave by tracking your feelings. Healing takes time. 💙";
        }

        setMoodSummary({
          averageMood,
          dominantEmoji,
          motivationalMessage,
          moodCount: moodLogs.length
        });
      } catch (error) {
        console.error('Error processing mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [userId]);

  return { moodSummary, loading };
};