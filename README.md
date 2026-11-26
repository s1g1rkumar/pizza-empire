# Pizza Empire Tycoon

Commercial browser-based business simulation and idle tycoon game with a complete supply-chain economy (Farming -> Food Processing -> Restaurants, Chains, Delivery, Supermarkets, and Shopping Malls) plus an internal Company Admin Portal.

## Project Structure

```text
pizza-empire/
├── backend/         # Node.js + Express + TypeScript modular monolith (/api/v1/*)
├── frontend/        # React + TypeScript + Vite + Tailwind + Redux Toolkit
├── database/
│   ├── migrations/  # Sequential MySQL 8 schema migrations (001-019)
│   └── seeds/       # Initial game catalog & configuration seeds
├── deploy/          # PM2 ecosystem, Nginx TLS config, backup/deploy/rollback scripts
├── documentation/   # PRD, GDD, Architecture, Database Design, Production Deployment
├── docker-compose.yml       # Development Docker stack (MySQL 8 + API + Web)
└── docker-compose.prod.yml  # Optional Production Docker stack
```

## Prerequisites

- Node.js 20+ (tested on v22)
- MySQL 8.0+

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secrets
npm install
npm run migrate
npm run seed
npm run dev
```

The API server runs on `http://localhost:4000` with health check at `GET /api/v1/health`.

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The player game runs on `http://localhost:5173` and the internal admin console is at `/admin/login`.

## Available Scripts

### Backend (`backend/`)
- `npm run dev` — Start development server with hot reload (`tsx watch`)
- `npm test` — Run unit, security, and API integration tests (`tsx --test src/tests/*.test.ts`)
- `npm run build` — Compile TypeScript to `dist/`
- `npm run start` — Run compiled production server
- `npm run migrate` — Apply MySQL 8 schema migrations (`001`–`019`)
- `npm run seed` — Execute seed SQL files
- `npm run lint` — Run ESLint
- `npm run format` — Format source files with Prettier

### Frontend (`frontend/`)
- `npm run dev` — Start Vite development server
- `npm run build` — Type-check and build production bundle (`tsc -b && vite build`)
- `npm run lint` — Run ESLint
- `npm run format` — Format source files with Prettier

## Production Deployment

See [documentation/PRODUCTION_DEPLOYMENT.md](documentation/PRODUCTION_DEPLOYMENT.md) for Ubuntu server provisioning, MySQL 8 backups, PM2, Nginx + HTTPS, GitHub Actions CI/CD, and rollback procedures.
