-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It creates the table, locks down what the public key can do, and adds the
-- one function the Helpful button calls.

create table if not exists public.tips (
  id            bigint generated always as identity primary key,
  code          text not null,
  author        text,
  instructor    text,
  difficulty    smallint check (difficulty between 1 and 5),
  body          text not null,
  helpful_count integer not null default 0,
  created_at    timestamptz not null default now(),

  -- The database refuses anything that isn't a canonical course code, so a
  -- stray "ENG 111" can never create a second thread even if someone bypasses
  -- the page and posts straight to the API.
  constraint code_is_canonical check (code ~ '^[A-Z]{2,4}-[0-9]{3}[A-Z]?$'),
  constraint body_length check (char_length(body) between 20 and 5000),
  constraint author_length check (author is null or char_length(author) <= 40),
  constraint instructor_length check (instructor is null or char_length(instructor) <= 60)
);

create index if not exists tips_code_idx on public.tips (code, created_at desc);

-- Row Level Security is what makes it safe to ship the anon key in JavaScript.
-- With it on, the key can do only what the policies below allow.
alter table public.tips enable row level security;

drop policy if exists "anyone can read tips" on public.tips;
create policy "anyone can read tips"
  on public.tips for select
  to anon
  using (true);

drop policy if exists "anyone can add a tip" on public.tips;
create policy "anyone can add a tip"
  on public.tips for insert
  to anon
  with check (helpful_count = 0);

-- Deliberately absent: update and delete policies. Without them, nobody with
-- the public key can edit or erase another student's tip. You moderate from
-- the Supabase table editor, where you're signed in as the owner.

-- The Helpful button needs to bump one integer without an update policy, so it
-- goes through this function instead. security definer lets the function do the
-- write; the body limits it to that single column.
create or replace function public.increment_helpful(tip_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tips set helpful_count = helpful_count + 1 where id = tip_id;
$$;

grant execute on function public.increment_helpful(bigint) to anon;

-- Optional: a few example tips so the site isn't empty on day one.
insert into public.tips (code, author, instructor, difficulty, body) values
  ('ENG-111', 'Priya', 'Ms. Alvarez', 2, 'The four essays are graded on the rubric she hands out in week one, not on how good the writing sounds. Print it and check every box before submitting. Drafts are worth as much as finals.'),
  ('ENG-111', null, null, 3, 'Discussion posts close Sunday at 11:59pm and there is no late credit. Set a phone reminder for Saturday morning and you keep an easy A.'),
  ('CSC-251', 'Marcus', 'Dr. Whitfield', 4, 'Data structures moves fast after the linked list unit. Start the assignments the day they are posted, and go to the Wednesday tutoring hours in the Hall building even when you think you understand it.'),
  ('MAT-271', null, null, 5, 'Calculus I here covers limits through the fundamental theorem in 16 weeks. If your trig is rusty, spend the first weekend reviewing the unit circle. Everything after related rates assumes it.'),
  ('PSY-150', 'Dana', null, 2, 'Three exams, all multiple choice, all drawn straight from the study guides. The textbook is optional if you take good notes in lecture.');
