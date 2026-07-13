-- 1. 무제한 텍스트 폭탄 방지 (글자수 제한 강제)
ALTER TABLE public.relay_novel_turns ADD CONSTRAINT check_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 500);

-- 2. 100턴 초과 절대 방지
ALTER TABLE public.relay_novels ADD CONSTRAINT check_turn_count CHECK (turn_count <= 100);

-- 3. 동시에 2개의 소설을 진행하는 것 방지 (1커플 1진행중 소설 보장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_ongoing_novel ON public.relay_novels(couple_id) WHERE status = 'ongoing';
