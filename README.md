# Kaleidoscope: TypeScript React Hono Template

An industry-standard, production-ready full-stack monorepo combining a **React 19** frontend with a **Hono** backend. This template is architected for maximum performance, end-to-end type safety, and scalability using **Turborepo** and **pnpm**.

---

## Architecture

The project follows a modular monorepo structure managed by **pnpm workspaces** and orchestrated by **Turborepo**.

```text
.
├── apps/
│   ├── web/                # React 19 frontend (Vite + TanStack Router)
│   └── api/                # Hono backend service
├── packages/
│   ├── db/                 # Drizzle ORM schema, client, and Zod models
│   ├── shared/             # Re-exports and stacks-agnostic utilities
│   └── config/             # Shared TypeScript and ESLint configurations
├── pnpm-workspace.yaml     # Workspace definition
├── package.json            # Workspace-wide dev tools and scripts
└── turbo.json              # Task orchestration and caching
```

### Core Technologies
- **Runtime**: Node.js 22+ (Runtime), pnpm (Package Manager), Bun (CLI Tooling)
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, TanStack Query & Router
- **Backend**: Hono v4 (Ultra-fast web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (Integrated server & client)
- **Monorepo**: Turborepo + pnpm Workspaces

### Key Principles
- **End-to-End Type Safety**: Shared types between frontend and backend via Hono RPC.
- **Single Source of Truth**: Zod schemas are derived directly from Drizzle tables in `packages/db`.
- **Modular Config**: Shared ESLint and TypeScript presets in `packages/config`.
- **Resilient Architecture**: Singleton database connections, global error handling, and secure headers by default.

---

## Getting Started

### Prerequisites
- **Node.js**: 22.14.0 or higher
- **pnpm**: 9.0.0 or higher
- **Bun**: (Optional) Used for fast script execution

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Kaleidoscope
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

---

## Development

### Start Development Servers
Run the full-stack environment concurrently:
```bash
pnpm dev
```
- **Frontend**: [http://localhost:4000](http://localhost:4000)
- **API**: [http://localhost:4001](http://localhost:4001)

### Database Management
Manage your database schema from the root:
- **Push Schema**: `pnpm db:push`
- **Drizzle Studio**: `pnpm db:studio`

### Quality Control
- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Format**: `pnpm format`

---

## Security and Reliability
- **Secure Headers**: Hono `secureHeaders` middleware pre-configured.
- **Error Boundaries**: Global React Error Boundary catches UI crashes.
- **Input Validation**: Strict Zod validation on all API boundaries.
- **Connection Pooling**: Singleton DB client prevents connection leaks.

---

## License
MIT
