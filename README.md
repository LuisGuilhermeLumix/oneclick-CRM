# Tailgrab CRM — Lumix Recovery Dashboard

Dashboard de recuperação de vendas + tracking codes da Tailgrab.

Stack: React 19 · TanStack Router · Tailwind 4 · Supabase · Recharts · Vite

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env   # preencher com as credenciais do Supabase
npm run dev
```

Variáveis de ambiente necessárias (ver `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> `VITE_*` são embutidas no bundle em tempo de build — precisam estar disponíveis no momento do `npm run build`.

---

## Deploy no EasyPanel (VPS)

O projeto inclui `Dockerfile` multi-stage (build Node + runtime nginx servindo o SPA) e `nginx.conf` com fallback para `index.html`.

### Passo a passo

1. No EasyPanel, criar um novo **App** → tipo **Dockerfile**.
2. Conectar o repositório `LuisGuilhermeLumix/tailgrab-CRM`.
3. Em **Build Settings**, configurar os **Build Args** (Vite embute em tempo de build):
   - `VITE_SUPABASE_URL` = URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = anon key do projeto Supabase
4. Porta interna exposta pelo container: **80**.
5. Salvar → Deploy. O EasyPanel vai buildar a imagem e publicar.
6. Associar o domínio + ativar SSL (Let's Encrypt) pelo painel.

### Testar o build localmente via Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://xxx.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJhbGc..." \
  -t tailgrab-crm .

docker run -p 8080:80 tailgrab-crm
# abrir http://localhost:8080
```

### Atualizações

Basta um `git push` na branch conectada — o EasyPanel rebuilda automaticamente (se auto-deploy estiver ativado).

---

## Estrutura principal

```
src/
├── components/      # Sidebar, AppLayout, MetricCard, tabelas, gráficos
├── hooks/           # useAuth, useFilters, useMetrics, useLeads, useTracking, useChartData
├── lib/             # supabase client, format helpers
├── routes/          # login, dashboard, tracking (TanStack Router file-based)
└── styles.css       # Tailwind + tokens de design
```

Dados vêm do Supabase via:
- `tailgrab_nutra_eua_sms_vendas` / `tailgrab_nutra_eua_sms_disparos` → dashboard
- `tailgrab_nutra_eua_sms_TC` → tracking codes
