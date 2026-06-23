-- 그림 답변 테이블
CREATE TABLE public.drawing_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  writer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,
  question_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (couple_id, writer_id, question_date)
);

ALTER TABLE public.drawing_answers ENABLE ROW LEVEL SECURITY;

-- RLS: 커플 멤버 조회 (기존 answers: "Couples can view their answers" 패턴 일치)
CREATE POLICY "Couples can view their drawing answers"
  ON public.drawing_answers AS PERMISSIVE FOR SELECT TO public
  USING (couple_id = public.get_auth_couple_id());

-- RLS: 본인만 삽입 + couple_id 위조 방지 (기존 answers: "Users can answer for their couple" 패턴 일치)
CREATE POLICY "Users can submit drawing for their couple"
  ON public.drawing_answers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    (SELECT auth.uid()) = writer_id
    AND couple_id = public.get_auth_couple_id()
  );

-- RLS: 본인만 삭제
CREATE POLICY "Users can delete their own drawings"
  ON public.drawing_answers AS PERMISSIVE FOR DELETE TO public
  USING ((SELECT auth.uid()) = writer_id);

-- 권한 부여 (기존 테이블들과 동일)
GRANT ALL ON TABLE public.drawing_answers TO anon;
GRANT ALL ON TABLE public.drawing_answers TO authenticated;
GRANT ALL ON TABLE public.drawing_answers TO service_role;

-- 'drawings' 버킷 생성 (public: true → getPublicUrl()로 RLS 우회 읽기 가능)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('drawings', 'drawings', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증 유저만 업로드, 본인 파일만 삭제
CREATE POLICY "drawings_bucket_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drawings');

CREATE POLICY "drawings_bucket_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'drawings' AND auth.uid() = owner);

-- owner-based SELECT (upload RETURNING 동작에 필요, fix_storage_rls_policies 패턴)
CREATE POLICY "drawings_bucket_select_owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'drawings' AND auth.uid() = owner);
