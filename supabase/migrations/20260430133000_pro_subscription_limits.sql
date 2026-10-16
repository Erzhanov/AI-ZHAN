-- Pro subscriptions and chat limits
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS pro_payment_provider text,
  ADD COLUMN IF NOT EXISTS pro_payment_reference text;

CREATE INDEX IF NOT EXISTS profiles_subscription_plan_idx
ON public.profiles (subscription_plan);

CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND subscription_plan = 'pro'
      AND (pro_expires_at IS NULL OR pro_expires_at > now())
  )
$$;

COMMENT ON COLUMN public.profiles.subscription_plan
IS 'Free users are limited through public.ai_usage_limits; Pro users have unlimited AI questions.';

COMMENT ON COLUMN public.profiles.pro_payment_provider
IS 'Payment provider identifier, for example kaspi, cloudpayments, stripe, wayforpay, manual.';
