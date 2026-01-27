-- 커플 연결을 해제하고 모든 관련 데이터를 삭제하는 함수
create or replace function delete_couple_and_all_data()
returns void
language plpgsql
security definer
as $$
declare
  target_couple_id uuid;
begin
  -- 1. 현재 사용자의 couple_id 가져오기
  select couple_id into target_couple_id 
  from public.profiles 
  where id = auth.uid();

  -- 2. 커플 ID가 존재한다면 삭제 진행
  if target_couple_id is not null then
    -- couples 테이블에서 삭제하면 CASCADE 설정에 의해 
    -- diaries, visits, answers, point_history, attendances 등이 모두 자동 삭제됨
    delete from public.couples 
    where id = target_couple_id;
    
    -- profiles 테이블의 couple_id는 'on delete set null' 설정에 의해 
    -- 자동으로 null로 업데이트됨 (상대방 프로필 포함)
  else
    raise exception '연결된 커플 정보를 찾을 수 없습니다.';
  end if;
end;
$$;
