# AeThex Ecosystem

## Overview

AeThex is a full-stack web application that serves as an "Operating System for the Metaverse." The platform is built around a "Holy Trinity" architecture concept: **Axiom** (foundational principles), **Codex** (certification/credential system), and **Aegis** (security/protection layer). The system transforms talent into certified "Metaverse Architects" through a structured curriculum and credentialing process.

The application includes:
- Public-facing landing pages explaining the ecosystem
- An "AeThex Passport" credential certification system
- A simulated "Terminal" interface demonstrating security features
- An admin dashboard for managing architects, projects, and credentials
- Real-time metrics and threat monitoring displays

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and UI effects
- **Charts**: Recharts for data visualization
- **Fonts**: Custom display fonts (Oxanium, JetBrains Mono, Share Tech Mono) for tech/cyberpunk aesthetic

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: esbuild for server bundling, Vite for client
- **Session Management**: express-session with secure cookie configuration
- **Password Hashing**: bcrypt for credential security

### Data Storage
- **Primary Database**: Supabase (PostgreSQL-based)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**:
  - `users`: Authentication data (id, username, hashed password, admin flag)
  - `profiles`: Rich user data (bio, skills, XP, level, passport ID, verification status)
  - `projects`: Project portfolio data

### Authentication & Authorization
- Session-based authentication using express-session
- Two-tier permission system:
  - `requireAuth`: Any authenticated user
  - `requireAdmin`: Admin users only
- Session data includes `userId` and `isAdmin` flags
- Secure cookie settings in production (httpOnly, sameSite strict, secure)

### API Structure
- RESTful endpoints under `/api/` prefix
- Authentication routes: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
- Resource routes: `/api/profiles`, `/api/projects`, `/api/metrics`
- Admin routes protected by middleware

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/ui/  # shadcn components
│   │   ├── pages/          # Route components
│   │   ├── lib/            # Utilities and auth context
│   │   └── hooks/          # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database abstraction layer
│   └── supabase.ts   # Supabase client setup
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema + Zod validation
└── attached_assets/  # Static assets and brand documentation
```

## External Dependencies

### Database
- **Supabase**: Cloud PostgreSQL database
  - Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
  - Used for all persistent data storage

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (for Drizzle migrations)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `SESSION_SECRET`: Required in production for session security

### Key npm Dependencies
- `@supabase/supabase-js`: Supabase client SDK
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animation library
- `recharts`: Charting library
- Full shadcn/ui component set via Radix UI primitives

### Development Tools
- Vite development server with HMR
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)
- TypeScript with strict mode enabled