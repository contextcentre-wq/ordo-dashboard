# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ORDO Dashboard is a React SPA for marketing analytics — a Russian-language dashboard displaying campaign metrics, funnel data, ROMI gauges, and hierarchical data tables. Built as an AI Studio app with planned Gemini API integration.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build via Vite
npm run preview  # Preview production build
npx netlify-cli deploy --prod --dir=dist  # Deploy to https://ordo-dashboard.netlify.app
```

No test runner, linter, or formatter is configured.

## Tech Stack

- **React 19** with TypeScript (~5.8), Vite 6, lucide-react for icons
- **Tailwind CSS** loaded via CDN in `index.html` (not build-time processed)
- **Custom SVG charts** (FunnelChart, RomiGauge) — no charting library
- Path alias: `@/*` maps to project root

## Architecture

**Routing:** No React Router. `App.tsx` manages an `activePage` state (`Page` type from `types.ts`: `'dashboard' | 'sources' | 'audiences' | 'settings'`). A `renderPage()` switch statement renders the active page component. `Sidebar` calls `onNavigate()` to change pages.

**Auth:** Client-side only mock auth. `App.tsx` holds `isAuthenticated` state and conditionally renders Login/Register vs. the authenticated layout. No backend, tokens, or session persistence.

**State management:** React `useState` only — no global store. Data flows top-down via props. Mock data is defined inline in `Dashboard.tsx`.

**Component layout:**
- `App.tsx` → Sidebar + routed page content
- `components/pages/` — full page views (Dashboard, Sources, Audiences, Settings)
- `components/auth/` — Login, Register forms
- `components/widgets/` — visualization components (FunnelChart, RomiGauge, IncomeExpenseWidget)
- `components/` — shared layout (Sidebar, Header, KpiGrid, DataTable)

**Shared types** are in `types.ts` at the root — `Page`, `FunnelStage`, `Metric`, `TableRowData` (with nested `children` for hierarchical campaign data).

## Key Patterns

- All UI text is hardcoded in Russian (no i18n library)
- Tailwind theme colors defined in `index.html` script: `ordo-green`, `ordo-darkGreen`, `ordo-bg`, `ordo-text`, `ordo-gray`
- `DataTable` supports nested row expansion (projects → campaigns), sticky first column, and inline bar visualizations
- Environment variable `GEMINI_API_KEY` is injected via Vite's `define` config in `vite.config.ts`
