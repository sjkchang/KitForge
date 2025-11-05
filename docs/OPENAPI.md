# OpenAPI Specification & API Client Generation

This guide explains how the OpenAPI specification is generated and how to use the type-safe API client.

## Overview

The project uses **@hono/zod-openapi** to automatically generate OpenAPI specifications from Zod schemas and route definitions. This provides:

- **Automatic OpenAPI spec generation** from your API code
- **Type-safe API client** with full TypeScript autocomplete
- **Interactive API documentation** using Scalar (modern, beautiful UI)
- **Single source of truth** for API contracts

## Architecture

```
┌─────────────────────┐
│  @kit/validation    │  ← Define Zod schemas
│  (Shared schemas)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  @kit/api           │  ← Create routes with .openapi()
│  (Hono + OpenAPI)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  /openapi.json      │  ← Auto-generated spec
│  /docs              │  ← Interactive UI (Scalar)
└──────────┬──────────┘
           │
           ↓ (pnpm generate:client)
           │
┌─────────────────────┐
│  @kit/api-client    │  ← Generated TypeScript types
│  (Type-safe client) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  @kit/web           │  ← Use in frontend
│  (Next.js)          │
└─────────────────────┘
```

## Defining API Routes

### 1. Create Zod Schemas in @kit/validation

```typescript
// packages/@kit/validation/src/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserInput = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
```

### 2. Create OpenAPI Route in @kit/api

```typescript
// apps/api/src/app.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { UserSchema, CreateUserInput } from '@kit/validation';

const app = new OpenAPIHono();

// Define the route with OpenAPI spec
const createUserRoute = createRoute({
  method: 'post',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Create a new user',
  description: 'Create a new user account',
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
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Implement the handler
app.openapi(createUserRoute, async (c) => {
  const input = c.req.valid('json'); // Automatically validated!

  // Your business logic here
  const user = await createUser(input);

  return c.json(user, 201);
});
```

### 3. Register OpenAPI Documentation

```typescript
// apps/api/src/app.ts
import { apiReference } from '@scalar/hono-api-reference';

// Register the OpenAPI spec endpoint
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'SaaS Starter Kit API',
    version: '1.0.0',
    description: 'Type-safe API for the SaaS starter kit',
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3001',
      description: 'Development server',
    },
  ],
});

// Add Scalar API documentation UI
app.get('/docs', apiReference({
  spec: { url: '/api/openapi-combined' },
  theme: 'purple',
  layout: 'modern',
}));
```

## Generating the API Client

### Automatic Generation

Run the client generation script:

```bash
pnpm generate:client
```

This script:
1. Starts the API server temporarily
2. Fetches the OpenAPI spec from `/openapi.json`
3. Generates TypeScript types using `openapi-typescript`
4. Saves types to `packages/@kit/api-client/src/generated/openapi.ts`
5. Shuts down the server

### What Gets Generated

The generation creates:

- **openapi.json** - The raw OpenAPI specification
- **openapi.ts** - TypeScript type definitions with full path and schema types

## Using the API Client

### 1. Create the Client

```typescript
// apps/web/src/lib/api.ts
import { createApiClient } from '@kit/api-client';

// Without authentication
export const api = createApiClient();

// With JWT token
export const api = createApiClient({
  token: 'your-jwt-token',
});

// With custom base URL
export const api = createApiClient({
  baseUrl: 'https://api.example.com',
});
```

### 2. Make Type-Safe Requests

```typescript
// Full TypeScript autocomplete and type checking!
const { data, error } = await api.GET('/api/users/{id}', {
  params: {
    path: { id: '123' },
  },
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('User:', data.user); // TypeScript knows the shape!
}
```

### 3. POST Requests with Body

```typescript
const { data, error } = await api.POST('/api/users', {
  body: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secure123',
  },
});

if (error) {
  // Error is typed based on response schema
  console.error('Failed to create user:', error.error);
} else {
  // Data is typed based on success schema
  console.log('Created user:', data.id);
}
```

### 4. Using in React Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@kit/api-client';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = createApiClient();

    api.GET('/api/users/{id}', {
      params: { path: { id: userId } },
    }).then(({ data, error }) => {
      if (data) {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}
```

### 5. Using in Server Components

```typescript
// apps/web/src/app/users/[id]/page.tsx
import { createApiClient } from '@kit/api-client';

export default async function UserPage({
  params
}: {
  params: { id: string }
}) {
  const api = createApiClient();

  const { data, error } = await api.GET('/api/users/{id}', {
    params: { path: { id: params.id } },
  });

  if (error) {
    return <div>Error loading user</div>;
  }

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}
```

## Interactive API Documentation

### Accessing the Docs

Start the API server:

```bash
pnpm --filter @kit/api dev
```

Visit: **http://localhost:3001/docs**

### Features

Scalar provides:

- **Beautiful modern UI** - Clean, professional interface with dark mode
- **Interactive API explorer** - Test endpoints directly from the browser
- **Request/response examples** - See example requests and responses
- **Authentication support** - Add Bearer tokens to test protected endpoints
- **Schema visualization** - View request and response schemas
- **Try it out** - Execute API calls directly from the documentation
- **Code generation** - Generate client code in multiple languages

### Testing Authenticated Endpoints

1. Go to http://localhost:3001/docs
2. Click the "Authorize" button at the top
3. Enter your Bearer token (format: `Bearer <your-jwt-token>`)
4. Click "Authorize"
5. Click "Close"
6. Now you can test protected endpoints with authentication

## Workflow

### Adding a New Endpoint

1. **Define schemas** in `@kit/validation`:
   ```typescript
   export const CreatePostInput = z.object({
     title: z.string(),
     content: z.string(),
   });
   ```

2. **Create route** in `@kit/api`:
   ```typescript
   const route = createRoute({
     method: 'post',
     path: '/api/posts',
     request: { body: { ... } },
     responses: { 201: { ... } },
   });

   app.openapi(route, handler);
   ```

3. **Regenerate client**:
   ```bash
   pnpm generate:client
   ```

4. **Use in frontend**:
   ```typescript
   const { data } = await api.POST('/api/posts', { body: { ... } });
   ```

### Updating an Endpoint

1. **Modify schema or route** in the API
2. **Regenerate client**:
   ```bash
   pnpm generate:client
   ```
3. **TypeScript will show errors** if frontend code needs updates
4. **Fix type errors** in your frontend code

## Best Practices

### 1. Always Use Zod Schemas

**DO:**
```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
```

**DON'T:**
```typescript
interface User {
  id: string;
  name: string;
}
```

Why? Zod schemas provide both runtime validation and compile-time types.

### 2. Define Schemas in @kit/validation

Keep all schemas in the validation package so they can be shared between API and frontend.

### 3. Use Descriptive Tags and Summaries

```typescript
const route = createRoute({
  tags: ['Users'],           // Groups endpoints in docs
  summary: 'Create user',    // Short description
  description: 'Creates a new user account with email and password',
});
```

### 4. Document All Response Codes

```typescript
responses: {
  200: { description: 'Success', ... },
  400: { description: 'Invalid input', ... },
  401: { description: 'Unauthorized', ... },
  404: { description: 'Not found', ... },
  500: { description: 'Server error', ... },
}
```

### 5. Regenerate Client After API Changes

Make it part of your workflow:

```bash
# After changing API routes
git add apps/api/src/routes/
git commit -m "feat(api): add new endpoint"

# Regenerate client
pnpm generate:client

# Commit generated files
git add packages/@kit/api-client/src/generated/
git commit -m "chore(api-client): regenerate from OpenAPI spec"
```

### 6. Use Type Guards for Error Handling

```typescript
const { data, error } = await api.GET('/api/users');

if (error) {
  // Handle different error codes
  if (error.status === 404) {
    console.log('User not found');
  } else if (error.status === 401) {
    console.log('Not authenticated');
  }
  return;
}

// data is guaranteed to be defined here
console.log(data.users);
```

## Troubleshooting

### Client Generation Fails

**Problem:** `pnpm generate:client` fails to start the server

**Solution:**
- Check if the API builds: `pnpm --filter @kit/api build`
- Check if port 3001 is already in use: `lsof -i :3001`
- Check environment variables are set correctly

### Types Not Updating

**Problem:** Frontend still shows old types after API changes

**Solution:**
1. Regenerate client: `pnpm generate:client`
2. Restart your dev server
3. Clear Next.js cache: `rm -rf apps/web/.next`

### Authentication Issues in Docs

**Problem:** Protected endpoints return 401 in Scalar docs

**Solution:**
1. Log in to your app first
2. Get the JWT token from your browser (check cookies or localStorage)
3. Add it to Scalar using the "Add Authentication" button

## Advanced Usage

### Custom Client Configuration

```typescript
// Create a client factory with custom logic
export function createAuthenticatedClient() {
  const token = getTokenFromStorage(); // Your auth logic

  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    token,
    headers: {
      'X-Custom-Header': 'value',
    },
  });
}
```

### Request Interceptors

```typescript
// Wrap the client with custom logic
export async function apiWithRetry<T>(
  request: () => Promise<T>
): Promise<T> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await request();
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}

// Usage
const { data } = await apiWithRetry(() =>
  api.GET('/api/users')
);
```

## Better Auth Routes Integration

### Unified Documentation

**Good news!** Better Auth routes ARE included in the OpenAPI documentation using the Better Auth OpenAPI plugin. This means you get complete, unified API documentation for both your custom endpoints and all authentication endpoints in one place.

### How It Works

1. **Better Auth OpenAPI Plugin** - Generates OpenAPI spec for all auth routes
2. **Automatic Merging** - The `/api/openapi-combined` endpoint merges both specs
3. **Single Documentation** - Scalar UI shows everything together with proper categorization

### Better Auth Endpoints

All Better Auth endpoints are documented at `/docs`, including:

```
POST   /api/auth/sign-in/email          - Email/password sign in
POST   /api/auth/sign-up/email          - Email/password sign up
POST   /api/auth/sign-out               - Sign out
GET    /api/auth/session                - Get session
POST   /api/auth/verify-email           - Verify email
POST   /api/auth/send-verification      - Resend verification email
POST   /api/auth/forgot-password        - Request password reset
POST   /api/auth/reset-password         - Reset password with token
POST   /api/auth/change-email           - Change user email
POST   /api/auth/change-password        - Change user password
GET    /api/auth/account-info           - Get account information
... and more
```

### Using Better Auth

**Always use the Better Auth client for authentication:**

```typescript
import { authClient } from '@/lib/auth-client';

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Get session
const session = await authClient.getSession();

// Sign out
await authClient.signOut();
```

**Why not use the OpenAPI client for auth?**
- Better Auth client handles session management automatically
- Built-in CSRF protection
- Simplified API (no need to manually handle tokens)
- Better TypeScript types for auth-specific operations

### Hybrid Approach

The setup uses:
- **Better Auth Client** (`authClient`) for authentication operations
- **OpenAPI Client** (`api`) for your custom business logic endpoints
- **Unified Documentation** - Both documented together in Scalar

This gives you the best of both worlds: convenient auth client AND complete API documentation.

## References

- [Hono OpenAPI Documentation](https://hono.dev/guides/openapi)
- [Zod Documentation](https://zod.dev/)
- [openapi-typescript](https://openapi-ts.pages.dev/)
- [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/)
- [Scalar API Reference](https://github.com/scalar/scalar)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Better Auth OpenAPI Plugin](https://www.better-auth.com/docs/plugins/open-api)
