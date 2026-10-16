CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove old job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('expire-pro-trials');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-pro-trials',
  '*/15 * * * *',
  $$
  UPDATE public.profiles
  SET subscription_plan = 'free',
      updated_at = now()
  WHERE subscription_plan = 'pro'
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < now();
  $$
);

-- Run once immediately to clean up any already-expired rows
UPDATE public.profiles
SET subscription_plan = 'free', updated_at = now()
WHERE subscription_plan = 'pro'
  AND pro_expires_at IS NOT NULL
  AND pro_expires_at < now();
