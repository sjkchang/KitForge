# Guide for Claude: SaaS Starter Kit Development

**Purpose:** This document provides comprehensive context and working guidelines for Claude Code across all sessions. Read this carefully before starting any work.

**Last Updated:** 2025-10-23

---

## Project Tracking & Task Management

### CRITICAL: You Must Track All Work

**Every session MUST use the TodoWrite tool to track progress.** This is non-negotiable for:
- Complex multi-step tasks (3+ steps)
- User-provided lists of tasks
- Any non-trivial implementation work
- Bug fixes requiring investigation
- Refactoring work

### Task Management Rules

**Task States:**
- `pending` - Not yet started
- `in_progress` - Currently working on (ONLY ONE at a time)
- `completed` - Finished and verified

**Task Lifecycle:**
1. **Create tasks** - Break down work into specific, actionable items
2. **Mark in_progress** - Before starting work (exactly ONE task at a time)
3. **Complete immediately** - Mark completed as soon as done (don't batch)
4. **Update in real-time** - Keep the user informed of progress

**Task Format:**
Each task requires TWO forms:
- `content` - Imperative form: "Run tests", "Fix authentication bug"
- `activeForm` - Present continuous: "Running tests", "Fixing authentication bug"

**Completion Requirements:**
- ONLY mark completed when FULLY done
- If blocked or encountering errors, keep as `in_progress`
- Create new tasks for blockers or new discoveries
- Never mark as completed if:
  - Tests are failing
  - Implementation is partial
  - Unresolved errors exist
  - Required files/dependencies missing

### Example Session Flow

```
User: "Add dark mode toggle and run tests"

1. Create todos:
   - [ ] Create dark mode toggle component
   - [ ] Add theme state management
   - [ ] Update styles for dark theme
   - [ ] Run tests and fix any failures

2. Mark first task as in_progress
3. Complete task, mark as completed
4. Move to next task (mark as in_progress)
5. Continue until all tasks completed
```

### When NOT to Use Todos

Skip the todo list for:
- Single, trivial tasks
- Pure informational questions
- Simple explanations
- Tasks with <3 trivial steps

---

## Core Philosophy

1. **Granular Commits** - Every change small, focused, and revertible
2. **Test-Driven Development** - Write tests first, then implement
3. **Documentation First** - Update docs with code changes in same PR
4. **Type Safety** - End-to-end type safety from DB to UI
5. **Simple Over Clever** - Choose clarity over cleverness
6. **Track Everything** - Use todos to maintain visibility

---

## What This Project Is

A professional, production-ready SaaS starter kit built as a TypeScript monorepo that can be:
1. Used as a template for building SaaS applications
2. Sold as a commercial product to developers

---

## Working Principles

**DO:**
- Make small, incremental commits
- Write tests before implementation
- Update documentation in the same commit
- Ask for clarification when uncertain
- Follow conventional commit format
- Validate all external data with Zod
- Use in-memory implementations for tests
- **Track all work with TodoWrite tool**
- **Update todo status in real-time**
- **Complete tasks immediately when done**

**DON'T:**
- Make large, sweeping changes
- Skip tests
- Leave documentation outdated
- Guess at implementation details
- Deviate from established patterns
- Trust database results without validation
- Add packages not in the approved list
- Add Co-Authored-By or emoji lines to commit messages
- **Batch multiple completions without updating todos**
- **Have more than one task in_progress at a time**
- **Mark tasks complete when blocked or failing**

---

## Project Structure Overview

```
kit/
├── apps/
│   ├── api/          # Hono backend (HTTP + OpenAPI)
│   ├── web/          # Next.js frontend (App Router)
│   └── marketing/    # Astro marketing site
├── packages/
│   ├── @kit/validation      # Zod schemas + constants
│   ├── @kit/database        # DB client + migrations
│   ├── @kit/auth            # Better Auth config
│   ├── @kit/authorization   # CASL abilities
│   ├── @kit/api-client      # Generated OpenAPI client
│   └── @kit/config          # Shared configs
├── docs/            # All documentation
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md (to be created)
│   ├── TESTING.md (to be created)
│   └── decisions/   # ADRs
├── tests/           # E2E tests
└── scripts/         # Build/deploy scripts
```

---

## Technology Stack Reference

### Core Technologies

**Monorepo:**
- pnpm (package manager)
- Turborepo (build orchestration)
- workspace:* protocol (always use local packages)

**Backend:**
- Hono (HTTP framework)
- @hono/zod-openapi (OpenAPI generation)
- PostgreSQL (database)
- Drizzle ORM (migrations only, NOT for all queries)
- Better Auth (authentication)
- CASL (authorization)

**Frontend:**
- Next.js 14+ (App Router, React Server Components)
- Astro (marketing site)
- openapi-fetch (type-safe API client)

**Testing:**
- Vitest (unit + integration)
- Playwright (E2E)
- Testcontainers (integration tests with real Postgres)
- In-memory repositories (unit tests)

**Tooling:**
- TypeScript (strict mode)
- ESLint + Prettier
- Husky (pre-commit hooks)
- commitlint (enforce conventional commits)

---

## Key Architectural Patterns

### 1. Service Registry Pattern (Dependency Injection)

We use a **Service Registry** pattern for managing application services. This provides centralized service management with lazy initialization and easy testing.

**Location:** `apps/api/src/services/`

**File Structure:**
```
services/
├── registry.ts           # Generic ServiceRegistry class
├── types.ts             # Services interface definition
└── service-registry.ts  # Service registration & exports
```

**Usage:**
```typescript
// Import and use services directly
import { services } from './services/service-registry';

// Clean, ergonomic API
await services.email.sendEmailVerification({
  to: 'user@example.com',
  userName: 'John',
  verificationUrl: 'https://...',
});

// Or destructure for convenience
const { email } = services;
await email.sendPasswordReset({ ... });
```

**How it works:**

1. **Define service interface** (`services/types.ts`):
```typescript
import type { EmailService } from '../email/email.service';

export interface Services {
  email: EmailService;
  // Future services:
  // sms: SmsService;
  // storage: StorageService;
}
```

2. **Register services** (`services/service-registry.ts`):
```typescript
export function registerServices(): void {
  registry.register('email', () => {
    return new EmailService({
      providerType: process.env.EMAIL_PROVIDER || 'console',
      resendApiKey: process.env.RESEND_API_KEY,
      defaultFrom: process.env.EMAIL_FROM || 'noreply@localhost.com',
    });
  });
}

// Export services with auto-registration
export const services = servicesProxy;
```

3. **Auto-registration:** Services register automatically on first access via Proxy

**Testing:**
```typescript
import { configureServices, resetServices } from './services/service-registry';

beforeEach(() => {
  // Override services for testing
  configureServices({
    email: mockEmailService,
  });
});

afterEach(() => {
  resetServices(); // Clear instances
});
```

**Key Benefits:**
- **Ergonomic API:** Import once, use anywhere with `services.email`
- **Lazy initialization:** Services created only when first accessed
- **Type-safe:** Full TypeScript autocomplete and type checking
- **Centralized:** All service registration in one place
- **Testable:** Easy to mock with `configureServices()`
- **Scalable:** Simple pattern for adding new services

**Adding a New Service:**

1. Create the service class (e.g., `sms/sms.service.ts`)
2. Add to `Services` interface in `services/types.ts`
3. Register in `registerServices()` in `services/service-registry.ts`
4. Use anywhere: `services.sms.send(...)`

### 2. Entity + Repository Pattern

**Entities (Source of Truth):**
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

**Repositories (MUST validate against entities):**
```typescript
// apps/api/src/repositories/user.repository.ts
export class DrizzleUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!result) return null;

    // CRITICAL: Always validate DB results
    return UserEntity.parse(result);
  }
}
```

**Why this matters:**
- Entities are NOT tied to ORM types
- Runtime validation ensures type safety
- Easy to swap query implementations
- Test implementations don't need DB

### 3. Type-Safe API Client Flow

```
1. Define Zod schema in @kit/validation
   ↓
2. Use schema in API route with .openapi()
   ↓
3. OpenAPI spec auto-generated
   ↓
4. Run: pnpm generate:client
   ↓
5. TypeScript types generated in @kit/api-client
   ↓
6. Frontend uses type-safe client
```

**Example:**
```typescript
// 1. Validation schema
// packages/validation/src/user.ts
export const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string(),
});

// 2. API route
// apps/api/src/routes/users.ts
const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserInput.openapi('CreateUserInput'),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserEntity.openapi('User'),
        },
      },
    },
  },
});

// 3. Frontend usage (fully typed!)
// apps/web/components/CreateUser.tsx
const { data, error } = await api.POST('/users', {
  body: { email: 'test@example.com', name: 'Test' }
});
// data is typed as User | undefined
```

### 4. Authorization Pattern (CASL)

**Define abilities:**
```typescript
// packages/authorization/src/abilities.ts
export function defineAbilitiesFor(user: User) {
  return defineAbility((can, cannot) => {
    if (user.role === 'admin') {
      can('manage', 'all');
    } else {
      can('read', 'Post', { published: true });
      can(['update', 'delete'], 'Post', { authorId: user.id });
    }
  });
}
```

**Enforce on backend:**
```typescript
// apps/api/src/routes/posts.ts
app.delete('/posts/:id', async (c) => {
  const user = c.get('user');
  const ability = defineAbilitiesFor(user);

  const post = await postRepo.findById(c.req.param('id'));

  if (!ability.can('delete', subject('Post', post))) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await postRepo.delete(post.id);
  return c.json({ success: true });
});
```

**Optimistic checks on frontend:**
```typescript
// apps/web/components/PostActions.tsx
const ability = defineAbilitiesFor(user);

return (
  <>
    {ability.can('update', subject('Post', post)) && (
      <button>Edit</button>
    )}
  </>
);
```

---

## Implementation Workflow

### Starting a New Feature

**1. Create todos for the feature:**
Use TodoWrite to break down the feature into actionable steps.

**2. Create feature branch:**
```bash
git checkout -b feature/user-authentication
```

**3. Write test first (TDD):**
```typescript
// apps/api/src/repositories/user.repository.test.ts
describe('UserRepository', () => {
  it('should create user with hashed password', async () => {
    const user = await userRepo.create({
      email: 'test@example.com',
      password: 'plaintext',
    });

    expect(user.id).toBeDefined();
    expect(user.password).not.toBe('plaintext'); // Should be hashed
  });
});
```

**4. Implement to pass test:**
```typescript
// apps/api/src/repositories/user.repository.ts
async create(data: CreateUserData): Promise<User> {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [result] = await this.db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
    })
    .returning();

  return UserEntity.parse(result);
}
```

**5. Commit (granular, focused):**
```bash
git add apps/api/src/repositories/user.repository.ts
git add apps/api/src/repositories/user.repository.test.ts
git commit -m "feat(api): add password hashing to user creation"
```

**6. Update todo as completed and move to next task**

**7. Continue with next small piece:**
```bash
# Next commit: Add login endpoint
# Next commit: Add session management
# Next commit: Add logout endpoint
```

### Adding a New Package

**Only add packages that are:**
1. Shared between multiple apps
2. Approved in REQUIREMENTS.md
3. Have clear, singular purpose

**Process:**
```bash
# 1. Create package structure
mkdir -p packages/@kit/new-package/src

# 2. Add package.json
cat > packages/@kit/new-package/package.json << EOF
{
  "name": "@kit/new-package",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "dependencies": {}
}
EOF

# 3. Add to pnpm-workspace.yaml (if not already)
# (Already includes "packages/*")

# 4. Create index.ts with exports
# 5. Document in ARCHITECTURE.md
# 6. Update REQUIREMENTS.md with justification
```

### Database Migrations

**Workflow:**
```bash
# 1. Update Drizzle schema
# Edit: packages/database/src/schema/users.ts

# 2. Generate migration
pnpm db:generate
# Creates: packages/database/migrations/0001_xyz.sql

# 3. Review migration SQL
cat packages/database/migrations/0001_xyz.sql

# 4. Apply to local DB
pnpm db:migrate

# 5. Test that it works
pnpm test

# 6. Commit BOTH schema and migration
git add packages/database/src/schema
git add packages/database/migrations
git commit -m "feat(database): add email_verified column to users"
```

### Adding API Endpoints

**1. Define validation schema:**
```typescript
// packages/validation/src/user.ts
export const UpdateUserInput = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
});
```

**2. Define route:**
```typescript
// apps/api/src/routes/users.ts
const updateUserRoute = createRoute({
  method: 'patch',
  path: '/users/{id}',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateUserInput.openapi('UpdateUserInput'),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserEntity.openapi('User'),
        },
      },
    },
  },
});
```

**3. Implement handler:**
```typescript
app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  const user = await userRepository.update(id, data);

  return c.json(user);
});
```

**4. Regenerate client:**
```bash
pnpm generate:client
```

**5. Commit:**
```bash
git add packages/validation/src/user.ts
git add apps/api/src/routes/users.ts
git add packages/api-client/src/generated/openapi.ts
git commit -m "feat(api): add PATCH /users/:id endpoint"
```

---

## Testing Guidelines

### Test Types

**Unit Tests (In-Memory):**
```typescript
// Use in-memory repositories
const userRepo = new InMemoryUserRepository();
const service = new UserService(userRepo);

// Fast, no DB needed
```

**Integration Tests (Testcontainers):**
```typescript
// Real Postgres in Docker
const container = await new GenericContainer('postgres:16')
  .withEnvironment({ POSTGRES_PASSWORD: 'test' })
  .start();

const db = await createDatabase(connectionString);
const userRepo = new DrizzleUserRepository(db);

// Tests real DB interactions
```

**E2E Tests (Playwright):**
```typescript
// Full user flow
test('user can sign up and log in', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name=email]', 'test@example.com');
  // ...
});
```

### Test File Organization

**Co-locate tests:**
```
src/
├── repositories/
│   ├── user.repository.ts
│   └── user.repository.test.ts  # Integration test
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts     # Unit test
```

**E2E tests separate:**
```
tests/
└── e2e/
    ├── auth.spec.ts
    └── billing.spec.ts
```

### Coverage Expectations

- **Critical paths:** 100% (auth, payments, etc.)
- **Business logic:** >90%
- **Overall:** >80%

---

## Common Patterns & Solutions

### Pattern: Adding a New Entity

```bash
# 1. Create entity
# apps/api/src/entities/post.entity.ts

# 2. Create validation schemas
# packages/validation/src/post.ts

# 3. Create database schema
# packages/database/src/schema/posts.ts

# 4. Generate migration
pnpm db:generate

# 5. Create repository (with in-memory version)
# apps/api/src/repositories/post.repository.ts

# 6. Create service (optional, if business logic)
# apps/api/src/services/post.service.ts

# 7. Create routes
# apps/api/src/routes/posts.ts

# 8. Write tests for each layer
# *.test.ts files

# 9. Update abilities if needed
# packages/authorization/src/abilities.ts

# 10. Regenerate client
pnpm generate:client
```

### Pattern: Adding Authentication Check

```typescript
// Middleware
app.use('/api/*', async (c, next) => {
  const session = await getSession(c);

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  await next();
});

// Protected route
app.get('/api/me', async (c) => {
  const user = c.get('user'); // Guaranteed to exist
  return c.json(user);
});
```

### Pattern: Handling Errors

```typescript
// Define error types
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Throw in service/repository
if (!user) {
  throw new NotFoundError('User not found');
}

// Handle in error middleware
app.onError((err, c) => {
  if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  }

  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation failed', details: err.errors }, 400);
  }

  // Log unexpected errors
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});
```

---

## Git Commit Guidelines

### Conventional Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no logic change
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Build, deps, tooling
- `perf` - Performance improvement
- `ci` - CI/CD changes

### Scopes

- `api` - Backend API
- `web` - Next.js app
- `marketing` - Astro site
- `database` - Database package
- `validation` - Validation package
- `auth` - Auth package
- `authorization` - Authorization package
- Or feature-specific: `users`, `posts`, `billing`

### Examples

```bash
feat(api): add user registration endpoint
fix(web): correct login form validation
docs(architecture): document repository pattern
test(database): add user repository integration tests
chore(deps): update dependencies
refactor(api): simplify error handling
```

### Breaking Changes

```bash
feat(api)!: change user API response structure

BREAKING CHANGE: User API now returns createdAt as ISO string instead of timestamp
```

---

## Code Style Guidelines

### TypeScript

**Use strict mode:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

**Prefer explicit types for public APIs:**
```typescript
// Good
export function createUser(data: CreateUserInput): Promise<User> {
  // ...
}

// Avoid
export function createUser(data) {
  // ...
}
```

**Use Zod for runtime validation:**
```typescript
// Always validate external data
const input = CreateUserInput.parse(req.body);
```

### Naming Conventions

**Files:**
- `kebab-case.ts` for files
- `.test.ts` suffix for tests
- `.entity.ts` for entities
- `.repository.ts` for repositories
- `.service.ts` for services

**Variables/Functions:**
- `camelCase` for variables and functions
- `PascalCase` for classes and types
- `UPPER_SNAKE_CASE` for constants

**Interfaces/Types:**
```typescript
// Good
type User = { ... };
interface UserRepository { ... }

// Avoid "I" prefix
interface IUserRepository { ... } // Don't do this
```

### Imports

**Order:**
```typescript
// 1. External dependencies
import { z } from 'zod';
import { Hono } from 'hono';

// 2. Internal packages
import { CreateUserInput } from '@kit/validation';
import { defineAbilitiesFor } from '@kit/authorization';

// 3. Relative imports (same app)
import { UserRepository } from '../repositories/user.repository';
import type { User } from '../entities/user.entity';
```

**Use type imports when possible:**
```typescript
import type { User } from '../entities/user.entity';
```

---

## Debugging & Troubleshooting

### Common Issues

**Issue: Workspace package not found**
```bash
# Solution: Rebuild packages
pnpm build

# Or build specific package
pnpm --filter @kit/validation build
```

**Issue: Types not updating after OpenAPI change**
```bash
# Solution: Regenerate client
pnpm generate:client
```

**Issue: Migration fails**
```bash
# Check current migration status
pnpm db:studio

# Rollback if needed (manual)
psql $DATABASE_URL -c "DELETE FROM __drizzle_migrations WHERE id = ...;"

# Fix migration, try again
pnpm db:migrate
```

**Issue: Tests fail with DB errors**
```bash
# Ensure Testcontainers is working
docker ps

# Check Docker is running
docker info

# Verify migrations run in test
# Should be in beforeEach of integration tests
```

### Logging

**Development:**
```typescript
// Use console.log/error for now
console.log('User created:', user);
console.error('Failed to create user:', error);
```

**Production (future):**
```typescript
// TODO: Replace with structured logging
import { logger } from '@kit/logger';
logger.info('User created', { userId: user.id });
logger.error('Failed to create user', { error });
```

---

## Documentation Maintenance

### When to Update Docs

**REQUIREMENTS.md:**
- Adding/removing features
- Changing tech stack
- Updating roadmap

**ARCHITECTURE.md:**
- Changing architectural patterns
- Adding new layers/packages
- Modifying data flow

**ADRs (docs/decisions/):**
- Making significant technical decisions
- Choosing between alternatives
- Documenting "why" behind choices

**README.md:**
- Changing setup process
- Adding/removing scripts
- Updating quick start

### Creating ADRs

**When to create:**
- Choosing technologies (Hono vs Express)
- Architectural patterns (Repository pattern)
- Major refactors (changing auth system)

**Template:**
```markdown
# ADR XXX: Title

**Status:** Accepted | Rejected | Deprecated
**Date:** YYYY-MM-DD

## Context
What problem are we solving?

## Decision
What did we decide?

## Rationale
Why this over alternatives?

## Consequences
Positive, negative, neutral outcomes

## Alternatives Considered
What else did we consider and why not?
```

---

## Package Version Management

### Workspace Protocol

**Always use workspace:* for internal packages:**
```json
{
  "dependencies": {
    "@kit/validation": "workspace:*",
    "@kit/database": "workspace:*"
  }
}
```

**Never version packages independently** - all packages share kit version

### External Dependencies

**Check before adding:**
1. Is it necessary?
2. Is it maintained?
3. Is it well-documented?
4. Does it align with our stack?

**Add dependency:**
```bash
# Add to specific package
pnpm --filter @kit/validation add zod

# Add to workspace root
pnpm add -Dw turbo

# Add to app
pnpm --filter @kit/api add hono
```

---

## Session Startup Checklist

When starting a new Claude session, ensure you:

1. **Read context:**
   - This file (CLAUDE.md) ✓
   - REQUIREMENTS.md
   - ARCHITECTURE.md (if exists)
   - Recent git commits

2. **Check project state:**
   - What's implemented?
   - What tests exist?
   - Current git status?

3. **Understand the goal:**
   - What feature/fix are we building?
   - What's the acceptance criteria?
   - Are there tests to guide implementation?

4. **Create todo list:**
   - Break down work into small, trackable tasks
   - Define both content and activeForm for each
   - Mark first task as in_progress when starting

5. **Plan approach:**
   - Small, granular commits
   - Tests first (TDD)
   - Update docs in same commit
   - Keep todos updated throughout

6. **Ask questions:**
   - Unclear requirements?
   - Ambiguous patterns?
   - Need user input?

---

## Quick Reference

### Useful Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build all packages/apps
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm typecheck              # Type check all packages

# Database
pnpm db:generate            # Generate migration
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Drizzle Studio
pnpm db:push                # Push schema (dev only)

# API Client
pnpm generate:client        # Generate from OpenAPI spec

# Specific package/app
pnpm --filter @kit/api dev
pnpm --filter @kit/web build
```

### Key Files to Reference

- `REQUIREMENTS.md` - What we're building
- `ARCHITECTURE.md` - How it's structured
- `docs/decisions/*.md` - Why we made choices
- `turbo.json` - Build configuration
- `pnpm-workspace.yaml` - Workspace packages

---

## Remember: The Golden Rules

1. **Track everything** - Use TodoWrite for all non-trivial work
2. **Small commits** - One logical change per commit
3. **Tests first** - TDD approach
4. **Validate everything** - Never trust external data
5. **Document as you go** - Docs in same commit as code
6. **Ask when unclear** - Better to ask than assume
7. **Update todos in real-time** - Keep user informed
8. **Complete immediately** - Don't batch task completions

**End of Claude Guide**
