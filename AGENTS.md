# Daliary Agent Guidelines

## Behavioral Principles (Karpathy Guidelines)

1. **Think Before Coding** — Don't assume or hide confusion. Surface tradeoffs and ask if requirements are ambiguous.
2. **Simplicity First** — Write the minimum code that solves the problem. No speculative features, unnecessary abstractions, or over-engineering.
3. **Surgical Changes** — Touch only what is required for the task. Match existing style and clean up only orphans created by your own changes.
4. **Goal-Driven Execution** — Define verifiable success criteria and verify changes before finishing.

---

## Project Context & Tech Stack

- **Stack**: React 19, TypeScript, Vite 7, Tailwind CSS v4 (`@import "tailwindcss"`), Framer Motion, TanStack React Query v5, Supabase (Auth, Postgres, Realtime, Storage), Kakao Maps SDK.
- **Verification Commands**:
  - Type check: `npx tsc --noEmit`
  - Lint: `npm run lint`

---

## Architecture & Key Invariants

### 1. State & Data Fetching (`src/context/`, `src/hooks/`)
- **Initial Load & Cache Seeding**: `CoupleContext` calls `get_app_init_data` and `get_home_data` RPCs in parallel and seeds React Query caches (`home_profiles`, `daily_data`, `drawing_data`) consumed by `HomeContext`.
- **Timezone (KST)**: Daily resets (attendance, daily questions, drawing prompts, game reward limits) strictly use KST (`Asia/Seoul`) via `getKSTDateString()` / `getKSTNow()` in `src/utils/dateUtils.ts`.
- **Points System (`CouplePointsContext`)**: Points are shared by the couple and split into `totalPoints` (`cumulative_points`, used for level calculation) and `currentPoints` (`current_points`, spendable balance in shop).
- **Spoiler Protection**: For daily activities where partner content is hidden until the user submits (e.g., `drawing_answers` in `HomeContext`), do not fetch the partner's sensitive column (`image_url`) before the current user has submitted.

### 2. UI & Common Components (`src/components/`)
- **Reuse Common Primitives**: Use existing components in `src/components/common/` (`BaseModal`, `TimePicker`, `DatePicker`, `Button`, `Input`, `Select`, `Toggle`) and global feedback hooks (`useToast`, `useConfirm`) instead of building custom modals or pickers from scratch.
- **Layout Clearance**: Main scrollable page containers must keep `pb-24` so content is not obscured by the floating `BottomNav`.

### 3. Database & Notifications (`supabase/`, `api/`)
- **Migrations**: Only reference and add new SQL files in `supabase/migrations/`. Never modify or rely on `supabase/migrations_old/` or `supabase/archive/`.
- **RLS Performance**: In Supabase RLS policies, wrap auth functions in scalar subqueries (e.g., `(SELECT auth.uid())`) to prevent per-row re-evaluation.
- **Notifications**: Web Push is handled via `api/push.ts` and `sendNotification()` in `src/utils/notificationUtils.ts` (coupled with DB notification triggers).
