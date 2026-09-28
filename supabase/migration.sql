-- ============================================================
-- Migração Supabase — Modelo de Alocação
-- Execute no SQL Editor do dashboard do Supabase
-- ============================================================

-- Tabela do modelo (uma única linha, id=1)
create table if not exists alloc_model (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Habilitar Row Level Security
alter table alloc_model enable row level security;

-- Leitura pública (qualquer um pode ler o modelo via anon key)
drop policy if exists "Public read" on alloc_model;
create policy "Public read" on alloc_model
  for select using (true);

-- Escrita: apenas service_role (bypassa RLS automaticamente)
-- Nenhuma policy de insert/update/delete para anon = bloqueado

-- Inserir linha inicial (vazia — o app usa DEFAULT_MODEL como fallback)
insert into alloc_model (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;
