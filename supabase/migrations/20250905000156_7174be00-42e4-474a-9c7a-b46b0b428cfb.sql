-- Create mood_logs table for tracking daily mood
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
  mood_emoji TEXT NOT NULL,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mood logs" 
ON public.mood_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood logs" 
ON public.mood_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs" 
ON public.mood_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs" 
ON public.mood_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Insert some sample mood data for testing (last 30 days)
INSERT INTO public.mood_logs (user_id, mood_value, mood_emoji, notes, logged_at) VALUES
-- Note: These will only work if there are existing users, otherwise they will be ignored
(
  (SELECT id FROM auth.users LIMIT 1),
  4,
  '😊',
  'Feeling good today!',
  now() - interval '1 day'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  5,
  '😄',
  'Amazing day!',
  now() - interval '3 days'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  3,
  '😐',
  'Okay day',
  now() - interval '7 days'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  4,
  '😊',
  'Pretty good',
  now() - interval '10 days'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  2,
  '😟',
  'Not great',
  now() - interval '15 days'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  4,
  '😊',
  'Better day',
  now() - interval '20 days'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  5,
  '😄',
  'Excellent!',
  now() - interval '25 days'
);