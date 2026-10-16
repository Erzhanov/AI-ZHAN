ALTER TABLE public.user_goals
  ADD COLUMN IF NOT EXISTS telegram_link_code uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS user_goals_telegram_link_code_idx
ON public.user_goals (telegram_link_code);
