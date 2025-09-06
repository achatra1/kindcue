-- Create favorite_workouts table for managing user's favorite workouts
CREATE TABLE public.favorite_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_title TEXT NOT NULL,
  workout_content TEXT NOT NULL,
  workout_duration INTEGER, -- duration in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_workouts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorite workouts" 
ON public.favorite_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite workouts" 
ON public.favorite_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite workouts" 
ON public.favorite_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite workouts" 
ON public.favorite_workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to manage favorite workout limit (max 8)
CREATE OR REPLACE FUNCTION public.manage_favorite_workouts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workout_count INTEGER;
  oldest_workout_id UUID;
BEGIN
  -- Count current favorite workouts for this user
  SELECT COUNT(*) INTO workout_count
  FROM public.favorite_workouts
  WHERE user_id = NEW.user_id;

  -- If we have 8 or more workouts, delete the oldest one
  IF workout_count >= 8 THEN
    SELECT id INTO oldest_workout_id
    FROM public.favorite_workouts
    WHERE user_id = NEW.user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    DELETE FROM public.favorite_workouts
    WHERE id = oldest_workout_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to manage favorite workout limit
CREATE TRIGGER manage_favorite_workouts_trigger
  BEFORE INSERT ON public.favorite_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_favorite_workouts();