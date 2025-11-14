# API Schemas

This directory contains **core domain models** and **shared validation schemas** used across the application.

## Organization Strategy

### Core Domain Models (`/schemas`)

Core business entities that represent the fundamental data structures of your application.

**Examples:**
- `user.ts` - User domain model
- `todo.ts` - Todo domain model (if this were a todo app)
- `team.ts` - Team domain model

**Characteristics:**
- Central to the business domain
- Used across multiple routes/services
- Represent core data structures
- Independent of HTTP layer

**What goes here:**
```typescript
// ✅ Core domain model - belongs in /schemas
export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    // ... core user fields
});
```

### Route-Specific DTOs (`/routes/*.schemas.ts`)

Request/response schemas specific to individual routes or API endpoints.

**Examples:**
- `routes/users.schemas.ts` - DTOs for user routes (`GetMeResponseSchema`, `GetUsersResponseSchema`)
- `routes/health.schemas.ts` - Health check response schema

**Characteristics:**
- Specific to one route or endpoint
- Often compose core domain models
- HTTP layer concerns (requests/responses)
- Co-located with the routes that use them

**What goes here:**
```typescript
// ✅ Route-specific DTO - belongs in /routes/*.schemas.ts
import { UserSchema } from '../schemas';

export const GetMeResponseSchema = z.object({
    user: UserSchema,
});

export const UpdateUserRequestSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
});
```

### Shared Infrastructure (`/schemas`)

Error schemas, pagination schemas, and other cross-cutting concerns.

**Examples:**
- `error.ts` - Error response schemas

**Characteristics:**
- Used across many routes
- Infrastructure/framework level
- Not business domain specific

## Decision Tree

**When adding a new schema, ask:**

1. **Is this a core business entity?**
   - YES → `/schemas/[entity].ts`
   - NO → Continue to step 2

2. **Is this used by multiple routes/services?**
   - YES → `/schemas/[name].ts`
   - NO → `/routes/[route].schemas.ts`

3. **Is this specific to HTTP requests/responses?**
   - YES → `/routes/[route].schemas.ts`
   - NO → `/schemas/[name].ts`

## Examples

### Core Domain Model

```typescript
// schemas/user.ts
export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['user', 'admin']),
});

export type User = z.infer<typeof UserSchema>;
```

### Route-Specific DTOs

```typescript
// routes/users.schemas.ts
import { UserSchema } from '../schemas';

export const GetMeResponseSchema = z.object({
    user: UserSchema,
});

export const GetUsersResponseSchema = z.object({
    users: z.array(UserSchema),
});

export const CreateUserRequestSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
});
```

### Usage in Routes

```typescript
// routes/users.routes.ts
import { UserSchema } from '../schemas';
import { GetMeResponseSchema, GetUsersResponseSchema } from './users.schemas';

// Route implementation...
```

## Benefits

- **Clear Separation**: Core models vs HTTP DTOs
- **Co-location**: Route-specific schemas live with their routes
- **Discoverability**: Easy to find related schemas
- **Maintainability**: Changes to route schemas don't clutter core schemas
- **Reusability**: Core models can be composed into multiple DTOs
