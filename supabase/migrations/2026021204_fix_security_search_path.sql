-- 1. handle_new_user_notification_settings 함수 보안 강화
ALTER FUNCTION public.handle_new_user_notification_settings() 
SET search_path = public;

-- 2. handle_notification_trigger 함수 보안 강화
ALTER FUNCTION public.handle_notification_trigger() 
SET search_path = public;

-- 3. update_updated_at_column 함수 보안 강화
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public;
