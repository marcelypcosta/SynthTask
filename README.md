# ⚡ SynthTask

**Gestão automatizada de tarefas geradas em reuniões utilizando IA**

[🔗 Acessar Aplicação](https://synthtask.vercel.app/sign-in)

---

## 📌 Visão Geral

O **SynthTask** resolve o problema de transformar discussões de reuniões em tarefas objetivas.  
A plataforma utiliza **IA (Gemini 2.5 Flash)** para analisar transcrições e gerar:

- Tarefas
- Responsáveis
- Prazos

A validação manual garante controle total antes da exportação.

---

## 🔁 Fluxo de Uso

1. **Upload da transcrição** (`.txt`, `.doc`, `.docx`)
2. **Processamento com IA**
3. **Validação e edição pelo usuário**
4. **Conexão via OAuth com Trello/Jira**
5. **Exportação das tarefas validadas**

---

## 🧱 Arquitetura

A solução é modular e containerizada.  
Infra atual:

### **Frontend**
- Next.js 15 + TypeScript  
- TailwindCSS  
- Deploy: **Vercel**

### **Backend**
- FastAPI (Python 3.10)  
- IA: Gemini 3 Flash Preview
- Deploy: **Render**

### **Bancos de Dados**
- **PostgreSQL (Neon)** — dados dos usuários
- **MongoDB Atlas** — transcrições e logs

---

## 🐳 Execução Local

### 1. Pré-requisitos
- Docker + Docker Compose  
- Git  
- Chave da API do Gemini

### 2. Criar `.env` em `synthtask-api/`

```env
# IA
GEMINI_API_KEY=CHAVE_AQUI

# Auth
JWT_SECRET=chave_secreta_jwt
ENCRYPTION_SECRET=chave_para_criptografia

# Banco de Dados
DATABASE_URL=postgresql://sintask:sintask123@postgres:5432/sintask
MONGODB_URL=mongodb://mongodb:27017

# Jira (opcional)
JIRA_CLIENT_ID=...
JIRA_CLIENT_SECRET=...
JIRA_REDIRECT_URI=http://localhost:3000/jira/callback
```

### 3. Subir Stack

```bash
docker compose up -d
```

### 4. Serviços locais:

Frontend: http://localhost:3000

API Docs: http://localhost:8000/docs

Mongo Express: http://localhost:8082

PgAdmin: http://localhost:5051

### 👥 Equipe

Trabalho desenvolvido no Centro Universitário de João Pessoa — UNIPÊ (2025.2)

Marcely Pereira Costa

Guilherme Vitório R. De Carvalho

Arthur Vinícius De A. Pimentel

Orientação: Prof. Ricardo Roberto De Lima

<div align="center"> <sub>SynthTask © 2025 — Automação inteligente para equipes ágeis</sub> </div>
