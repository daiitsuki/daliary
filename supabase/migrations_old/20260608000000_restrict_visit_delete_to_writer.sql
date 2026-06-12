-- visits 테이블의 DELETE 정책을 강화합니다.
-- 기존: 커플의 장소에 속한 visit이면 누구나 삭제 가능
-- 변경: 본인이 직접 작성한 visit(writer_id = auth.uid())만 삭제 가능
--
-- writer_id가 NULL인 기존 데이터 대응:
-- writer_id가 NULL이면 기존 커플 정책(couple_id 일치)을 fallback으로 허용합니다.
-- 새로 생성되는 visit은 verify_visit RPC에서 항상 writer_id가 설정됩니다.

DROP POLICY IF EXISTS "Couples can delete visits for their places" ON "public"."visits";

CREATE POLICY "Writers can delete their own visits"
  ON "public"."visits"
  FOR DELETE
  USING (
    -- 본인이 작성한 경우 (writer_id 있음)
    writer_id = auth.uid()
    OR
    -- writer_id가 NULL인 레거시 데이터는 기존처럼 커플 멤버라면 삭제 가능
    (writer_id IS NULL AND place_id IN (
      SELECT places.id
      FROM public.places
      WHERE places.couple_id = public.get_auth_couple_id()
    ))
  );
