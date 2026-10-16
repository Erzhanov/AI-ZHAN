
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN phone text;

-- Create phone_verifications table for OTP
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Allow public insert (edge function uses service role, but just in case)
CREATE POLICY "Anyone can insert verifications"
ON public.phone_verifications
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public select for verification
CREATE POLICY "Anyone can read verifications"
ON public.phone_verifications
FOR SELECT
TO public
USING (true);

-- Allow public delete for cleanup
CREATE POLICY "Anyone can delete verifications"
ON public.phone_verifications
FOR DELETE
TO public
USING (true);
