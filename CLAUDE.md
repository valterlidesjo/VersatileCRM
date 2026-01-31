# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal CRM system built as a monorepo with npm workspaces. Handles customer prospecting, deal pipeline, meetings, billing, and quote generation.

## Monorepo Structure

- `packages/web` — React frontend (Vite, TanStack Router, Tailwind + shadcn/ui)
- `packages/shared` — Effect schemas and shared types
- `packages/functions` — Firebase Cloud Functions

## Commands

- `npm run dev` — Start web dev server with HMR
- `npm run build` — Build shared + web packages
- `npm run lint` — ESLint on web package
- `npm run dev -w @crm/web` — Start web dev server explicitly
- `npm run build -w @crm/shared` — Build shared package only

## Architecture

- **Entry flow**: `packages/web/index.html` → `src/main.tsx` → TanStack Router
- **Routing**: File-based routing via TanStack Router (`src/routes/`)
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Storage, Hosting)
- **Type safety**: Effect Schema (imported from `effect` package) for runtime validation + static types
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Path alias**: `@/` maps to `packages/web/src/`

## TypeScript

Strict mode enabled. Shared base config in `tsconfig.base.json`. Each package extends it. Target ES2022 with bundler module resolution.

## Key Patterns

- Schemas defined in `packages/shared/src/schemas/` — used by both web and functions
- Enums in `packages/shared/src/enums/`
- Feature code organized by domain in `packages/web/src/features/`
- Layout components in `packages/web/src/components/layout/`
- Firebase config via environment variables (`VITE_FIREBASE_*`)
