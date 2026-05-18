# 🏗️ Frontend Architecture

FoodX Frontend leverages **Next.js 15 (App Router)** to facilitate a highly complex multi-tenant environment.

## 1. Multi-Tenant Routing
FoodX uses a sophisticated rewrite strategy defined in `middleware.ts` and `next.config.mjs` to dynamically segment the platform:
- **Super Admin Workspace**: Handled via a specific subdomain (e.g., `admin.foodx`), offering global operational control.
- **Tenant Workspace**: Customers interact via `{tenant}.foodx/customer`, Staff via `/staff`, and Admins via `/admin`.

## 2. Directory Structure Breakdown
- `app/`: Houses all page routes. Sub-directories are segregated based on operational domains (`(admin)`, `customer`, `staff`, `api`).
- `components/`: Contains isolated logic UI modules.
  - `ui/`: Generic Atomic design components.
  - `layout/`: Global structural layouts.
- `lib/services/`: Direct API hooks, utilizing configured Axios interceptors.
- `lib/hooks/`: Reusable react hooks, specifically highlighting the `useSignalR` wrapper for WebSocket streams.
- `lib/contexts/`: Globally applied state management.

## 3. Theming & Styling
- Combining **Tailwind CSS** with **Ant Design 6** & **Material-UI 7**.
- Native Dark/Light mode is heavily enforced across all UI elements.

## 4. State & Real-Time Management
- Context API manages localized and global authentication states seamlessly across sub-domains.
- SignalR clients continuously maintain alive connections with backend WebSockets ensuring minimal data latency for critical paths (e.g. Order Tracking).

