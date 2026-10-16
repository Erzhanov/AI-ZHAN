-- 12-hour AI usage windows for non-Pro users.
CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count BETWEEN 0 AND 5),
  limit_exhausted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI usage limits"
ON public.ai_usage_limits
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.ai_usage_limits
IS 'Stores the current 12-hour Free AI usage window. Free users get 5 questions per window; Pro users are unlimited.';

COMMENT ON COLUMN public.ai_usage_limits.limit_exhausted_at
IS 'Set when the user reaches the 5-question Free limit; the next window opens 12 hours after window_started_at.';
