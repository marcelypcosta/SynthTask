# SynthTask — Guia de Execução Local

Este documento descreve como executar localmente o backend (`synthtask-api`, FastAPI) e o frontend (`synthtask-front`, Next.js), incluindo requisitos, configuração de ambiente, comandos e soluções para problemas comuns.

## Requisitos do Sistema

- Node.js: `>= 18` (recomendado `20 LTS`). Verifique com `node -v`.
- npm: `>= 9` (ou Yarn/Pnpm, opcional). Verifique com `npm -v`.
- Python: `>= 3.10` (apenas se rodar a API localmente sem Docker).
- Docker e Docker Compose (plugin v2). Verifique com `docker -v` e `docker compose version`.
- Git (opcional, para clonar o repositório).

## Visão Geral

- Backend (`synthtask-api`): FastAPI servindo rotas REST; depende de PostgreSQL e MongoDB.
- Frontend (`synthtask-front`): Next.js com autenticação via NextAuth.
- Desenvolvimento recomendado:
  - Backend com Docker Compose (API + bancos).
  - Frontend rodando localmente com `npm run dev` (hot reload).

## Arquitetura e Padrões

- Adaptadores de integrações: `synthtask-api/app/modules/integrations` implementa `IntegrationService` e serviços por provedor (`trello`, `jira`).
- Separação de responsabilidades:
  - `routers/*` expõem endpoints e delegam aos serviços/adaptadores.
  - `core/*` concentra autenticação, banco de dados e utilitários.
  - `services/ai_service.py` processa textos de reunião e retorna apenas tasks.
- Endpoints principais:
  - `POST /api/integrations/{provider}/connect`
  - `GET  /api/integrations/{provider}/status`
  - `GET  /api/integrations/{provider}/targets`
  - `POST /api/integrations/{provider}/tasks`
- Endpoints legados removidos:
  - `/api/integrations/send-tasks`
  - `/api/auth/trello-config` e `/api/auth/trello-lists`

---

## Backend — Execução (Docker Compose)

1. Entre na pasta do backend:
   ```bash
   cd synthtask-api
   ```

2. (Opcional) Crie um arquivo `.env` em `synthtask-api/` para configurar segredos:
   ```env
   # synthtask-api/.env
   GEMINI_API_KEY=SEU_TOKEN_GEMINI
   JWT_SECRET=troque-esta-chave-em-producao
   ```
   O `docker-compose.yml` lê variáveis do ambiente do diretório atual automaticamente.

3. Suba os serviços (API, Postgres, MongoDB):
   ```bash
   docker compose up -d
   # ou apenas os essenciais
   docker compose up -d api postgres mongodb
   ```

4. Valide a API:
   - Health: `http://localhost:8000/health`
   - Docs: `http://localhost:8000/docs`

5. Logs e ciclo de vida:
   ```bash
   docker compose logs -f api
   docker compose ps
   docker compose down           # para todos os serviços
   docker compose down -v        # remove volumes (dados serão apagados)
   ```

### Backend — Execução Local (sem Docker)

Se preferir rodar a API localmente (requer Postgres e Mongo em execução):

1. Configure variáveis de ambiente (exemplos Windows PowerShell):
   ```powershell
   $env:DATABASE_URL = "postgresql://sintask:sintask123@localhost:5432/sintask"
   $env:MONGODB_URL = "mongodb://localhost:27017"
   $env:JWT_SECRET = "troque-esta-chave-em-producao"
   $env:GEMINI_API_KEY = "SEU_TOKEN_GEMINI"
   ```

2. Crie e ative um ambiente virtual, instale dependências e execute:
   ```powershell
   cd synthtask-api
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python main.py
   # API disponível em http://localhost:8000
   ```

---

## Frontend — Execução Local (Next.js)

1. Entre na pasta do frontend:
   ```bash
   cd synthtask-front
   ```

2. Crie o arquivo `synthtask-front/.env.local`:
   ```env
   # URL pública do backend (acessada pelo navegador)
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=dev-secret-change-this
   ```
   - Dica: gere um `NEXTAUTH_SECRET` forte (via Node):
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. Instale dependências:
   ```bash
   npm ci
   # se preferir
   npm install
   ```

4. Inicie o servidor de desenvolvimento (hot reload):
   ```bash
   npm run dev
   # acesse http://localhost:3000
   ```

5. Build e execução (produção local):
   ```bash
   npm run build
   npm run start
   ```

### Como o Frontend descobre a API

O cliente HTTP (`src/lib/http.ts`) usa:

- No navegador: `NEXT_PUBLIC_BACKEND_URL`.
- No servidor (SSR/API routes): `BACKEND_INTERNAL_URL` (se definido) ou `NEXT_PUBLIC_BACKEND_URL`.

Em desenvolvimento local, basta definir `NEXT_PUBLIC_BACKEND_URL` para `http://localhost:8000`.

---

## Variáveis de Ambiente

### Backend (API FastAPI)
- `DATABASE_URL`: URL do Postgres (ex.: `postgresql://sintask:sintask123@localhost:5432/sintask`).
- `MONGODB_URL`: URL do MongoDB (ex.: `mongodb://localhost:27017`).
- `JWT_SECRET`: chave secreta para JWT.
- `GEMINI_API_KEY`: chave da API Google Gemini (opcional).
- `ENCRYPTION_SECRET`: segredo para criptografia de credenciais das integrações.

### Frontend (Next.js)
- `NEXT_PUBLIC_BACKEND_URL`: URL pública do backend (ex.: `http://localhost:8000`).
- `NEXTAUTH_URL`: URL do site (ex.: `http://localhost:3000`).
- `NEXTAUTH_SECRET`: segredo do NextAuth (use valor forte em produção).

---

## Comandos Úteis

### Testes rápidos da API
```bash
# Health
curl http://localhost:8000/health

# Registrar usuário
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Integrations — conectar e criar task
curl -X POST "http://localhost:8000/api/integrations/trello/connect" \
  -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" \
  -d '{"api_key":"...","token":"..."}'

curl -X GET "http://localhost:8000/api/integrations/trello/targets" \
  -H "Authorization: Bearer SEU_TOKEN"

curl -X POST "http://localhost:8000/api/integrations/trello/tasks" \
  -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" \
  -d '{"target_id":"ID_DA_LISTA","task":{"title":"Minha tarefa","description":"..."}}'
```

### Docker Compose
```bash
cd synthtask-api
docker compose up -d
docker compose logs -f api
docker compose down
docker compose down -v
```

---

## Problemas Comuns e Soluções

- Porta em uso (3000 ou 8000):
  - Feche o processo que ocupa a porta ou altere a porta.

- Frontend não reflete mudanças no Docker:
  - Execute o frontend localmente com `npm run dev` (o frontend foi removido do docker-compose).

- Erros de autenticação (NextAuth):
  - Verifique `NEXTAUTH_URL` e `NEXTAUTH_SECRET` em `.env.local`.
  - Confirme que `NEXT_PUBLIC_BACKEND_URL` aponta para `http://localhost:8000`.

- CORS:
  - A API permite origens `*` por padrão; certifique-se de acessar via `http://localhost:8000`.

- Conflito de rotas (`/register` e `/sign-in`):
  - Mantenha as páginas sob `src/app/(public)/register` e `src/app/(public)/sign-in`.
  - Evite duplicatas em `src/app/register` e `src/app/sign-in`.

- Tailwind/tema não aplicado:
  - Confirme a importação de `src/styles/globals.css` em `src/app/layout.tsx`.
  - Tokens principais ajustados: `--primary` (brand `#3B82F6`), `--card` (`#F8FAFC`).

- Erros de dependência Node:
  - Use `npm ci` para instalações reproduzíveis.
  - Remova `node_modules` e reinstale se necessário.

- Banco de dados não conecta (execução local):
  - Prefira Compose para Postgres/Mongo. Se local, verifique URLs e serviços ativos.

---

## Estrutura do Projeto (resumo)

```
SynthTask/
├── synthtask-api/        # Backend FastAPI + Compose
│   ├── app/              # Código da API
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── main.py
└── synthtask-front/      # Frontend Next.js
    ├── src/
    ├── package.json
    ├── next.config.ts
    └── src/styles/globals.css
```

---

## Dicas Finais

- Use Node 20 LTS para máxima compatibilidade com Next 15.
- Gere segredos fortes; nunca commite valores sensíveis.
- Em produção, configure variáveis e serviços com segurança (TLS, segredos, etc.).
