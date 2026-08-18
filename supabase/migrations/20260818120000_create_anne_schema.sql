begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Content source registry
-- ------------------------------------------------------------

create table if not exists public.anne_content_sources (
  source_id text primary key,
  title text not null,
  source_type text not null default 'book'
    check (source_type in ('book', 'worksheet', 'import', 'other')),
  source_url text,
  license_label text,
  sample_limit smallint not null default 20
    check (sample_limit between 1 and 100),
  enabled boolean not null default true,
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anne_content_sources_enabled_idx
  on public.anne_content_sources (enabled, display_order);

-- ------------------------------------------------------------
-- Source sentence registry
-- One English sentence = one source row = one learning record.
-- ------------------------------------------------------------

create table if not exists public.anne_source_sentences (
  sentence_id uuid primary key default gen_random_uuid(),
  source_id text not null references public.anne_content_sources(source_id) on delete cascade,
  source_index integer not null check (source_index > 0),
  source_row integer not null check (source_row > 0),
  source_date date,
  source_text text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_index),
  unique (source_id, source_row)
);

create index if not exists anne_source_sentences_source_idx
  on public.anne_source_sentences (source_id, source_index);
create index if not exists anne_source_sentences_row_idx
  on public.anne_source_sentences (source_row);

-- ------------------------------------------------------------
-- Learning output row
-- ------------------------------------------------------------

create table if not exists public.anne_sentence_learning (
  learning_id uuid primary key default gen_random_uuid(),
  sentence_id uuid not null references public.anne_source_sentences(sentence_id) on delete cascade unique,
  p_ko text not null default '',
  question_count smallint not null default 0 check (question_count between 0 and 1),
  q_en text,
  q_ko text,
  choice_1_en text,
  choice_1_ko text,
  choice_2_en text,
  choice_2_ko text,
  choice_3_en text,
  choice_3_ko text,
  choice_4_en text,
  choice_4_ko text,
  answer smallint check (answer between 1 and 4),
  explanation_en text,
  explanation_ko text,
  translation_note text,
  status text not null default 'draft'
    check (status in ('draft', 'no_question', 'question_ok', 'needs_review', 'published', 'failed')),
  qa_status text not null default 'pending'
    check (qa_status in ('pending', 'pass', 'warn', 'fail')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anne_sentence_learning_status_idx
  on public.anne_sentence_learning (status, qa_status);

-- ------------------------------------------------------------
-- Chunk selection
-- ------------------------------------------------------------

create table if not exists public.anne_sentence_chunks (
  chunk_id uuid primary key default gen_random_uuid(),
  sentence_id uuid not null references public.anne_source_sentences(sentence_id) on delete cascade,
  chunk_order smallint not null check (chunk_order between 1 and 5),
  chunk_en text not null,
  chunk_ko text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sentence_id, chunk_order),
  unique (sentence_id, chunk_en)
);

create index if not exists anne_sentence_chunks_sentence_idx
  on public.anne_sentence_chunks (sentence_id, chunk_order);

-- ------------------------------------------------------------
-- QA / review trail
-- ------------------------------------------------------------

create table if not exists public.anne_sentence_reviews (
  review_id uuid primary key default gen_random_uuid(),
  sentence_id uuid not null references public.anne_source_sentences(sentence_id) on delete cascade unique,
  translation_check text,
  question_check text,
  chunk_check text,
  source_issue text,
  note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Pipeline run and checkpoint tracking
-- ------------------------------------------------------------

create table if not exists public.anne_pipeline_runs (
  run_id uuid primary key default gen_random_uuid(),
  source_id text not null references public.anne_content_sources(source_id) on delete cascade,
  input_file text,
  test_limit integer,
  last_source_index integer,
  last_source_row integer,
  output_rows integer not null default 0,
  checkpoint jsonb not null default '{}'::jsonb,
  status text not null default 'running'
    check (status in ('running', 'completed', 'interrupted', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists anne_pipeline_runs_source_idx
  on public.anne_pipeline_runs (source_id, started_at desc);

create table if not exists public.anne_import_batches (
  batch_id text primary key,
  source_id text not null references public.anne_content_sources(source_id) on delete cascade,
  input_path text,
  source_hash text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- ------------------------------------------------------------
-- Access control
-- ------------------------------------------------------------

create table if not exists public.anne_entitlements (
  entitlement_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null references public.anne_content_sources(source_id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'expired', 'trial', 'refunded')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id)
);

create index if not exists anne_entitlements_user_idx
  on public.anne_entitlements (user_id, status);

create table if not exists public.anne_reader_progress (
  progress_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null references public.anne_content_sources(source_id) on delete cascade,
  sentence_id uuid references public.anne_source_sentences(sentence_id) on delete cascade,
  last_action text not null default 'view'
    check (last_action in ('view', 'listen', 'quiz', 'bookmark')),
  position_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, source_id)
);

create table if not exists public.anne_bookmarks (
  bookmark_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sentence_id uuid not null references public.anne_source_sentences(sentence_id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, sentence_id)
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.anne_content_sources enable row level security;
alter table public.anne_source_sentences enable row level security;
alter table public.anne_sentence_learning enable row level security;
alter table public.anne_sentence_chunks enable row level security;
alter table public.anne_sentence_reviews enable row level security;
alter table public.anne_pipeline_runs enable row level security;
alter table public.anne_import_batches enable row level security;
alter table public.anne_entitlements enable row level security;
alter table public.anne_reader_progress enable row level security;
alter table public.anne_bookmarks enable row level security;

grant select on public.anne_content_sources to anon, authenticated;

drop policy if exists "Public can read enabled anne sources" on public.anne_content_sources;
create policy "Public can read enabled anne sources"
  on public.anne_content_sources
  for select
  to anon, authenticated
  using (enabled);

drop policy if exists "Authenticated users can read enabled anne sentences" on public.anne_source_sentences;
create policy "Authenticated users can read enabled anne sentences"
  on public.anne_source_sentences
  for select
  to authenticated
  using (
    enabled
    and exists (
      select 1
      from public.anne_content_sources source
      where source.source_id = anne_source_sentences.source_id
        and source.enabled
    )
  );

drop policy if exists "Authenticated users can read anne learning rows" on public.anne_sentence_learning;
create policy "Authenticated users can read anne learning rows"
  on public.anne_sentence_learning
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anne_source_sentences s
      join public.anne_content_sources source on source.source_id = s.source_id
      where s.sentence_id = anne_sentence_learning.sentence_id
        and s.enabled
        and source.enabled
    )
  );

drop policy if exists "Authenticated users can read anne chunks" on public.anne_sentence_chunks;
create policy "Authenticated users can read anne chunks"
  on public.anne_sentence_chunks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anne_source_sentences s
      join public.anne_content_sources source on source.source_id = s.source_id
      where s.sentence_id = anne_sentence_chunks.sentence_id
        and s.enabled
        and source.enabled
    )
  );

drop policy if exists "Users can manage their own anne progress" on public.anne_reader_progress;
create policy "Users can manage their own anne progress"
  on public.anne_reader_progress
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can manage their own anne bookmarks" on public.anne_bookmarks;
create policy "Users can manage their own anne bookmarks"
  on public.anne_bookmarks
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can manage their own anne entitlements" on public.anne_entitlements;
create policy "Users can manage their own anne entitlements"
  on public.anne_entitlements
  for select
  to authenticated
  using (user_id = auth.uid());

commit;
