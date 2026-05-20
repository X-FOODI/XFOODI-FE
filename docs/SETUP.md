# ⚙️ Setup & Deployment Guide

## 1. System Requirements
- Node.js >= 20.x
- pnpm >= 9.x

## 2. Install Dependencies
```bash
pnpm install
```

## 3. Environment Variables
Copy the sample file and set up the following major variables inside `.env.local` (intended for local testing scenarios):

```env
# Backend API proxy routing
INTERNAL_ADMIN_API_URL=http://localhost:5000/api
INTERNAL_API_URL=http://localhost:5000/api

# SignalR URL setup
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000/hubs

# Google Gemini API
GEMINI_API_KEY=xxx
```

## 4. Code Quality Check (MANDATORY)
Before pushing any raw code components to the repository, ensure you have effectively passed all formative & type-checking systems:
```bash
pnpm run check  # Initiate rigorous Type Check + Target ESLint Check
pnpm run lint   # Systematically scan for potential warnings
```

## 5. Running the Development Server
```bash
pnpm run dev
```

You can directly access the interactive local application via `http://localhost:3000`. Keep in mind to configure correct host files if you want to test the tenant routing structure locally (e.g. `admin.localhost`).

