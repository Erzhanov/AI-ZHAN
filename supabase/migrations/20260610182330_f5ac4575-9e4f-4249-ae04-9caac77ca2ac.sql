CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, subscription_plan, pro_expires_at, pro_payment_provider, pro_payment_reference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'pro',
    now() + interval '3 days',
    'welcome_gift',
    'signup_3day_trial'
  );
  RETURN NEW;
END;
$function$;

UPDATE public.profiles
SET subscription_plan = 'pro',
    pro_expires_at = now() + interval '3 days',
    pro_payment_provider = 'welcome_gift',
    pro_payment_reference = 'signup_3day_trial',
    updated_at = now()
WHERE (subscription_plan IS NULL OR subscription_plan = 'free')
  AND pro_expires_at IS NULL;
