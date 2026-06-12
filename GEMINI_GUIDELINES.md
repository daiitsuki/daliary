# Daliary Core Principles

## 1. Architecture
- **Pages**: `src/pages/` (Containers).
- **Components**: `src/components/` (Presenters, domain-specific).
- **Context/Hooks**: `src/context/` and `src/hooks/` for state and business logic.
- **Database**: `supabase/` for migrations and backend logic.

## 2. Coding Standards
- **Naming**: `PascalCase` for components/files, `camelCase` for functions/hooks.
- **TypeScript**: No `any`, use explicit interfaces (e.g., `ProfileType`).
- **Data Fetching**: 
  - **Foundation**: `get_app_init_data` RPC for initial load.
  - **Domain**: Independent React Query calls in specific Contexts.
  - **Rules**: Avoid `select('*')`, use `enabled` to manage dependencies.

## 3. Interaction Principles
- Immediate feedback: `active:scale-95` and `transition-all`.
- Smooth animations via `framer-motion`.

## 4. Notification & Points
- **Push**: Vercel Serverless + Web Push API. History limited to 20 items.
- **Points**: Cumulative (Level) vs Current (Balance). Shared by couple.

## 5. Sub-directory Guides
- [Games Standards](./src/components/games/GEMINI.md)
- [UI/UX & Layout](./src/components/layout/GEMINI.md)
- [Map & Travel](./src/components/map/GEMINI.md)
