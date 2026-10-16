CREATE TABLE public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE,
  event_type text NOT NULL,
  user_id uuid,
  subscription_id text,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stripe_webhook_events_created_at ON public.stripe_webhook_events (created_at DESC);
CREATE INDEX idx_stripe_webhook_events_user_id ON public.stripe_webhook_events (user_id);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all webhook events"
  ON public.stripe_webhook_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));