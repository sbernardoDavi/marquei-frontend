# Marquei - Frontend

Sistema de agendamento online para salões de beleza e clínicas de estética.

## 🚀 Tecnologias

- **React 19** com **Vite**
- **TypeScript**
- **React Router DOM** - Roteamento
- **TanStack Query** (React Query) - Gerenciamento de estado servidor
- **Axios** - Requisições HTTP
- **Tailwind CSS** - Estilização
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Gráficos
- **Lucide React** - Ícones
- **Sonner** - Notificações toast

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend rodando em `http://localhost:3000`

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🎯 Funcionalidades

### 👨‍💼 GESTOR

- Dashboard com métricas e gráficos
- CRUD de Serviços
- CRUD de Profissionais
- CRUD de Clientes
- Gerenciamento de Agendamentos
- Importação em massa (CSV)
- Notificações

### 👨‍🔧 PROFISSIONAL

- Visualizar agenda do dia
- Gerenciar seus agendamentos
- Atualizar status dos agendamentos
- Notificações

### 👤 CLIENTE

- Consultar horários disponíveis
- Criar agendamentos
- Visualizar seus agendamentos
- Remarcar/Cancelar agendamentos
- Notificações

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header)
│   ├── ui/              # UI components (Button, Input, Card, etc)
│   └── PrivateRoute.tsx # Route protection
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── hooks/
│   └── useNotifications.ts
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Appointments.tsx
├── services/
│   ├── api.ts           # Axios instance
│   ├── auth.service.ts
│   ├── appointments.service.ts
│   ├── dashboard.service.ts
│   └── ...
├── types/
│   └── index.ts         # TypeScript types
├── utils/
│   ├── cn.ts            # Class name utility
│   └── formatters.ts    # Formatting utilities
├── App.tsx
└── main.tsx
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 🌐 Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3000
```

## 🔗 Links

- [Repositório Backend](https://github.com/sbernardoDavi/marquei-backend)
- [Documentação da API](../backend/API_TESTS.md)

## 📄 Licença

Este projeto é privado e de uso interno.
