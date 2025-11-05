# SaaS Starter Kit

A professional, production-ready SaaS starter kit built as a TypeScript monorepo.

## Features

- **Monorepo**: pnpm + Turborepo for fast, efficient builds
- **Backend**: Hono with Better Auth server
- **Frontend**: Next.js 15 with App Router + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Better Auth with email/password + JWT plugin
- **Authorization**: Role-based access control (admin/user)
- **Type Safety**: End-to-end TypeScript with strict mode
- **Testing**: Vitest with schema validation tests
- **Code Quality**: TypeScript strict mode, ESLint, Prettier
- **Git Workflow**: Husky + commitlint for conventional commits

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker (for local PostgreSQL)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd kit

# Install dependencies
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Update .env with your values:
# - DATABASE_URL: Your PostgreSQL connection string
# - BETTER_AUTH_SECRET: Generate with: openssl rand -base64 32
```

**Note:** Environment variables are loaded from the workspace root `.env` file using the `@kit/env` package. This package automatically finds and loads the `.env` file from the workspace root, regardless of where the script runs from. It supports environment-specific files (`.env.development`, `.env.production`, etc.) based on `NODE_ENV`.

### 3. Start Database

```bash
# Start PostgreSQL with Docker (or use your own instance)
docker run -d \
  --name saas-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=saas_starter_kit \
  -p 5432:5432 \
  postgres:16

# Generate and run migrations
pnpm db:generate
pnpm db:migrate

# Seed admin user (optional)
pnpm db:seed
```

Default admin credentials (if seeded):
- Email: admin@example.com
- Password: admin123

### 4. Start Development Servers

```bash
# Start all apps in development mode
pnpm dev

# Or start individually:
pnpm --filter @kit/api dev      # API on http://localhost:3001
pnpm --filter @kit/web dev      # Web on http://localhost:3000
```

Visit:
- **Web app**: http://localhost:3000
- **API health**: http://localhost:3001/health
- **API documentation**: http://localhost:3001/docs
- **OpenAPI spec**: http://localhost:3001/openapi.json
- **Better Auth endpoints**: http://localhost:3001/api/auth/*

## Project Structure

```
kit/
├── apps/
│   ├── api/          # Hono backend with Better Auth server
│   └── web/          # Next.js frontend with shadcn/ui
├── packages/
│   └── @kit/
│       └── database  # Drizzle ORM schema & migrations
├── docs/             # Documentation
└── tests/            # E2E tests (future)
```

## Available Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm build                  # Build all packages/apps
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm typecheck              # Type check all packages

# Database
pnpm db:generate            # Generate migration from schema changes
pnpm db:migrate             # Run pending migrations
pnpm db:studio              # Open Drizzle Studio (database GUI)
pnpm db:seed                # Seed admin user

# API Client
pnpm generate:client        # Generate TypeScript client from OpenAPI spec

# Package-specific
pnpm --filter @kit/api dev      # Start Hono API server
pnpm --filter @kit/web dev      # Start Next.js frontend
pnpm --filter @kit/database test # Run schema validation tests
```

## Documentation

- [Requirements](./REQUIREMENTS.md) - Project requirements and roadmap
- [Architecture](./docs/ARCHITECTURE.md) - System design and patterns
- [Development Guide](./docs/BETTER-CLAUDE.md) - Development workflow
- [OpenAPI & API Client](./docs/OPENAPI.md) - API documentation and type-safe client usage

## Tech Stack

**Monorepo & Build:**
- pnpm, Turborepo (future)

**Backend:**
- Hono, Better Auth, PostgreSQL, Drizzle ORM

**Frontend:**
- Next.js 15, React 19, Tailwind CSS, shadcn/ui

**Auth & Permissions:**
- Better Auth with JWT plugin, Role-based access control

**Testing:**
- Vitest with schema validation tests

**Tooling:**
- TypeScript strict mode, ESLint, Prettier, Husky, commitlint

## License

Private - Not for distribution

## Next Steps

1. Review [REQUIREMENTS.md](./REQUIREMENTS.md) for planned features
2. Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for design decisions
3. Follow [BETTER-CLAUDE.md](./docs/BETTER-CLAUDE.md) for development workflow
4. Start building your SaaS application!
