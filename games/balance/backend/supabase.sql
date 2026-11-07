create table if not exists public.balance_votes (
  vote_date date not null,
  voter_hash text not null check (length(voter_hash) = 64),
  choice text not null check (choice in ('A', 'B')),
  created_at timestamptz not null default now(),
  primary key (vote_date, voter_hash)
);

alter table public.balance_votes enable row level security;
revoke all on table public.balance_votes from anon, authenticated;

create or replace function public.get_balance_results(p_vote_date date)
returns table(choice text, total bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select v.choice, count(*)::bigint
  from public.balance_votes v
  where v.vote_date = p_vote_date
  group by v.choice;
$$;

create or replace function public.cast_balance_vote(
  p_vote_date date,
  p_choice text,
  p_voter_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_choice text;
  count_a bigint;
  count_b bigint;
begin
  if p_vote_date <> (now() at time zone 'Asia/Seoul')::date then
    raise exception '오늘 질문에만 투표할 수 있습니다';
  end if;
  if p_choice not in ('A', 'B') or p_voter_hash !~ '^[0-9a-f]{64}$' then
    raise exception '잘못된 투표입니다';
  end if;

  insert into public.balance_votes(vote_date, voter_hash, choice)
  values (p_vote_date, p_voter_hash, p_choice)
  on conflict (vote_date, voter_hash) do nothing;

  select v.choice into saved_choice
  from public.balance_votes v
  where v.vote_date = p_vote_date and v.voter_hash = p_voter_hash;

  select count(*) filter (where v.choice = 'A'), count(*) filter (where v.choice = 'B')
  into count_a, count_b
  from public.balance_votes v
  where v.vote_date = p_vote_date;

  return jsonb_build_object(
    'choice', saved_choice,
    'a_count', count_a,
    'b_count', count_b
  );
end;
$$;

revoke all on function public.get_balance_results(date) from public;
revoke all on function public.cast_balance_vote(date, text, text) from public;
grant execute on function public.get_balance_results(date) to anon;
grant execute on function public.cast_balance_vote(date, text, text) to anon;
