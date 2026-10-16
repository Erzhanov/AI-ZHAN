-- AI Lifestyle Coach profile safety fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blood_pressure text NOT NULL DEFAULT 'unknown'
    CHECK (blood_pressure IN ('high', 'low', 'normal', 'unknown'));

CREATE TABLE public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('lose_weight', 'gain_weight', 'maintain')),
  gender text NOT NULL CHECK (gender IN ('female', 'male', 'other')),
  age integer NOT NULL CHECK (age BETWEEN 10 AND 100),
  height_cm numeric NOT NULL CHECK (height_cm BETWEEN 80 AND 240),
  start_weight_kg numeric NOT NULL CHECK (start_weight_kg BETWEEN 25 AND 350),
  activity_level text NOT NULL CHECK (activity_level IN ('low', 'medium', 'high')),
  target_calories integer NOT NULL,
  target_protein_g integer NOT NULL,
  target_fat_g integer NOT NULL,
  target_carbs_g integer NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_channels jsonb NOT NULL DEFAULT '{"in_app": true, "browser": false, "telegram": false}'::jsonb,
  telegram_chat_id text,
  telegram_link_code uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_goals_telegram_link_code_idx
ON public.user_goals (telegram_link_code);

CREATE TABLE public.weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.user_goals(id) ON DELETE SET NULL,
  weight_kg numeric NOT NULL CHECK (weight_kg BETWEEN 25 AND 350),
  recorded_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.user_goals(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  calories integer NOT NULL,
  macros jsonb NOT NULL DEFAULT '{}'::jsonb,
  allergy_warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.user_goals(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  focus text NOT NULL,
  intensity text NOT NULL CHECK (intensity IN ('light', 'moderate', 'active')),
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_rest_day boolean NOT NULL DEFAULT false,
  safety_notes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.user_goals(id) ON DELETE SET NULL,
  completed_at date NOT NULL DEFAULT current_date,
  workout_done boolean NOT NULL DEFAULT false,
  water_done boolean NOT NULL DEFAULT false,
  meals_done boolean NOT NULL DEFAULT false,
  sleep_done boolean NOT NULL DEFAULT false,
  mood_score integer CHECK (mood_score BETWEEN 0 AND 5),
  ai_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, completed_at)
);

CREATE TABLE public.lifestyle_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.user_goals(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('meal', 'water', 'workout', 'sleep', 'weight', 'allergy', 'calorie')),
  channel text NOT NULL CHECK (channel IN ('in_app', 'browser', 'telegram')),
  scheduled_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Qyzylorda',
  message_template text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_type, channel)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id uuid REFERENCES public.lifestyle_reminders(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'browser', 'telegram')),
  title text NOT NULL,
  body text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.user_goals
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own weight history" ON public.weight_history
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own meal plans" ON public.meal_plans
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own workout plans" ON public.workout_plans
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own checkins" ON public.daily_checkins
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own reminders" ON public.lifestyle_reminders
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users insert own notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enqueue_lifestyle_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO public.notifications (user_id, reminder_id, channel, title, body, scheduled_for, metadata)
  SELECT
    r.user_id,
    r.id,
    r.channel,
    CASE r.reminder_type
      WHEN 'meal' THEN 'Тамақтану уақыты'
      WHEN 'water' THEN 'Су ішуді ұмытпаңыз'
      WHEN 'workout' THEN 'Бүгін жаттығу күніңіз'
      WHEN 'sleep' THEN 'Ұйқы режимі'
      ELSE 'AIZHAN ескертуі'
    END,
    r.message_template,
    (current_date + r.scheduled_time)::timestamptz,
    jsonb_build_object('reminder_type', r.reminder_type)
  FROM public.lifestyle_reminders r
  WHERE r.is_enabled = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.reminder_id = r.id
        AND n.scheduled_for::date = current_date
    );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION public.enqueue_lifestyle_notifications()
IS 'Call from a scheduler/cron once per day to create in-app, browser, and Telegram notification jobs.';
