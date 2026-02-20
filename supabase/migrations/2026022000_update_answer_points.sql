-- Update Daily Question Answer points from 10 to 30
create or replace function public.add_couple_points()
returns trigger language plpgsql security definer 
set search_path = public
as $$
declare
  target_couple_id uuid;
  point_type text;
  point_val int;
  desc_text text;
begin
  if (tg_op = 'DELETE') then
    return old;
  end if;

  if tg_table_name = 'answers' then
    target_couple_id := new.couple_id; point_type := 'answer'; point_val := 30; desc_text := '오늘의 질문 답변 완료';
  
  elsif tg_table_name = 'places' then
    if new.status = 'wishlist' then 
      target_couple_id := new.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || new.name; 
    else 
      return new; 
    end if;
  
  elsif tg_table_name = 'visits' then
    select couple_id into target_couple_id from public.places where id = new.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  elsif tg_table_name = 'attendances' then
    target_couple_id := new.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  elsif tg_table_name = 'visit_comments' then
    select p.couple_id into target_couple_id 
    from public.visits v
    join public.places p on v.place_id = p.id
    where v.id = new.visit_id;
    point_type := 'visit_comment'; point_val := 3; desc_text := '방문 인증 댓글 작성';
  end if;

  if target_couple_id is not null then
    insert into public.point_history (couple_id, type, points, description) 
    values (target_couple_id, point_type, point_val, desc_text);
  end if;
  
  return new;
end;
$$;
