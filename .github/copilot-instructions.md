# AeThex-OS Copilot Coding Agent Instructions

## Project Overview
AeThex-OS is a modular web desktop platform built with TypeScript, React, Vite, Drizzle ORM, and Supabase. It features a multi-service architecture with clear separation between client, server, shared schema, and data migration layers. The system is designed for extensibility, rapid prototyping, and integration with external APIs and authentication providers.

## Key Architectural Patterns
- **Client/Server Split:**
  - `client/` contains the React SPA, UI components, hooks, and page logic.
  - `server/` contains API routes, static asset serving, websocket logic, and Supabase integration.
  - `shared/schema.ts` defines all database tables and Zod validation schemas, used by both client and server.
- **Drizzle ORM:**
  - All database schema and types are defined in `shared/schema.ts` using Drizzle's `pgTable` and Zod schemas.
  - Migrations are managed in `migrations/`.
- **Authentication:**
  - Supabase Auth is used for user management. Profiles are linked to `auth.users(id)`.
- **Component Organization:**
  - UI components are in `client/src/components/` and subfolders. Shared hooks are in `client/src/hooks/`.
  - Pages are in `client/src/pages/`.

## Developer Workflows
- **Build:**
  - Use Vite for client builds: `npm run build` (see `vite.config.ts`).
  - Server scripts are in `script/` and `server/`.
- **Test:**
  - Run shell script `./test-implementation.sh` for implementation checks.
- **Migrations:**
  - Database migrations are in `migrations/`. Use Drizzle migration commands as per project docs.
- **Debugging:**
  - Client debugging via Vite dev server. Server debugging via direct script execution or API route testing.

## Project-Specific Conventions
- **Type Safety:**
  - All data models use Zod schemas for validation and type inference.
- **Default Values:**
  - Most tables use `.default()` for status, roles, and timestamps. See `shared/schema.ts` for examples.
- **Extensibility:**
  - New features should be added as new tables in `shared/schema.ts` and new components/pages in `client/src/`.
- **Naming:**
  - Use `aethex_*` prefix for core tables and features (e.g., `aethex_sites`, `aethex_projects`).

## Integration Points
- **Supabase:**
  - Used for authentication and storage. See `client/src/lib/supabase.ts` and `server/supabase.ts`.
- **Websockets:**
  - Real-time features via `client/src/hooks/use-websocket.ts` and `server/websocket.ts`.
- **API:**
  - API logic in `server/routes.ts` and `client/src/lib/api.ts`.

## Examples
- **Schema Definition:** See `shared/schema.ts` for Drizzle/Zod table patterns.
- **Component Usage:** See `client/src/components/Chatbot.tsx` for AI integration.
- **Migration:** See `migrations/` for SQL migration examples.

## Recommendations for AI Agents
- Always update both schema and Zod types when adding new tables or fields.
- Reference existing patterns for new features (e.g., achievements, profiles, projects).
- Use default values and type-safe patterns as shown in `shared/schema.ts`.
- When in doubt, follow the naming and structure conventions in existing files.

---

*If any section is unclear or missing, please provide feedback for further refinement.*
