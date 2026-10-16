
-- Lock down user_roles: only admins can modify; deny everyone else explicitly via restrictive policy
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrictive policy: only admins may write to user_roles (defence in depth against permissive policies added later)
CREATE POLICY "Only admins may modify user_roles" ON public.user_roles
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (
    CASE
      WHEN current_setting('request.method', true) IS NULL THEN true
      ELSE public.has_role(auth.uid(), 'admin'::app_role)
    END
  )
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Purchases: ensure no updates/deletes by anyone (default deny already, but make explicit with restrictive policy)
CREATE POLICY "Purchases are immutable for users" ON public.purchases
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Purchases cannot be deleted by users" ON public.purchases
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);
