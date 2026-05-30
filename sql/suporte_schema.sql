-- ============================================================================
--  SUPORTE — Tabelas novas para a aba de Suporte do CRM
--  Rode no SQL Editor do Supabase. NÃO altera nenhuma tabela existente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Tabela principal: 1 linha por ticket / conversa de suporte
--    É a tabela que alimenta a tela "Suporte" (kanban + métricas + dúvidas).
-- ----------------------------------------------------------------------------
create table if not exists public.oneclick_suporte_br_CRM (
  id                        bigint generated always as identity primary key,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Dados do contato
  name                      text,
  number                    text,        -- telefone / whatsapp
  email                     text,
  product                   text,

  -- Vínculo com o Chatwoot
  chatwoot_conversation_id  bigint,      -- id da conversa no Chatwoot
  chatwoot_contact_id       bigint,      -- id do contato no Chatwoot
  chatwoot_inbox_id         bigint,

  -- Pipeline / atendimento
  -- status: novo | escolhendo_opcao | acessar_app | como_jogar |
  --         reembolso | encaminhado_humano | resolvido
  status                    text not null default 'novo',

  -- Classificação da dúvida (alimenta o gráfico "Maiores Dúvidas")
  -- topico: acessar_app | como_jogar | reembolso | pagamento | confianca | outros
  topico                    text,

  -- Flags de atendimento
  encaminhado_humano        boolean not null default false,
  bot_pausado               boolean not null default false,  -- bot para de responder qd true
  last_message              text,
  last_message_at           timestamptz
);

comment on table public.oneclick_suporte_br_CRM is
  'Tickets de suporte (1 por conversa do Chatwoot). Alimenta a aba Suporte do CRM.';

-- Índices úteis para a tela e para os workflows do n8n
create index if not exists idx_suporte_created_at
  on public.oneclick_suporte_br_CRM (created_at desc);
create index if not exists idx_suporte_status
  on public.oneclick_suporte_br_CRM (status);
create index if not exists idx_suporte_topico
  on public.oneclick_suporte_br_CRM (topico);
create unique index if not exists uq_suporte_conversation
  on public.oneclick_suporte_br_CRM (chatwoot_conversation_id)
  where chatwoot_conversation_id is not null;

-- ----------------------------------------------------------------------------
-- 2) Log de interações (cada mensagem trocada).
--    Opcional, mas serve para histórico e para auditar as dúvidas ao longo
--    do tempo. O n8n insere 1 linha por mensagem (cliente, bot ou humano).
-- ----------------------------------------------------------------------------
create table if not exists public.oneclick_suporte_interacoes (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  ticket_id     bigint references public.oneclick_suporte_br_CRM (id) on delete cascade,

  chatwoot_conversation_id bigint,
  autor         text,        -- cliente | bot | humano
  topico        text,        -- mesma taxonomia do ticket (opcional)
  mensagem      text
);

comment on table public.oneclick_suporte_interacoes is
  'Histórico de mensagens dos tickets de suporte.';

create index if not exists idx_suporte_inter_ticket
  on public.oneclick_suporte_interacoes (ticket_id);
create index if not exists idx_suporte_inter_created
  on public.oneclick_suporte_interacoes (created_at desc);

-- ----------------------------------------------------------------------------
-- 3) Trigger para manter updated_at sempre atualizado no ticket
-- ----------------------------------------------------------------------------
create or replace function public.set_suporte_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_suporte_updated_at on public.oneclick_suporte_br_CRM;
create trigger trg_suporte_updated_at
  before update on public.oneclick_suporte_br_CRM
  for each row execute function public.set_suporte_updated_at();

-- ----------------------------------------------------------------------------
-- 4) Realtime — a tela usa supabase.channel() para atualizar ao vivo.
--    Adiciona a tabela à publicação de realtime (ignora erro se já estiver).
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.oneclick_suporte_br_CRM;
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 5) RLS — habilite e ajuste conforme o padrão do seu projeto.
--    (As outras tabelas do CRM usam a anon key via Supabase JS.)
--    Política simples: leitura/escrita para a role anon/authenticated.
--    >>> Revise conforme sua segurança antes de usar em produção. <<<
-- ----------------------------------------------------------------------------
alter table public.oneclick_suporte_br_CRM   enable row level security;
alter table public.oneclick_suporte_interacoes enable row level security;

drop policy if exists suporte_all on public.oneclick_suporte_br_CRM;
create policy suporte_all on public.oneclick_suporte_br_CRM
  for all using (true) with check (true);

drop policy if exists suporte_inter_all on public.oneclick_suporte_interacoes;
create policy suporte_inter_all on public.oneclick_suporte_interacoes
  for all using (true) with check (true);
