-- Extend profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS allergies TEXT[],
  ADD COLUMN IF NOT EXISTS blood_pressure JSONB;

-- Allow admins to view all profiles via existing policy is fine.

-- chat_messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL DEFAULT 'medical',
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all chats" ON public.chat_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);

-- medicine_searches
CREATE TABLE public.medicine_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.medicine_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own searches" ON public.medicine_searches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own searches" ON public.medicine_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all searches" ON public.medicine_searches
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_usage_limits
CREATE TABLE public.ai_usage_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_count INTEGER NOT NULL DEFAULT 0,
  limit_exhausted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage_limits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.ai_usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.ai_usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_goals
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  height_cm NUMERIC NOT NULL,
  start_weight_kg NUMERIC NOT NULL,
  activity_level TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_fat_g INTEGER,
  target_carbs_g INTEGER,
  plan_data JSONB,
  notification_channels JSONB,
  telegram_chat_id TEXT,
  telegram_link_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- weight_history
CREATE TABLE public.weight_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID,
  weight_kg NUMERIC NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weights" ON public.weight_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_weight_history_user ON public.weight_history(user_id, recorded_at DESC);

-- daily_checkins
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_done BOOLEAN NOT NULL DEFAULT false,
  water_done BOOLEAN NOT NULL DEFAULT false,
  meals_done BOOLEAN NOT NULL DEFAULT false,
  sleep_done BOOLEAN NOT NULL DEFAULT false,
  mood_score INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, completed_at)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkins" ON public.daily_checkins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_daily_checkins_updated_at
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lifestyle_reminders
CREATE TABLE public.lifestyle_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID,
  reminder_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  scheduled_time TIME,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  message_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reminder_type, channel)
);
ALTER TABLE public.lifestyle_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders" ON public.lifestyle_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_lifestyle_reminders_updated_at
  BEFORE UPDATE ON public.lifestyle_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- phone_verifications
CREATE TABLE public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only access; no permissive policies for normal users.
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone, created_at DESC);

-- Add subscription columns referenced by stripe-webhook (already exists, but safety)
-- profiles has subscription_plan, pro_expires_at, pro_payment_provider, pro_payment_reference already.
