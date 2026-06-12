-- 1. Fix Function Search Path Mutable
ALTER FUNCTION public.handle_new_user_from_id(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_game_sessions() SET search_path = public;
ALTER FUNCTION public.handle_notification_trigger() SET search_path = public;
ALTER FUNCTION public.calculate_level_from_points(bigint) SET search_path = public;
ALTER FUNCTION public.handle_timetable_updated_at() SET search_path = public;
ALTER FUNCTION public.add_couple_points() SET search_path = public;

-- 2. Fix Public Bucket Allows Listing
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view visit photos" ON storage.objects;

-- 3. Secure Trigger Functions (Prevent manual execution via REST API)
-- Only targeting the exact trigger functions flagged in the Security Advisor payload
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_notification_settings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_notification_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_couple_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_push_notification() FROM PUBLIC;

-- 4. Secure RPC Functions (Allow authenticated users, block anon/public)
-- Only targeting the exact RPC functions flagged in the Security Advisor payload
REVOKE EXECUTE ON FUNCTION public.add_debug_points(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_debug_points(integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_blind_timer_reward(uuid, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_blind_timer_reward(uuid, double precision) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_game_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_game_sessions() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_couple_and_link_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_couple_and_link_profile(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_couple_and_all_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_couple_and_all_data() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_app_init_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_app_init_data() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_couple_id_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_couple_id_by_code(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_couple_points_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_couple_points_summary(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_couple_total_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_couple_total_points(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.join_couple_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_couple_by_code(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.purchase_item(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_item(text, integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_blind_timer_start(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_blind_timer_start(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_blind_timer_stop(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_blind_timer_stop(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_game_result(text, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_game_result(text, integer, boolean) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.start_blind_timer_game() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_blind_timer_game() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.toggle_visit_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_visit_like(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.trigger_level_up_notification(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_level_up_notification(integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.use_item(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_item(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_visit(uuid, date, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_visit(uuid, date, text, text, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_from_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user_from_id(uuid) TO authenticated, service_role;
