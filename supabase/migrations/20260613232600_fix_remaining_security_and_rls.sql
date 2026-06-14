-- Fix 1: Restore search_path security on handle_notification_trigger
ALTER FUNCTION public.handle_notification_trigger() SET search_path = public;

-- Fix 4: Optimize visits DELETE policy by wrapping get_auth_couple_id() in a scalar subquery
DROP POLICY IF EXISTS "Writers can delete their own visits" ON "public"."visits";
CREATE POLICY "Writers can delete their own visits"
ON "public"."visits" AS permissive FOR DELETE TO public
USING (
  (writer_id = (SELECT auth.uid())) 
  OR 
  (writer_id IS NULL AND place_id IN (
    SELECT id FROM public.places WHERE couple_id = (SELECT public.get_auth_couple_id())
  ))
);
