# SaaS Starter Kit - Architecture Documentation

**Version:** 1.0.0
**Last Updated:** 2025-10-15

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack Details](#technology-stack-details)
4. [Package Architecture](#package-architecture)
5. [Data Layer Architecture](#data-layer-architecture)
6. [API Layer Architecture](#api-layer-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [Dependency Injection](#dependency-injection)
10. [Type Safety Strategy](#type-safety-strategy)
11. [Testing Architecture](#testing-architecture)
12. [Build & Development Workflow](#build--development-workflow)
13. [Deployment Architecture](#deployment-architecture)
14. [Security Considerations](#security-considerations)
15. [Performance Considerations](#performance-considerations)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
├─────────────────────┬───────────────────┬──────────────────┤
│   Next.js Web App   │  Astro Marketing  │  Future Mobile   │
│   (Dashboard/Auth)  │   (Landing/Docs)  │                  │
└──────────┬──────────┴───────────────────┴──────────────────┘
           │
           │ HTTP/REST (OpenAPI)
           │ Type-safe client
           ↓
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Hono HTTP Framework                                         │
│  ├─ Routes (OpenAPI)                                         │
│  ├─ Middleware (Auth, CORS, Rate Limit, CSRF)               │
│  ├─ Services (Business Logic)                                │
│  └─ Repositories (Data Access)                               │
└──────────┬──────────────────────────────────────────────────┘
           │
           │ SQL Queries
           │ (Drizzle/Kysely/Raw SQL)
           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL                                                  │
│  ├─ Users, Sessions, Accounts                                │
│  ├─ Organizations (multi-tenant)                             │
│  ├─ Subscriptions, Payments                                  │
│  └─ Application Data                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  Better Auth  │  Polar.sh  │  Email (Resend)  │  Storage    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

**API Request:**
```
1. Client makes request → openapi-fetch (type-safe)
2. Hono receives request → validates with Zod
3. Middleware chain → Auth → CSRF → Rate Limit
4. Route handler → calls Service
5. Service → calls Repository
6. Repository → queries DB → validates result against Entity
7. Service → returns to Route
8. Route → responds with OpenAPI-typed data
9. Client receives response → fully typed
```

**Next.js Server Component:**
```
1. Server Component renders
2. (Optional) Direct DB query for performance-critical data
3. OR API call through type-safe client
4. Render with data
```

---

## Architecture Principles

### 1. Separation of Concerns

**Layered Architecture:**
```
Routes (HTTP)
    ↓ (calls)
Services (Business Logic)
    ↓ (calls)
Repositories (Data Access)
    ↓ (queries)
Database
```

**Each layer:**
- Has single responsibility
- Depends only on layer below
- Can be tested independently

### 2. Dependency Inversion

**High-level modules don't depend on low-level modules:**
```typescript
// Good: Service depends on interface
class UserService {
  constructor(private userRepo: UserRepository) {}
}

// Repository is injected
const userRepo = new DrizzleUserRepository(db);
const userService = new UserService(userRepo);

// Easy to swap implementations
const testUserRepo = new InMemoryUserRepository();
const testUserService = new UserService(testUserRepo);
```

### 3. Fail-Fast Validation

**Validate at boundaries:**
- Input validation at API routes (Zod)
- Entity validation at repository layer (Zod)
- Form validation on frontend (Zod)

**Runtime safety:**
```typescript
// Never trust DB results
const result = await db.query.users.findFirst(...);
return UserEntity.parse(result); // Runtime validation
```

### 4. Type Safety End-to-End

**Single source of truth:**
```
Zod Schema (@kit/validation)
    ↓
API Validation + OpenAPI Generation
    ↓
TypeScript Types Generated (openapi-typescript)
    ↓
Frontend Type-safe Client (openapi-fetch)
```

### 5. Test-Driven Development

**Write tests first:**
1. Define expected behavior
2. Write failing test
3. Implement minimum to pass
4. Refactor
5. Commit

---

## Technology Stack Details

### Hono HTTP Framework

**Why Hono:**
- Ultralight (< 10KB)
- Blazing fast
- Works everywhere (Node, Bun, Cloudflare Workers, Deno)
- Excellent TypeScript support
- Built-in middleware
- Easy to learn

**Key Features Used:**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Middleware
app.use('*', cors());
app.use('*', csrf());

// Context variables
app.use('*', async (c, next) => {
  c.set('user', await getUser(c));
  await next();
});

// Type-safe context
app.get('/me', (c) => {
  const user = c.get('user'); // Fully typed!
  return c.json(user);
});
```

### @hono/zod-openapi

**Integration:**
```typescript
import { createRoute, z } from '@hono/zod-openapi';

// Define route with Zod schemas
const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema.openapi('User'),
        },
      },
      description: 'Get user by ID',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema.openapi('Error'),
        },
      },
      description: 'User not found',
    },
  },
});

// Implement route
app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param'); // Validated and typed!
  const user = await userRepo.findById(id);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user, 200);
});

// OpenAPI spec auto-generated
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'SaaS API',
  },
});
```

### Drizzle ORM

**Purpose:** Schema definition and migrations ONLY
- NOT used for all queries (developer's choice)
- Provides type-safe schema
- Generates SQL migrations
- Can be used for queries, but not required

**Schema Definition:**
```typescript
// packages/database/src/schema/users.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Migration Workflow:**
```bash
# 1. Update schema
# Edit packages/database/src/schema/*.ts

# 2. Generate migration
pnpm db:generate

# 3. Review generated SQL in migrations/

# 4. Apply migration
pnpm db:migrate

# 5. Commit schema + migration together
git add packages/database/src/schema packages/database/migrations
git commit -m "feat(database): add email_verified to users"
```

### Better Auth

**Configuration:**
```typescript
// packages/auth/src/config.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export function createAuthConfig(db: Database) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}
```

**Client Usage:**
```typescript
// apps/web/lib/auth.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// In components
const { user, signOut } = authClient.useSession();
```

### CASL Authorization

**Ability Definition:**
```typescript
// packages/authorization/src/abilities.ts
import { defineAbility, MongoAbility } from '@casl/ability';
import type { User } from '@kit/validation';

export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';

export type Subjects =
  | 'User'
  | 'Post'
  | 'Subscription'
  | 'Organization'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilitiesFor(user: User): AppAbility {
  return defineAbility<AppAbility>((can, cannot) => {
    // Everyone can read their own user
    can('read', 'User', { id: user.id });
    can('update', 'User', { id: user.id });

    if (user.role === 'admin') {
      // Admins can do everything
      can('manage', 'all');
    } else if (user.role === 'premium' || user.role === 'pro') {
      // Premium users
      can('create', 'Post');
      can(['read', 'update', 'delete'], 'Post', { authorId: user.id });
      can('read', 'Post', { published: true });
    } else {
      // Free users
      can('read', 'Post', { published: true });
      // Limit creation
      can('create', 'Post'); // Check quota in service layer
    }
  });
}
```

**Backend Enforcement:**
```typescript
// apps/api/src/middleware/authorize.ts
import { defineAbilitiesFor } from '@kit/authorization';

export function requireAbility(action: Actions, subject: Subjects) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ability = defineAbilitiesFor(user);

    if (!ability.can(action, subject)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    c.set('ability', ability);
    await next();
  };
}

// Usage in routes
app.delete(
  '/posts/:id',
  requireAbility('delete', 'Post'),
  async (c) => {
    const { id } = c.req.param();
    const user = c.get('user');
    const ability = c.get('ability');

    const post = await postRepo.findById(id);

    if (!post) {
      return c.json({ error: 'Not found' }, 404);
    }

    // Check specific instance
    if (!ability.can('delete', subject('Post', post))) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await postRepo.delete(id);
    return c.json({ success: true });
  }
);
```

**Frontend Optimistic Checks:**
```typescript
// apps/web/components/PostActions.tsx
import { defineAbilitiesFor } from '@kit/authorization';
import { useAuth } from '@/lib/auth';

export function PostActions({ post }) {
  const { user } = useAuth();
  const ability = defineAbilitiesFor(user);

  return (
    <div>
      {ability.can('update', subject('Post', post)) && (
        <button onClick={handleEdit}>Edit</button>
      )}
      {ability.can('delete', subject('Post', post)) && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
}
```

---

## Package Architecture

### Package Dependency Graph

```
@kit/config
    (no dependencies)

@kit/validation
    (no dependencies)

@kit/database
    ├─ depends on: (none internally)
    └─ used by: api, web

@kit/auth
    ├─ depends on: @kit/validation
    └─ used by: api, web, marketing

@kit/authorization
    ├─ depends on: @kit/validation
    └─ used by: api, web

@kit/api-client
    ├─ depends on: (generated from OpenAPI)
    └─ used by: web, marketing

apps/api
    ├─ depends on: @kit/validation, @kit/database, @kit/auth, @kit/authorization
    └─ generates: OpenAPI spec

apps/web
    ├─ depends on: @kit/validation, @kit/database, @kit/auth, @kit/authorization, @kit/api-client
    └─ uses: Generated types from api-client

apps/marketing
    ├─ depends on: @kit/api-client
    └─ (minimal dependencies)
```

### Package Details

#### @kit/validation

**Purpose:** Shared validation schemas and constants

**Exports:**
```typescript
// Validation schemas (used by API and frontend)
export const CreateUserInput: z.ZodSchema;
export const UpdateUserInput: z.ZodSchema;
export const LoginInput: z.ZodSchema;

// Shared constants
export const UserRole: Record<string, string>;
export const SubscriptionTier: Record<string, string>;

// Types (inferred from schemas)
export type CreateUserInput = z.infer<typeof CreateUserInput>;
```

**Dependencies:** None (base package)

**Used by:** api (validation + OpenAPI), web (form validation), marketing (forms)

#### @kit/database

**Purpose:** Database client, schema, migrations

**Exports:**
```typescript
// Database client factory
export function createDatabase(config: DatabaseConfig): Database;

// Schema (for migrations and optional queries)
export { users, sessions, accounts } from './schema';

// Migration utilities
export { migrate } from 'drizzle-orm/node-postgres/migrator';
```

**Dependencies:** drizzle-orm, postgres

**Used by:** api (all data access), web (Better Auth only)

#### @kit/auth

**Purpose:** Better Auth configuration

**Exports:**
```typescript
// Server config
export function createAuthConfig(db: Database): BetterAuthConfig;

// Client utilities
export { authClient } from './client';

// Password validation
export const passwordSchema: z.ZodSchema;
export function validatePasswordStrength(password: string): boolean;
```

**Dependencies:** better-auth, @kit/validation

**Used by:** api (server), web (client), marketing (optional)

#### @kit/authorization

**Purpose:** CASL ability definitions

**Exports:**
```typescript
// Ability builder
export function defineAbilitiesFor(user: User, context?: AuthContext): AppAbility;

// Types
export type Actions = ...;
export type Subjects = ...;
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// Role definitions
export const Roles = { ... };
```

**Dependencies:** @casl/ability, @kit/validation

**Used by:** api (enforcement), web (optimistic checks)

#### @kit/api-client

**Purpose:** Type-safe API client

**Structure:**
```typescript
// packages/api-client/src/index.ts
import createClient from 'openapi-fetch';
import type { paths } from './generated/openapi';

export function createApiClient(baseUrl: string, options?: ClientOptions) {
  return createClient<paths>({
    baseUrl,
    ...options,
  });
}

export type * from './generated/openapi';
```

**Generated types:**
```typescript
// Auto-generated from OpenAPI spec
export interface paths {
  '/users/{id}': {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { 'application/json': User } };
        404: { content: { 'application/json': Error } };
      };
    };
  };
}
```

**Dependencies:** openapi-fetch

**Used by:** web, marketing, future mobile

---

## Data Layer Architecture

### Entity Pattern

**Entities are the source of truth for domain models:**

```typescript
// apps/api/src/entities/user.entity.ts
import { z } from 'zod';

export const UserEntity = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserEntity>;
```

**Why entities are separate:**
- Type safety at runtime
- Validation of DB results
- Not dependent on ORM types
- Easy to test
- Can swap query implementation

### Repository Pattern

**Interface (implicit via TypeScript):**
```typescript
// apps/api/src/repositories/user.repository.ts
import type { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}
```

**Production Implementation (Drizzle):**
```typescript
export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!result) return null;

    // MUST validate against entity
    return UserEntity.parse(result);
  }

  async create(data: CreateUserData): Promise<User> {
    const [result] = await this.db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        role: 'user',
      })
      .returning();

    return UserEntity.parse(result);
  }
}
```

**Test Implementation (In-Memory):**
```typescript
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      emailVerified: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }
}
```

**Benefits:**
- Easy to swap implementations
- Simple to mock in tests
- DB-agnostic business logic
- Runtime type safety

### Database Schema Management

**Single source of truth: Drizzle schema**

```typescript
// packages/database/src/schema/users.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Migration workflow:**
```bash
# 1. Modify schema files
# 2. Generate migration
pnpm db:generate

# Creates: packages/database/migrations/0001_add_email_verified.sql

# 3. Review migration
# 4. Apply to local DB
pnpm db:migrate

# 5. Commit both schema and migration
```

**Running migrations:**
```typescript
// packages/database/src/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: './migrations' });
```

---

## API Layer Architecture

### Route Organization

**Group by domain:**
```
apps/api/src/routes/
├── users.ts          # User CRUD
├── auth.ts           # Authentication
├── posts.ts          # Posts
├── subscriptions.ts  # Billing
└── organizations.ts  # Multi-tenancy
```

**Route structure:**
```typescript
// apps/api/src/routes/users.ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { CreateUserInput, UpdateUserInput } from '@kit/validation';
import type { UserRepository } from '../repositories/user.repository';

export function userRoutes(deps: { userRepository: UserRepository }) {
  const app = new OpenAPIHono();

  // Define route
  const createUserRoute = createRoute({
    method: 'post',
    path: '/',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateUserInput,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: UserSchema,
          },
        },
        description: 'User created',
      },
    },
  });

  // Implement route
  app.openapi(createUserRoute, async (c) => {
    const input = c.req.valid('json');
    const user = await deps.userRepository.create(input);
    return c.json(user, 201);
  });

  return app;
}
```

### Middleware Stack

**Order matters:**
```typescript
// apps/api/src/app.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';

const app = new OpenAPIHono();

// 1. Logger (first to log everything)
app.use('*', logger());

// 2. CORS (before auth)
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [],
  credentials: true,
}));

// 3. CSRF (for mutations)
app.use('*', csrf());

// 4. Authentication (sets user in context)
app.use('*', authMiddleware());

// 5. Rate limiting
app.use('*', rateLimitMiddleware());

// 6. Routes
app.route('/api/users', userRoutes({ userRepository }));
```

### Service Layer

**Business logic belongs in services:**

```typescript
// apps/api/src/services/post.service.ts
import type { PostRepository } from '../repositories/post.repository';
import type { UserQuotaRepository } from '../repositories/quota.repository';

export class PostService {
  constructor(
    private postRepo: PostRepository,
    private quotaRepo: UserQuotaRepository
  ) {}

  async createPost(userId: string, data: CreatePostInput): Promise<Post> {
    // Business logic: Check quota
    const quota = await this.quotaRepo.getQuota(userId);

    if (quota.postsCreated >= quota.postsLimit) {
      throw new QuotaExceededError('Post limit reached for your plan');
    }

    // Create post
    const post = await this.postRepo.create({
      ...data,
      authorId: userId,
    });

    // Update quota
    await this.quotaRepo.incrementPostCount(userId);

    return post;
  }
}
```

**Routes use services:**
```typescript
app.openapi(createPostRoute, async (c) => {
  const user = c.get('user');
  const input = c.req.valid('json');

  const post = await postService.createPost(user.id, input);

  return c.json(post, 201);
});
```

---

## Frontend Architecture

### Next.js App Router Structure

```
apps/web/app/
├── (auth)/                    # Auth route group
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx             # Auth layout (centered, no nav)
│
├── (dashboard)/               # Protected route group
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── billing/
│   │   └── page.tsx
│   └── layout.tsx             # Dashboard layout (sidebar, nav)
│
├── (marketing)/               # Public route group
│   ├── page.tsx               # Landing page
│   ├── about/
│   │   └── page.tsx
│   └── layout.tsx             # Marketing layout (header, footer)
│
├── api/                       # API routes (minimal)
│   └── auth/                  # Better Auth endpoints
│       └── [...all]/
│           └── route.ts
│
├── layout.tsx                 # Root layout
└── not-found.tsx
```

### API Client Usage

```typescript
// apps/web/lib/api.ts
import { createApiClient } from '@kit/api-client';

export const api = createApiClient(process.env.NEXT_PUBLIC_API_URL!);
```

```typescript
// apps/web/app/(dashboard)/dashboard/page.tsx
import { api } from '@/lib/api';

export default async function DashboardPage() {
  // Server Component - direct API call
  const { data: user } = await api.GET('/api/users/me');

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
    </div>
  );
}
```

```typescript
// apps/web/components/EditProfile.tsx
'use client';

import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateUserInput } from '@kit/validation';

export function EditProfile({ user }) {
  const form = useForm({
    resolver: zodResolver(UpdateUserInput),
    defaultValues: user,
  });

  const onSubmit = async (data) => {
    // Type-safe API call
    const { data: updated, error } = await api.PATCH('/api/users/{id}', {
      params: { path: { id: user.id } },
      body: data,
    });

    if (error) {
      // Error is typed
      console.error(error);
    } else {
      // Success
      toast.success('Profile updated');
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

## Type Safety Strategy

### Type Flow Diagram

```
1. Define Validation Schema
   ↓
   @kit/validation/src/user.ts
   export const CreateUserInput = z.object({...})

2. Use in API for Validation + OpenAPI
   ↓
   apps/api/src/routes/users.ts
   createRoute({ request: { body: { schema: CreateUserInput } } })

3. OpenAPI Spec Generated
   ↓
   GET /openapi.json
   { paths: { "/users": { post: { requestBody: {...} } } } }

4. Generate TypeScript Types
   ↓
   pnpm generate:client
   packages/api-client/src/generated/openapi.ts

5. Use in Frontend
   ↓
   apps/web/components/Form.tsx
   const { data } = await api.POST('/users', { body: {...} })
   // data is fully typed!
```

### Runtime vs Compile-time Safety

**Compile-time (TypeScript):**
- Frontend knows API response shape
- Autocomplete for API endpoints
- Catch errors before runtime

**Runtime (Zod validation):**
- API validates incoming requests
- Repositories validate DB results
- Frontend validates form input

**Both layers ensure safety!**

---

## Testing Architecture

### Test Pyramid

```
        ╱ ╲
       ╱ E2E ╲        Few, slow, expensive
      ╱───────╲       (Critical flows only)
     ╱         ╲
    ╱Integration╲     More, medium speed
   ╱─────────────╲    (API endpoints, repos)
  ╱               ╲
 ╱  Unit Tests     ╲  Many, fast, cheap
╱───────────────────╲ (Business logic, utils)
```

### Unit Tests

**What to test:**
- Pure functions
- Services (with mocked repos)
- Utilities
- Components (isolated)

**Example:**
```typescript
// apps/api/src/services/post.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PostService } from './post.service';
import { InMemoryPostRepository } from '../repositories/post.repository';
import { InMemoryUserQuotaRepository } from '../repositories/quota.repository';

describe('PostService', () => {
  let postService: PostService;
  let postRepo: InMemoryPostRepository;
  let quotaRepo: InMemoryUserQuotaRepository;

  beforeEach(() => {
    postRepo = new InMemoryPostRepository();
    quotaRepo = new InMemoryUserQuotaRepository();
    postService = new PostService(postRepo, quotaRepo);
  });

  it('should create post when under quota', async () => {
    await quotaRepo.setQuota('user-1', { limit: 10, used: 5 });

    const post = await postService.createPost('user-1', {
      title: 'Test',
      content: 'Content',
    });

    expect(post.title).toBe('Test');
    expect(await quotaRepo.getUsed('user-1')).toBe(6);
  });

  it('should throw when quota exceeded', async () => {
    await quotaRepo.setQuota('user-1', { limit: 10, used: 10 });

    await expect(
      postService.createPost('user-1', { title: 'Test', content: 'Content' })
    ).rejects.toThrow('Post limit reached');
  });
});
```

### Integration Tests

**What to test:**
- Repository implementations
- API endpoints
- Database interactions

**Example:**
```typescript
// apps/api/src/repositories/user.repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { DrizzleUserRepository } from './user.repository';

describe('DrizzleUserRepository (Integration)', () => {
  let container: StartedTestContainer;
  let pool: Pool;
  let db: Database;
  let userRepo: DrizzleUserRepository;

  beforeEach(async () => {
    // Start Postgres container
    container = await new GenericContainer('postgres:16')
      .withEnvironment({ POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
      .withExposedPorts(5432)
      .start();

    const connectionString = `postgresql://postgres:test@${container.getHost()}:${container.getMappedPort(5432)}/test`;

    pool = new Pool({ connectionString });
    db = drizzle(pool);

    // Run migrations
    await migrate(db, { migrationsFolder: './migrations' });

    userRepo = new DrizzleUserRepository(db);
  });

  afterEach(async () => {
    await pool.end();
    await container.stop();
  });

  it('should create and find user', async () => {
    const created = await userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(created.id).toBeDefined();

    const found = await userRepo.findById(created.id);

    expect(found).toEqual(created);
  });

  it('should return null for non-existent user', async () => {
    const found = await userRepo.findById('non-existent-id');
    expect(found).toBeNull();
  });
});
```

### E2E Tests

**What to test:**
- Critical user journeys
- Multi-step flows
- Full stack integration

**Example:**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up, verify email, and log in', async ({ page }) => {
    // Sign up
    await page.goto('/signup');
    await page.fill('[name=email]', 'newuser@example.com');
    await page.fill('[name=password]', 'SecurePassword123');
    await page.fill('[name=name]', 'New User');
    await page.click('button[type=submit]');

    // Should show email verification message
    await expect(page.locator('text=Check your email')).toBeVisible();

    // TODO: Verify email (need email testing strategy)

    // Log in
    await page.goto('/login');
    await page.fill('[name=email]', 'newuser@example.com');
    await page.fill('[name=password]', 'SecurePassword123');
    await page.click('button[type=submit]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

---

## Build & Development Workflow

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".astro/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": false
    },
    "test:unit": {
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Run specific app
pnpm --filter @kit/web dev
pnpm --filter @kit/api dev

# Build everything
pnpm build

# Run tests
pnpm test              # All tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e          # E2E tests

# Linting
pnpm lint              # All packages
pnpm lint:fix          # Auto-fix

# Type checking
pnpm typecheck

# Database
pnpm db:generate       # Generate migration
pnpm db:migrate        # Run migrations
pnpm db:studio         # Open Drizzle Studio
pnpm db:push           # Push schema (dev only)

# API client
pnpm generate:client   # Generate TypeScript types from OpenAPI
```

---

## Deployment Architecture

### Single Server (Phase 1)

```
┌─────────────────────────────────────┐
│         VPS (Single Server)         │
├─────────────────────────────────────┤
│  Nginx (Reverse Proxy)              │
│    ├─ api.yourapp.com → API:3000   │
│    ├─ app.yourapp.com → Web:3001   │
│    └─ yourapp.com → Marketing:3002 │
├─────────────────────────────────────┤
│  API (Hono)          :3000          │
│  Web (Next.js)       :3001          │
│  Marketing (Astro)   :3002          │
├─────────────────────────────────────┤
│  PostgreSQL          :5432          │
│  Redis (cache)       :6379          │
└─────────────────────────────────────┘
```

### Horizontal Scaling (Phase 2)

```
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│API 1│  │API 2│  │Web 1│  │Web 2│
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │        │        │
   └────────┴────────┴────────┘
              │
        ┌─────▼──────┐
        │ PostgreSQL │
        │  (Primary) │
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │ PostgreSQL │
        │  (Replica) │
        └────────────┘
```

---

## Security Considerations

### Input Validation
- All API inputs validated with Zod
- SQL injection prevented by parameterized queries
- XSS prevented by React auto-escaping

### Authentication
- Secure session management (Better Auth)
- Password hashing (bcrypt)
- Email verification required
- Rate limiting on auth endpoints

### Authorization
- All mutations require authentication
- CASL abilities enforced on backend
- Row-level security for multi-tenant data

### CSRF Protection
- CSRF tokens for mutations
- SameSite cookies

### Rate Limiting
- Per-IP rate limiting
- Per-user rate limiting
- Quota enforcement

---

## Performance Considerations

### Database
- Proper indexing on foreign keys
- Connection pooling
- Query optimization

### Caching
- Turborepo build cache
- Redis for session cache
- HTTP caching headers

### Frontend
- Server Components for initial load
- Code splitting
- Image optimization (next/image)
- Static generation where possible (Astro)

---

**End of Architecture Documentation**

For implementation details, see:
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
- [TESTING.md](./TESTING.md) - Testing guide
- [ADRs](./decisions/) - Architecture decisions
