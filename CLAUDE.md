# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sandclock is a full-stack fintech investment platform. Users can register, invest in packages with varying ROI/duration, track their portfolio, and stake QUARTZ tokens. An admin panel manages users, packages, and balances.

## Commands

### Frontend (root directory)
```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript check + production build → dist/
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

### Backend (server/ directory)
```bash
cd server
npm run dev       # Start Express server with auto-restart (port 3001)
npm start         # Production start
```

Both frontend and backend must run simultaneously during development.

## Architecture

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router v7

**Backend:** Node.js (ES Modules) + Express + SQLite (via better-sqlite3)

### Frontend Structure

- [src/App.tsx](src/App.tsx) — Router setup and route definitions; wraps everything in `AuthProvider`
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx) — Global auth state using React Context; stores JWT in localStorage
- [src/config/api.ts](src/config/api.ts) — Exports `API_BASE_URL` from `VITE_API_URL` env var
- [src/pages/](src/pages/) — Full-page route components (Home, Login, Register, Earn, Portfolio, Staking, Admin)
- [src/components/](src/components/) — Reusable UI pieces (Navbar, Footer, Hero, VaultCards, etc.)

**Routing:** Public: `/`, `/earn`, `/staking` — Auth: `/login`, `/register` — Protected: `/portfolio` — Admin-only: `/admin`

### Backend Structure

- [server/index.js](server/index.js) — All Express routes and JWT auth middleware
- [server/database.js](server/database.js) — SQLite schema initialization; seeds default admin on first run
- [server/sandclock.db](server/sandclock.db) — SQLite database file (committed to repo)

### Database Schema

- **users** — id, email, password (bcrypt), name, balance, role (user/admin), status (active/suspended)
- **packages** — id, name, description, min/max_investment, roi_percentage, duration_days, is_active, gradient (Tailwind class)
- **investments** — id, user_id, package_id, amount, expected_return, status (active/completed), start/end dates
- **transactions** — id, user_id, type (deposit/investment/withdrawal), amount, description

### API Authentication

JWT tokens (7-day expiry) sent as `Authorization: Bearer <token>`. The `authenticateToken` middleware in [server/index.js](server/index.js) validates them. Admin routes additionally check `req.user.role === 'admin'`.

Default admin credentials (seeded automatically): `admin@sandclock.com` / `admin123`

## Environment Variables

**Frontend** — create `.env` from `.env.example`:
```
VITE_API_URL=http://localhost:3001
```

**Backend** — set in environment or defaults apply:
- `PORT` — defaults to `3001`
- `JWT_SECRET` — defaults to `'sandclock-secret-key-change-in-production'` (must be changed for production)
