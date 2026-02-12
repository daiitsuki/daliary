-- notification_settings 테이블에 세부 설정 컬럼 추가
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS notify_question_answered BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_question_request BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_schedule_change BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_place_added BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_visit_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_level_up BOOLEAN DEFAULT TRUE;

-- 기존 유저들의 기본값을 TRUE로 설정 (전체 알림이 켜져있을 때 기본적으로 다 받도록)
UPDATE public.notification_settings 
SET 
    notify_question_answered = TRUE,
    notify_question_request = TRUE,
    notify_schedule_change = TRUE,
    notify_place_added = TRUE,
    notify_visit_verified = TRUE,
    notify_level_up = TRUE
WHERE notify_question_answered IS NULL;
