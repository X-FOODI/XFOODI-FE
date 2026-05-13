# RestX Frontend Template

Minimal template for RestX multi-tenant restaurant management system frontend.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Libraries**: Ant Design 6, Material-UI 7
- **Styling**: Tailwind CSS 3
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: SignalR (@microsoft/signalr)
- **Animation**: Framer Motion
- **Charts**: Recharts
- **3D**: Three.js
- **i18n**: react-i18next
- **AI**: Google Gemini API

## Project Structure

```
RestX-FE/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── (admin)/             # Admin routes (TODO)
│   ├── (marketing)/         # Marketing routes (TODO)
│   ├── customer/            # Customer routes (TODO)
│   ├── staff/               # Staff routes (TODO)
│   └── api/                 # API routes (TODO)
├── components/              # React components
│   ├── ui/                  # UI components (Button, Card, etc.)
│   └── layout/              # Layout components (Header, Footer, etc.)
├── lib/                     # Utilities and helpers
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React contexts
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Key Features (Template)

### API Client (`lib/services/api.ts`)
- Axios-based HTTP client
- Automatic token injection
- Error handling with 401 redirect
- Separate clients for tenant and admin APIs

### Authentication Context (`lib/contexts/AuthContext.tsx`)
- User authentication state management
- Login/logout functionality
- Token persistence

### SignalR Hook (`lib/hooks/useSignalR.ts`)
- Real-time communication with backend
- Automatic reconnection
- Event subscription management

### Utility Functions (`lib/utils/index.ts`)
- Currency formatting (VND)
- Date/time formatting
- Email/phone validation
- QR code URL generation

### UI Components (`components/ui/`)
- Button component with variants
- Card component with header/content
- More components to be added

## API Configuration

The app uses Next.js rewrites to proxy API requests and avoid CORS issues:

- `/api/admin/*` → Admin API
- `/api/*` → Tenant API
- `/hubs/*` → SignalR hubs

Configure API URLs in `.env.local`:

```env
INTERNAL_ADMIN_API_URL=https://admin.restx.food/api
INTERNAL_API_URL=https://demo.restx.food/api
```

## Multi-Tenancy

The app supports multi-tenant architecture:

- **Super Admin**: `admin.restx.food`
- **Restaurant Admin**: `{tenant}.restx.food/admin/*`
- **Staff**: `{tenant}.restx.food/staff/*`
- **Customer**: `{tenant}.restx.food/customer/{tableId}`

## Development Guidelines

### Adding New Pages

Create pages in the `app/` directory following Next.js App Router conventions:

```tsx
// app/menu/page.tsx
export default function MenuPage() {
  return <div>Menu Page</div>;
}
```

### Adding New Components

Create components in `components/` directory:

```tsx
// components/ui/Input.tsx
export function Input({ ...props }) {
  return <input {...props} />;
}
```

### Adding New API Services

Create service files in `lib/services/`:

```tsx
// lib/services/menuService.ts
import { tenantApi } from './api';

export const menuService = {
  getCategories: () => tenantApi.get('/categories'),
  getDishes: (categoryId: string) => tenantApi.get(`/dishes?categoryId=${categoryId}`),
};
```

### Adding New Types

Define types in `lib/types/index.ts`:

```tsx
export interface MenuItem {
  id: string;
  name: string;
  price: number;
}
```

## TODO

This is a minimal template. The following features need to be implemented:

- [ ] Complete authentication flow
- [ ] Admin dashboard pages
- [ ] Staff management pages
- [ ] Customer ordering interface
- [ ] Menu management
- [ ] Order management
- [ ] Reservation system
- [ ] Table management with 3D layout
- [ ] Real-time order updates (SignalR)
- [ ] Internationalization (i18n)
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Unit tests
- [ ] E2E tests

## License

Private - RestX Project
