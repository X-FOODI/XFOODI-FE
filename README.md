<div align="center">

<img src="./logo.png" alt="FoodX Logo" width="200" />

# 🍔 FoodX Frontend

**Next-Generation Multi-Tenant Restaurant Management System Frontend**

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=githubactions)](#)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-6-0170FE?style=flat-square&logo=antdesign)](https://ant.design/)
[![License: Private](https://img.shields.io/badge/License-Private-red?style=flat-square)](#)

[🌐 Live Demo](http://localhost:3000) · [⚙️ Setup Phase](./docs/SETUP.md) · [🤝 Contribution Guidelines](./docs/CONTRIBUTING.md) · [🏗️ FE Architecture](./docs/ARCHITECTURE.md)

</div>

---

## ✨ Highlights

- 🏢 **Multi-Tenant Routing System** — Intelligent routing supporting Super Admin (`admin.foodx`), Restaurant Admin (`{tenant}.foodx/admin`), Staff (`{tenant}.foodx/staff`), and Customers (`{tenant}.foodx/customer`).
- 🌗 **Premium UI & Dual-Theme Support** — Stunning interfaces leveraging Tailwind CSS alongside Ant Design & MUI, featuring seamless **Dark and Light Mode** transitions globally.
- ⚡ **Real-time Synchronicity** — Integrated SignalR (`@microsoft/signalr`) hooks for instant real-time order tracking, kitchen display updates, and live table status syncing.
- 🎨 **Dynamic Interactions & 3D** — High-end animations via Framer Motion, insightful data visualization with Recharts, and interactive 3D table layouts powered by Three.js.
- 🤖 **AI-Powered Capabilities** — Integrated Google Gemini API for smart menu descriptions, dynamic insights, and intelligent chatbot assistance directly on the frontend.
- 🌍 **Internationalization (i18n)** — Native multi-language support seamlessly wired via `react-i18next` for scaling across diverse user bases.
- 🛡️ **Robust Authentication Flow** — Complete context-based auth state management handling tenant redirects, token injection via Axios interceptors, and secure persistence.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | Next.js 15 (App Router), Node.js ≥ 20 |
| **Language** | TypeScript 5 |
| **UI Components** | Ant Design 6, Material-UI (MUI v7) |
| **Styling** | Tailwind CSS 3 |
| **Animations & 3D** | Framer Motion, Three.js |
| **State Management**| React Context API |
| **Data Fetching** | Axios Interceptors |
| **Realtime** | SignalR Client (`@microsoft/signalr`) |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Analytics/Charts** | Recharts |
| **Localization** | i18next / react-i18next |

---

## 🚀 Quick Start

> Minimum requirements: **Node.js ≥ 20**, **npm ≥ 9**

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd XFoodi-FE

# Install dependencies
npm install
```

### 2. Environment Variables Configuration

Copy the example environment file to configure your local setup:

```bash
cp .env.example .env.local
```

Ensure API URLs proxy mappings are correctly set (e.g., `INTERNAL_API_URL`, `INTERNAL_ADMIN_API_URL`).

### 3. Run Local Server

Start the Next.js development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`. 
*(Note: Use appropriate subdomain testing tools if testing tenant logic locally).*

---

## 🏗️ Architecture & Routing

The application uses Next.js rewrites to elegantly proxy API requests and segregate interfaces:

- `/api/admin/*` → Admin Backend API
- `/api/*` → Tenant API
- `/hubs/*` → SignalR real-time hubs

Directory breakdown:
- `app/`: Next.js 15 App Router pages (divided by tenant scope: admin, customer, staff).
- `components/`: UI and Layout components.
- `lib/services/`: Centralized API clients.
- `lib/hooks/`: Custom hooks like `useSignalR`.

---

## 🤝 Rule of Thumb for Contributors

To maintain a professional, bug-free codebase, run our comprehensive checks before making any commits:

```bash
# Run linting and TypeScript checks
npm run check
```

**Critical Contribution Rules:**
1. **Always Check Linter Errors**: Do not commit code with outstanding ESLint or TypeScript warnings. 
2. **Support Dual Themes**: Whenever you create or modify a screen/component, you **MUST** add support for both **Dark** and **Light** themes. Hardcoding single-theme colors is strictly prohibited.
3. **Branching**: Follow standard branch naming (`feature/<username>/<feature-name>`).
4. **Committing**: Use conventional commits (`feat(ui): add 3d restaurant table mapping`).

---

## 📄 License

This repository is strictly protected under Proprietary Private ownership designed entirely for the FoodX Platform.

<div align="center">
  <br>
  <sub>Built with ❤️ by the FoodX Frontend Team</sub>
</div>
