create table if not exists rr26_puzzle (id bigserial primary key, lv int not null check (lv in (4,5,8)), name text not null check (char_length(name) between 1 and 20), team text check (team is null or char_length(team) <= 30), ms int not null check (ms between 3000 and 7200000), created_at timestamptz not null default now());
alter table rr26_puzzle enable row level security;
drop policy if exists "rr26 puzzle read" on rr26_puzzle;
create policy "rr26 puzzle read" on rr26_puzzle for select using (true);
create or replace function rr26_puzzle_add(p_lv int, p_name text, p_team text, p_ms int) returns bigint language plpgsql security definer set search_path = public as $$ declare v bigint; begin insert into rr26_puzzle (lv, name, team, ms) values (p_lv, left(trim(p_name), 20), nullif(left(trim(coalesce(p_team, '')), 30), ''), p_ms) returning id into v; return v; end $$;
create or replace function rr26_puzzle_del(p_id text, p_pw text, p_rid bigint) returns void language plpgsql security definer set search_path = public as $$ begin if not rr26_ok(p_id, p_pw) then raise exception 'not allowed'; end if; delete from rr26_puzzle where id = p_rid; end $$;
grant execute on function rr26_puzzle_add(int, text, text, int), rr26_puzzle_del(text, text, bigint) to anon, authenticated;
