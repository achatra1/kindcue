-- Update all functions to use empty search_path for security
-- This prevents potential schema-based attacks by removing default search paths

-- Update manage_favorite_workouts function
CREATE OR REPLACE FUNCTION public.manage_favorite_workouts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update calculate_session_duration function
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Calculate duration when session_end is set
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;