# SaaS Starter Kit - Requirements & Planning

## Project Overview

A professional, production-ready SaaS starter kit built as a TypeScript monorepo. Designed to be both a template for building SaaS applications and a commercial product for developers.

**Version:** 1.0.0 (Initial)
**Last Updated:** 2025-10-15

---

## Core Principles

1. **Type Safety First** - End-to-end type safety from database to UI
2. **Developer Experience** - Clear documentation, intuitive APIs, easy setup
3. **Production Ready** - Security, performance, scalability built-in
4. **Test-Driven Development** - Comprehensive test coverage from day one
5. **Maintainable** - Clean architecture, dependency injection, clear boundaries
6. **Professional Git Practices** - Granular commits, conventional commits, protected branches

---

## Technology Stack

### Monorepo & Build System

- **pnpm** - Package manager with workspace support
- **Turborepo** - Build orchestration, caching, task scheduling
- Workspace packages use `workspace:*` protocol (always in sync)

### Frontend Applications

- **Next.js 14+** (App Router) - Main SaaS application
    - React Server Components
    - Server Actions for mutations
    - TypeScript strict mode
- **Astro** - Marketing site (landing, pricing, docs, blog)
    - Static generation for performance
    - Content collections for blog/docs
    - Optional React islands

### Backend

- **Hono** - HTTP framework (lightweight, modern, edge-ready)
- **@hono/zod-openapi** - OpenAPI spec generation with Zod
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Migrations and schema management only
- Repositories use flexible query approach (Drizzle, Kysely, or raw SQL)

### Authentication & Authorization

- **Better Auth** - Modern TypeScript-first authentication
    - Email/password authentication
    - OAuth providers (Google, GitHub, etc.)
    - Session management
    - Email verification & password reset
- **CASL** - Authorization with ability-based access control
    - Hybrid RBAC + ABAC model
    - Backend enforcement, frontend optimistic checks
    - Shared ability definitions

### Payments

- **Polar.sh** - Modern payment platform for SaaS
    - Subscription management
    - Usage-based billing
    - Webhook handling

### Type-Safe API Client

- **OpenAPI spec** - Auto-generated from Hono + Zod schemas
- **openapi-typescript** - Generate TypeScript types from spec
- **openapi-fetch** - Type-safe fetch client
- Flow: Zod schemas → OpenAPI → Generated client types

### Testing

- **Vitest** - Unit and integration tests
- **Playwright** - E2E tests
- **@testing-library/react** - Component tests
- **Testcontainers** - Integration tests with real Postgres
- In-memory repositories for unit tests

### Code Quality & Tooling

- **TypeScript** - Strict mode across all packages
- **ESLint** - Linting with shared config
- **Prettier** - Code formatting
- **Husky** - Git hooks (pre-commit)
- **lint-staged** - Run linters on staged files
- **commitlint** - Enforce conventional commits
- **Changesets** - Version management and changelogs

---

## Monorepo Structure

```
kit/
├── apps/
│   ├── api/                      # Hono backend API
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point
│   │   │   ├── app.ts            # App factory (DI composition root)
│   │   │   ├── entities/         # Internal entity types (not shared)
│   │   │   ├── repositories/     # Data access implementations
│   │   │   ├── services/         # Business logic
│   │   │   ├── routes/           # API route handlers
│   │   │   ├── middleware/       # Auth, rate limiting, etc.
│   │   │   └── emails/           # Email templates (React Email)
│   │   └── tests/
│   │       ├── helpers.ts        # Test utilities
│   │       └── setup.ts          # Test configuration
│   │
│   ├── web/                      # Next.js application
│   │   ├── app/                  # App router
│   │   │   ├── (auth)/          # Auth routes
│   │   │   ├── (dashboard)/     # Protected routes
│   │   │   └── layout.tsx
│   │   ├── components/           # React components
│   │   ├── lib/
│   │   │   ├── api.ts           # API client wrapper
│   │   │   └── db/              # Direct DB queries (minimal)
│   │   └── tests/
│   │
│   └── marketing/                # Astro marketing site
│       ├── src/
│       │   ├── pages/           # Landing, pricing, about
│       │   ├── content/         # Blog posts, docs (MDX)
│       │   ├── components/
│       │   └── layouts/
│       └── astro.config.mjs
│
├── packages/
│   ├── @kit/database/            # Database client & migrations
│   │   ├── src/
│   │   │   ├── client.ts        # Postgres client setup
│   │   │   └── schema/          # Drizzle schema (for migrations)
│   │   ├── migrations/          # SQL migration files
│   │   └── drizzle.config.ts
│   │
│   ├── @kit/auth/                # Better Auth configuration
│   │   ├── src/
│   │   │   ├── config.ts        # Better Auth server config
│   │   │   ├── client.ts        # Better Auth client utilities
│   │   │   └── utils.ts         # Password rules, validators
│   │   └── package.json
│   │
│   ├── @kit/authorization/       # CASL permissions
│   │   ├── src/
│   │   │   ├── abilities.ts     # Ability definitions
│   │   │   ├── roles.ts         # Role definitions
│   │   │   └── types.ts         # Authorization types
│   │   └── package.json
│   │
│   ├── @kit/api-client/          # Generated OpenAPI client
│   │   ├── src/
│   │   │   ├── index.ts         # Client factory
│   │   │   └── generated/       # Auto-generated types
│   │   │       └── openapi.ts
│   │   └── package.json
│   │
│   └── @kit/config/              # Shared configurations
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── node.json
│       └── prettier/
│           └── index.js
│
├── docs/                         # Documentation
│   ├── README.md                # Getting started
│   ├── ARCHITECTURE.md          # System design
│   ├── DEVELOPMENT.md           # Development workflow
│   ├── TESTING.md               # Testing guide
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── CUSTOMIZATION.md         # Customization guide
│   ├── CONTRIBUTING.md          # Contribution guidelines
│   ├── TROUBLESHOOTING.md       # Common issues
│   └── decisions/               # Architecture Decision Records
│       ├── 001-monorepo-structure.md
│       ├── 002-hono-openapi.md
│       ├── 003-casl-authorization.md
│       └── 004-testing-strategy.md
│
├── tests/                        # E2E tests
│   └── e2e/
│       ├── auth.spec.ts
│       ├── subscription.spec.ts
│       └── playwright.config.ts
│
├── scripts/                      # Build/deployment scripts
│   ├── setup.sh
│   └── generate-client.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Test, lint, build
│       └── deploy.yml           # Deployment
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .gitignore
├── .prettierrc
├── .eslintrc.js
└── README.md
```

---

## Package Justifications

### Why Each Package is External

**`@kit/database`**

- **Used by:** API (all data), Web (Better Auth + optional Server Components)
- **Purpose:** Database client, migrations, schema
- **Justification:** Both apps need DB access; migrations need standalone package

**`@kit/auth`**

- **Used by:** API (server config), Web (client), Marketing (optional), future Mobile
- **Purpose:** Better Auth configuration and utilities
- **Justification:** Ensures consistent auth setup across all clients

**`@kit/authorization`**

- **Used by:** API (enforcement), Web (optimistic checks)
- **Purpose:** CASL ability definitions
- **Justification:** Permissions must be identical on both sides

**`@kit/api-client`**

- **Used by:** Web, Marketing, future Mobile, customer apps
- **Purpose:** Type-safe API client
- **Justification:** Reusable across multiple frontends, good DX for customers

**`@kit/config`**

- **Used by:** All apps and packages
- **Purpose:** Shared build configs (TypeScript, ESLint, Prettier)
- **Justification:** Ensures consistency across entire monorepo

### Packages NOT Created (Initially)

**`@kit/ui`** - ❌ Not created initially

- Reason: Only 2 consumers, adds build complexity
- Alternative: Components in `apps/web/components`, importable if needed
- Add later if Marketing needs significant shared components

**`@kit/emails`** - ❌ Not a package

- Reason: Only API sends emails
- Location: `apps/api/emails/` (internal to API)

**`@kit/utils`** - ❌ Not created

- Reason: Becomes dumping ground, unclear boundaries
- Alternative: Domain-specific utils in relevant packages

---

## Data Architecture

### Entity Definition Pattern

Entities are defined **separately** from repositories to ensure type safety:

```typescript
// apps/api/src/entities/user.entity.ts
import { z } from 'zod';

export const UserEntity = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type User = z.infer<typeof UserEntity>;
```

### Repository Pattern

Repositories must validate DB results against entity schemas:

```typescript
// apps/api/src/repositories/user.repository.ts
import { UserEntity, type User } from '../entities/user.entity';
import type { Database } from '@kit/database';

export class UserRepository {
    constructor(private db: Database) {}

    async findById(id: string): Promise<User | null> {
        // Query using any method (Drizzle, Kysely, raw SQL)
        const result = await this.db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!result) return null;

        // MUST validate against entity schema
        return UserEntity.parse(result);
    }
}

// In-memory implementation for tests
export class InMemoryUserRepository {
    private users: Map<string, User> = new Map();

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }
}
```

### Data Flow

```
Backend Validation Schema (apps/api/src/schemas)
         ↓
    API Route (validates input + generates OpenAPI spec)
         ↓
    Generated API Client (@kit/api-client) → Frontend (type-safe)
         ↓
    Service Layer (business logic)
         ↓
    Repository (DB access)
         ↓
    Entity Validation (parse DB result)
         ↓
    Return to Service
         ↓
    API Response (OpenAPI spec)
         ↓
    Generated Client Types
         ↓
    Frontend (type-safe)
```

---

## Authentication & Authorization

### User Roles

Initial roles (defined in database schema and enforced by backend):

- `anon` - Unauthenticated users
- `user` - Authenticated users (free tier)
- `premium` - Premium subscription tier
- `pro` - Pro subscription tier
- `admin` - System administrators

### Authorization Model: Hybrid RBAC + ABAC

**Role-Based:**

- Admins can manage everything
- Premium/Pro users have higher quotas

**Attribute-Based:**

- Users can only modify their own resources
- Resource ownership checks (`authorId === user.id`)

**Example:**

```typescript
// packages/authorization/src/abilities.ts
import { defineAbility } from '@casl/ability';

export function defineAbilitiesFor(user: User, organizationRole?: string) {
    return defineAbility((can, cannot) => {
        if (user.role === 'admin') {
            can('manage', 'all');
        } else {
            // Read public content
            can('read', 'Post', { published: true });

            // Create own content
            can('create', 'Post');

            // Update/delete own content
            can(['update', 'delete'], 'Post', { authorId: user.id });

            // Update own profile
            can('update', 'User', { id: user.id });
        }

        // Organization-level permissions (if multi-tenant)
        if (organizationRole === 'owner') {
            can('manage', 'all', {
                organizationId: user.currentOrganizationId,
            });
        }
    });
}
```

### Multi-Tenancy (Future)

**Pattern:** Row-level tenancy (simple, scalable)

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_org ON posts(organization_id);
```

**Database Schema (when needed):**

- `organizations` table
- `organization_members` table (user ↔ org many-to-many)
- All resources have `organization_id` foreign key

---

## Dependency Injection

Simple factory-based DI (no framework):

```typescript
// apps/api/src/app.ts
export function createApp() {
    const env = process.env;
    const isTest = env.NODE_ENV === 'test';

    // 1. Infrastructure
    const db = isTest ? null : createDatabase(env.DATABASE_URL!);

    // 2. Repositories (environment-based)
    const userRepository =
        isTest || !db
            ? new InMemoryUserRepository()
            : new DrizzleUserRepository(db);

    // 3. Services
    const emailService = new EmailService({
        provider: isTest ? 'console' : 'resend',
        apiKey: env.RESEND_API_KEY,
    });

    const paymentService = new PaymentService({
        apiKey: env.POLAR_API_KEY,
    });

    // 4. Register routes with dependencies
    const app = new OpenAPIHono();

    app.route('/users', userRoutes({ userRepository }));
    app.route('/auth', authRoutes({ userRepository, emailService }));

    return app;
}
```

**Benefits:**

- Simple, no magic
- Easy to test (inject mocks)
- Type-safe
- Clear dependency graph

---

## Testing Strategy

### Test Types

**Unit Tests** (Fast, in-memory)

- Pure functions, utilities
- Services with mocked dependencies
- Components (isolated)
- Uses: In-memory repositories

**Integration Tests** (Medium, real DB)

- Repository implementations
- API endpoints
- Database queries
- Uses: Testcontainers (Postgres)

**E2E Tests** (Slow, full stack)

- Critical user flows (signup, login, billing)
- Multi-step processes
- Uses: Testcontainers + Playwright

### Test Location

Co-located with source code:

```
src/
├── repositories/
│   ├── user.repository.ts
│   └── user.repository.test.ts
├── services/
│   ├── email.service.ts
│   └── email.service.test.ts
```

E2E tests centralized:

```
tests/e2e/
├── auth.spec.ts
├── subscription.spec.ts
```

### Coverage Goals

- Critical paths: 100%
- Business logic: >90%
- Overall: >80%

---

## Git Workflow

### Branch Strategy

**Protected Branch:**

- `main` - Production code, no direct commits, requires PR

**Feature Branches:**

- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Refactoring
- `docs/*` - Documentation
- `test/*` - Tests
- `chore/*` - Dependencies, tooling

### Commit Convention

**Format:** `<type>(<scope>): <description>`

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Refactoring
- `chore` - Build, deps, tooling
- `perf` - Performance
- `ci` - CI/CD

**Examples:**

```
feat(auth): add Google OAuth provider
fix(api): handle null user in session
test(database): add user repository tests
docs(api): document rate limiting
chore(deps): update dependencies
```

### PR Requirements

Before merge to `main`:

- ✅ All tests pass (unit + integration + e2e)
- ✅ Build succeeds
- ✅ No lint/type errors
- ✅ Conventional commit format
- ✅ Documentation updated (if needed)

### Merge Strategy

**Squash merge** (recommended)

- All commits squashed into one
- PR title becomes commit message
- Clean, linear history

---

## Versioning Strategy

**Single version for entire kit:**

- Version applies to whole monorepo, not individual packages
- Workspace packages use `workspace:*` (always in sync)
- Deploy all apps together (atomic deployment)
- No version skew between API and frontend

**Changesets workflow:**

```bash
# Document changes
pnpm changeset add

# Version bump (updates package.json versions)
pnpm changeset version

# Create git tag
git tag v1.0.0
git push --tags
```

---

## Deployment Strategy

### Single VPS Deployment (Initial)

All apps deployed together on one server:

- API + Web + Marketing on same version
- Shared database
- Simple, cost-effective

### Horizontal Scaling Path (Future)

Multiple instances of same version:

```
Load Balancer
    ├─ API instance 1 (v1.0.0)
    ├─ API instance 2 (v1.0.0)
    └─ API instance 3 (v1.0.0)

Web instances:
    ├─ Web instance 1 (v1.0.0)
    └─ Web instance 2 (v1.0.0)
```

Deployment methods:

- Blue/green deployment
- Rolling updates (gradual)
- No version skew

---

## Phase 1: MVP Features (Initial Build)

### Must-Have Features

**Authentication:**

- [x] Email/password signup and login
- [x] Email verification
- [x] Password reset
- [x] Session management
- [ ] OAuth (Google, GitHub)

**Authorization:**

- [x] Basic CASL setup
- [x] Role-based permissions
- [x] Resource ownership checks

**User Management:**

- [x] User registration
- [x] User profile
- [x] Account settings

**Infrastructure:**

- [x] Database migrations
- [x] Type-safe API client
- [x] Testing infrastructure
- [x] CI/CD pipeline
- [x] Documentation

---

## Future Phases

### Phase 2: Billing & Subscriptions

- Polar.sh integration
- Subscription plans
- Payment methods
- Usage tracking
- Customer portal

### Phase 3: Platform Features

- Email system (transactional)
- File upload/storage
- Background jobs
- Rate limiting
- Audit logging

### Phase 4: Multi-Tenancy

- Organizations/teams
- Team invitations
- Role-based org permissions
- Organization billing

### Phase 5: Advanced Features

- Real-time (WebSockets)
- Notifications system
- Search (Meilisearch/Typesense)
- API versioning
- Internationalization

---

## Documentation Requirements

All code changes must include documentation updates:

1. **Code comments** - Complex logic must be documented
2. **README updates** - If setup changes
3. **ARCHITECTURE.md** - If design changes
4. **ADRs** - For major decisions
5. **Swagger/OpenAPI** - Auto-generated, kept up to date
6. **Tutorials** - Where it makes sense

---

## Success Criteria

### For Developers (Users of Kit)

- ✅ Can set up locally in < 10 minutes
- ✅ Clear documentation for all features
- ✅ Easy to customize for their SaaS
- ✅ Production-ready out of the box
- ✅ Good test coverage examples

### For Maintainers (You)

- ✅ Easy to add new features
- ✅ Simple to refactor
- ✅ Clear architecture boundaries
- ✅ Comprehensive tests prevent regressions
- ✅ Documentation stays up to date

### For Customers (Buyers)

- ✅ Professional, polished product
- ✅ Excellent documentation
- ✅ Active maintenance
- ✅ Clear upgrade path
- ✅ Good support resources

---

## Open Questions

1. **Email service:** Resend, Postmark, or SendGrid?
2. **File storage:** Cloudflare R2, AWS S3, or UploadThing?
3. **Error tracking:** Sentry, or something else?
4. **Hosting recommendation:** Vercel, Railway, fly.io, or VPS guide?
5. **Pricing model:** One-time, subscription for updates, or tiered?

---

**Next Steps:**

1. Review and approve this requirements document
2. Create ARCHITECTURE.md with detailed design
3. Initialize monorepo structure
4. Implement Phase 1 MVP with TDD approach
