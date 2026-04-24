# ─────────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time env (Vite embute VITE_* no bundle durante build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Instalar dependências
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copiar código e buildar
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Runtime (nginx servindo SPA)
# ─────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/client /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
