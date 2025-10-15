# 🚀 Sintask - Sistema Inteligente de Processamento de Reuniões

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Transforme suas reuniões em tarefas organizadas com o poder da IA**

[🎯 Funcionalidades](#-funcionalidades) • [🏗️ Arquitetura](#️-arquitetura) • [🚀 Como Usar](#-como-usar) • [🔧 Desenvolvimento](#-desenvolvimento)

</div>

---

## 📋 Sobre o Projeto

O **Sintask** é uma aplicação web moderna que utiliza inteligência artificial para processar textos de reuniões e extrair automaticamente tarefas, responsáveis, prazos e prioridades. O sistema oferece integração completa com Trello para gerenciamento de projetos.

### ✨ Principais Características

- 🤖 **IA Integrada**: Processamento de texto com Google Gemini AI
- 📊 **Dashboard Intuitivo**: Interface React moderna e responsiva  
- 🔐 **Autenticação JWT**: Sistema seguro de login e registro
- 📱 **Integração Trello**: Criação automática de cards
- 🐳 **Docker Ready**: Deploy completo com um comando
- 🏗️ **Arquitetura Modular**: Backend organizado e escalável

---

## 🎯 Funcionalidades

### 🎤 Processamento de Reuniões
- Análise inteligente de texto de reuniões
- Extração automática de tarefas e responsabilidades
- Definição de prioridades e prazos
- Resumo executivo da reunião

### 📋 Gestão de Tarefas
- Visualização organizada de tarefas extraídas
- Edição e exclusão de tarefas
- Seleção múltipla para envio ao Trello
- Histórico completo de reuniões processadas

### 🔗 Integração Trello
- Configuração simples de credenciais   
- Criação automática de cards
- Formatação rica com emojis e metadados
- Sincronização bidirecional

### 👤 Sistema de Usuários
- Registro e login seguro
- Perfis personalizados
- Configurações de integração
- Histórico individual de atividades

---

## 🏗️ Arquitetura

### 🎨 Frontend (React)
```
sintask-frontend/
├── src/
│   ├── App.js              # Componente principal
│   ├── App.css             # Estilos globais
│   └── index.js           # Ponto de entrada
├── public/                 # Assets estáticos
├── Dockerfile             # Container do frontend
└── package.json           # Dependências Node.js
```

### ⚙️ Backend (FastAPI)
```
backend/
├── app/
│   ├── models.py          # Esquemas Pydantic
│   ├── core/              # Configurações centrais
│   │   ├── config.py      # Variáveis de ambiente
│   │   ├── database.py    # Conexões de banco
│   │   └── auth.py        # Autenticação JWT
│   ├── routers/           # Endpoints da API
│   │   ├── auth.py        # Autenticação
│   │   └── meetings.py    # Reuniões e tarefas
│   └── services/          # Lógica de negócio
│       ├── ai_service.py  # Integração Gemini
│       └── trello_service.py # Integração Trello
├── main.py               # Ponto de entrada
├── requirements.txt      # Dependências Python
└── docker-compose.yml    # Orquestração completa
```

### 🗄️ Bancos de Dados
- **PostgreSQL**: Dados estruturados (usuários, configurações)
- **MongoDB**: Dados de reuniões e tarefas (NoSQL)

---

## 🚀 Como Usar

### 📋 Pré-requisitos
- **Docker** e **Docker Compose** instalados
- **Git** para clonar o repositório
- Chave da **Google Gemini API** ([obter aqui](https://aistudio.google.com/app/apikey))

### ⚡ Instalação Rápida

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd sintask
   ```

2. **Configure as variáveis de ambiente (.env)**

   - O Docker Compose lê variáveis do arquivo `.env` que está na mesma pasta do compose (no nosso caso, `backend/.env`).
   - Copie o exemplo e edite os valores necessários (principalmente `GEMINI_API_KEY` e `JWT_SECRET`).

```powershell
# Copiar o exemplo para o arquivo usado pelo Docker
Copy-Item backend/.env.example backend/.env

# Agora edite backend/.env e preencha:
# GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
# JWT_SECRET=troque-esta-chave-em-producao
```

   Opcional (frontend em desenvolvimento local):

```powershell
Copy-Item sintask-frontend/.env.example sintask-frontend/.env
```

3. **Suba toda a aplicação**

```bash
docker compose -f backend/docker-compose.yml up -d
```

   Observação: o Compose usará o arquivo `backend/.env` criado no passo anterior.

4. **Acesse a aplicação**

   - 🌐 **Frontend**: <http://localhost:3000>
   - 📚 **API Docs**: <http://localhost:8000/docs>
   - 🗄️ **pgAdmin**: <http://localhost:5050>
   - 🍃 **Mongo Express**: <http://localhost:8081>

### 🔧 Configuração do Trello (Opcional)

1. Acesse <https://trello.com/app-key> para obter sua API Key
2. Clique em "Token" para gerar seu token
3. Configure no painel de configurações da aplicação
4. Adicione o ID da lista onde deseja criar os cards

---

## 💻 Como Usar a Aplicação

### 1️⃣ **Primeiro Acesso**

1. Acesse <http://localhost:3000>
2. Clique em "Cadastre-se"
3. Preencha seus dados e crie uma conta
4. Faça login com suas credenciais

### 2️⃣ **Processando uma Reunião**

1. Vá para a aba "Processar Reunião"
2. Cole o texto da sua reunião na caixa de texto
3. Clique em "Processar com IA"
4. Aguarde a análise (poucos segundos)

### 3️⃣ **Gerenciando Tarefas**

1. Na aba "Resultados", visualize as tarefas extraídas
2. Edite tarefas clicando no ícone de lápis
3. Selecione tarefas para enviar ao Trello
4. Clique em "Enviar para Trello"

### 4️⃣ **Configurações**

1. Acesse a aba "Configurações"
2. Configure suas credenciais do Trello
3. Salve as configurações

---

## 🔧 Desenvolvimento

### 🛠️ Executar em Modo Desenvolvimento

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python main.py
```

**Frontend**:
```bash
cd sintask-frontend
npm install
npm start
```

### 📊 Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f sintask_api
docker logs -f sintask_frontend

# Parar todos os serviços
docker compose -f backend/docker-compose.yml down

# Rebuild após mudanças
docker compose -f backend/docker-compose.yml up -d --build

# Acessar banco PostgreSQL
docker exec -it sintask_postgres psql -U sintask -d sintask

# Acessar MongoDB
docker exec -it sintask_mongodb mongosh sintask_db
```

### 🧪 Testando a API

```bash
# Registrar usuário
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Processar reunião
curl -X POST "http://localhost:8000/api/meetings/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"text":"Reunião sobre projeto. João vai fazer login até sexta."}'
```

---

## 📁 Estrutura de Arquivos

<details>
<summary><strong>🔍 Ver estrutura completa do projeto</strong></summary>

```
sintask/
├── .env                          # Variáveis de ambiente
├── README.md                     # Este arquivo
├── trello.txt                    # Notas do Trello
├── backend/                      # API FastAPI
│   ├── app/                      # Código da aplicação
│   │   ├── __init__.py
│   │   ├── models.py             # Modelos Pydantic
│   │   ├── core/                 # Configurações centrais
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # JWT e autenticação
│   │   │   ├── config.py         # Configurações globais
│   │   │   └── database.py       # Conexões de banco
│   │   ├── routers/              # Endpoints organizados
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # Rotas de autenticação
│   │   │   └── meetings.py       # Rotas de reuniões
│   │   └── services/             # Lógica de negócio
│   │       ├── __init__.py
│   │       ├── ai_service.py     # Integração Gemini AI
│   │       └── trello_service.py # Integração Trello
│   ├── main.py                   # Ponto de entrada da API
│   ├── main_backup.py            # Backup do código original
│   ├── requirements.txt          # Dependências Python
│   ├── Dockerfile                # Container do backend
│   ├── .dockerignore             # Arquivos ignorados no build
│   ├── docker-compose.yml        # Orquestração completa
│   └── README.md                 # Documentação do backend
└── sintask-frontend/             # Interface React
    ├── src/
    │   ├── App.js                # Componente principal
    │   ├── App.css               # Estilos da aplicação
    │   ├── index.js              # Ponto de entrada React
    │   ├── index.css             # Estilos globais
    │   ├── App.test.js           # Testes
    │   ├── reportWebVitals.js    # Métricas de performance
    │   └── setupTests.js         # Configuração de testes
    ├── public/
    │   ├── index.html            # Template HTML
    │   ├── manifest.json         # Configuração PWA
    │   └── robots.txt            # SEO
    ├── package.json              # Dependências Node.js
    ├── Dockerfile                # Container do frontend
    ├── .dockerignore             # Arquivos ignorados no build
    └── README.md                 # Documentação do frontend
```

</details>

---

## 🔒 Segurança e Configuração

### 🔐 Variáveis de Ambiente Importantes

```env
# Google Gemini AI
GEMINI_API_KEY=sua_chave_gemini_aqui

# Bancos de Dados
DATABASE_URL=postgresql://sintask:sintask123@postgres:5432/sintask
MONGODB_URL=mongodb://mongodb:27017

# JWT (altere em produção!)
JWT_SECRET=sua_chave_secreta_jwt_aqui

# Servidor
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
```

### 🛡️ Credenciais dos Bancos

**PostgreSQL**:
- Host: `localhost:5432`
- Usuário: `sintask`
- Senha: `sintask123`
- Database: `sintask`

**MongoDB**:
- Host: `localhost:27017`
- Database: `sintask_db`
- Sem autenticação (desenvolvimento)

---

## 🎯 Casos de Uso

### 👔 Para Empresas
- Processamento de atas de reunião
- Extração automática de action items
- Integração com ferramentas de projeto
- Histórico organizado de decisões

### 👨‍💼 Para Gestores de Projeto
- Acompanhamento de tarefas por reunião
- Distribuição automática de responsabilidades
- Controle de prazos e prioridades
- Relatórios de produtividade

### 👥 Para Equipes
- Clareza sobre responsabilidades
- Redução de retrabalho
- Melhor comunicação pós-reunião
- Organização de tarefas pendentes

---

## 🤝 Contribuindo

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Suporte

- 📧 **Email**: suporte@sintask.com
- 📚 **Documentação**: http://localhost:8000/docs
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/sintask/issues)

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**


</div>
