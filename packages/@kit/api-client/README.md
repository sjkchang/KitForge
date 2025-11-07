# @kit/api-client

Type-safe API client for the SaaS Starter Kit, automatically generated from OpenAPI specifications.

## Overview

This package provides a fully type-safe HTTP client that knows about all your API endpoints, request bodies, and response types. It's built on top of [`openapi-fetch`](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch) and uses TypeScript types generated from your OpenAPI schema.

**Key Benefits:**

- ✅ **100% Type-Safe** - TypeScript knows every endpoint, parameter, and response shape
- ✅ **Autocomplete** - Your IDE suggests available endpoints and fields
- ✅ **Always in Sync** - Regenerate types when your API changes
- ✅ **Lightweight** - No runtime overhead, just fetch with types
- ✅ **Error Handling** - Typed error responses based on OpenAPI spec

## Installation

This package is part of the monorepo and installed automatically:

```bash
pnpm install
```

## Quick Start

### Basic Usage (Unauthenticated)

For public endpoints like health checks:

```typescript
import { createApiClient } from '@kit/api-client';

const api = createApiClient();

const { data, error } = await api.GET('/health');

if (error) {
    console.error('API is down:', error);
} else {
    console.log('API status:', data.status); // TypeScript knows this is "ok"
    console.log('Timestamp:', data.timestamp); // TypeScript knows this is a string
}
```

### Authenticated Requests (Client Components)

For client components that need authentication:

```typescript
'use client';

import { createApiClient } from '@kit/api-client';
import { useSession } from '@/lib/auth-client';

export function MyComponent() {
    const { data: session } = useSession();

    const fetchData = async () => {
        if (!session) return;

        // Create authenticated client
        const api = createApiClient({
            token: session.session.token,
        });

        // Make authenticated request
        const { data, error } = await api.GET('/api/me');

        if (error) {
            console.error('Error:', error.error); // Typed error message
            return;
        }

        // TypeScript knows all these fields exist and their types
        console.log('User ID:', data.user.id); // string
        console.log('Email:', data.user.email); // string
        console.log('Verified:', data.user.emailVerified); // boolean
        console.log('Role:', data.user.role); // string
    };

    // ...
}
```

### Authenticated Requests (Server Components)

For Next.js Server Components and API routes:

```typescript
import { getApiClient } from '@/lib/api';

export default async function ServerComponent() {
  // Helper automatically includes session token
  const api = await getApiClient();

  const { data, error } = await api.GET('/api/me');

  if (error || !data) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {data.user.name}</h1>
      <p>Email: {data.user.email}</p>
    </div>
  );
}
```

## API Reference

### `createApiClient(options?)`

Creates a type-safe API client instance.

**Parameters:**

```typescript
interface ApiClientOptions {
    /**
     * Base URL for the API
     * @default process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
     */
    baseUrl?: string;

    /**
     * JWT token for authentication
     * If provided, will be included in Authorization header
     */
    token?: string;

    /**
     * Custom headers to include in all requests
     */
    headers?: HeadersInit;
}
```

**Returns:** Type-safe client with methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

**Examples:**

```typescript
// Default (public endpoints)
const api = createApiClient();

// With authentication
const api = createApiClient({
    token: 'your-jwt-token',
});

// Custom base URL
const api = createApiClient({
    baseUrl: 'https://api.production.com',
});

// Custom headers
const api = createApiClient({
    headers: {
        'X-Custom-Header': 'value',
    },
});
```

## Available Endpoints

The client knows about all endpoints defined in your OpenAPI spec. Here are the current endpoints:

### System

#### `GET /health`

Health check endpoint (no auth required).

```typescript
const { data, error } = await api.GET('/health');

// Response type:
// data: { status: "ok"; timestamp: string } | undefined
// error: undefined
```

### User

#### `GET /api/me`

Get the current authenticated user's profile.

**Authentication:** Required (Bearer token)

```typescript
const api = createApiClient({ token: session.session.token });

const { data, error } = await api.GET('/api/me');

// Response types:
// data: { user: User } | undefined
// error: { error: string; code: string } | undefined

if (data) {
    console.log(data.user.id); // string (UUID)
    console.log(data.user.name); // string
    console.log(data.user.email); // string (email format)
    console.log(data.user.emailVerified); // boolean
    console.log(data.user.image); // string | null
    console.log(data.user.role); // string
    console.log(data.user.createdAt); // string (ISO 8601)
    console.log(data.user.updatedAt); // string (ISO 8601)
}
```

### Admin

#### `GET /api/users`

Get all users in the system (admin only).

**Authentication:** Required (Bearer token + admin role)

```typescript
const api = createApiClient({ token: session.session.token });

const { data, error } = await api.GET('/api/users');

// Response types:
// data: { users: User[] } | undefined
// error: { error: string; code: string } | undefined

if (data) {
    data.users.forEach((user) => {
        console.log(user.email); // TypeScript knows the shape
    });
}
```

**Possible Errors:**

- `401 Unauthorized` - No valid session or token provided
- `403 Forbidden` - Admin role required

## Error Handling

All API calls return a tuple of `{ data, error }`. Only one will be defined at a time:

```typescript
const { data, error } = await api.GET('/api/me');

// TypeScript enforces checking before using
if (error) {
    // Handle error - TypeScript knows error shape from OpenAPI spec
    switch (error.code) {
        case 'UNAUTHORIZED':
            redirect('/login');
            break;
        case 'FORBIDDEN':
            redirect('/access-denied');
            break;
        default:
            console.error('Unknown error:', error.error);
    }
    return;
}

// TypeScript knows data is defined here
console.log(data.user.email);
```

## Type Safety Examples

### Autocomplete

Your IDE will autocomplete:

- Available endpoints
- Request body fields
- Response fields
- Error codes

```typescript
const { data, error } = await api.GET('/api/'); // IDE suggests: /api/me, /api/users

if (data) {
  data.user. // IDE suggests: id, name, email, emailVerified, etc.
}
```

### Type Checking

TypeScript catches errors at compile time:

```typescript
// ❌ TypeScript error: Endpoint doesn't exist
const { data } = await api.GET('/api/invalid');

// ❌ TypeScript error: Wrong method
const { data } = await api.POST('/health');

// ❌ TypeScript error: Field doesn't exist
console.log(data.user.invalidField);

// ✅ All type-safe
const { data } = await api.GET('/api/me');
console.log(data.user.email);
```

### Discriminated Unions

Response and error types are properly discriminated:

```typescript
const { data, error } = await api.GET('/api/me');

// TypeScript knows exactly one is defined
if (error) {
    error.error; // ✅ string
    error.code; // ✅ string
    data; // ❌ undefined
}

if (data) {
    data.user; // ✅ User object
    error; // ❌ undefined
}
```

## Helpers (Web App)

The web app provides helper functions in `/apps/web/src/lib/api.ts`:

### `getApiClient()`

Get an authenticated API client for Server Components (auto-includes session token).

```typescript
import { getApiClient } from '@/lib/api';

const api = await getApiClient();
const { data, error } = await api.GET('/api/me');
```

### `getPublicApiClient()`

Get an unauthenticated API client for public endpoints.

```typescript
import { getPublicApiClient } from '@/lib/api';

const api = getPublicApiClient();
const { data, error } = await api.GET('/health');
```

## Regenerating Types

When you modify your API (add/change endpoints, schemas, etc.), regenerate the client types:

```bash
# Regenerate OpenAPI types from the API spec
pnpm generate:client
```

This script:

1. Fetches the OpenAPI spec from your running API server
2. Generates TypeScript types using `openapi-typescript`
3. Saves them to `packages/@kit/api-client/src/generated/openapi.ts`

**Important:** Your API server must be running on `http://localhost:3001` for this to work.

## Advanced Usage

### Custom Fetch Options

You can pass custom fetch options to any request:

```typescript
const { data, error } = await api.GET('/api/me', {
    // Custom fetch options
    signal: abortController.signal,
    cache: 'no-store',
    next: { revalidate: 60 },
});
```

### Request Body (POST/PUT/PATCH)

```typescript
// When you add POST endpoints to your API, use them like this:
const { data, error } = await api.POST('/api/posts', {
    body: {
        title: 'My Post',
        content: 'Hello world',
    },
});

// TypeScript knows the exact shape of the body!
```

### Query Parameters

```typescript
// When you add query parameters to endpoints:
const { data, error } = await api.GET('/api/posts', {
    params: {
        query: {
            page: 1,
            limit: 10,
        },
    },
});
```

### Path Parameters

```typescript
// When you add path parameters:
const { data, error } = await api.GET('/api/users/{id}', {
    params: {
        path: {
            id: 'user-uuid',
        },
    },
});
```

## Best Practices

### 1. Always Check Errors First

```typescript
const { data, error } = await api.GET('/api/me');

if (error) {
    // Handle error case
    return;
}

// Now TypeScript knows data is defined
console.log(data.user.email);
```

### 2. Use Helpers in Web App

```typescript
// ❌ Don't manually manage tokens in Server Components
const api = createApiClient({ token: await getToken() });

// ✅ Use the helper
const api = await getApiClient();
```

### 3. Keep Client in Sync

After API changes, always regenerate:

```bash
# 1. Start API server
pnpm --filter @kit/api dev

# 2. In another terminal, regenerate client
pnpm generate:client

# 3. TypeScript will now know about new endpoints
```

### 4. Handle All Error Cases

Consider all possible HTTP error codes from your OpenAPI spec:

```typescript
const { data, error } = await api.GET('/api/users');

if (error) {
  // Check your OpenAPI spec for possible error codes
  if (error.code === 'UNAUTHORIZED') {
    redirect('/login');
  } else if (error.code === 'FORBIDDEN') {
    return <div>You don't have permission to view this.</div>;
  } else {
    return <div>An error occurred: {error.error}</div>;
  }
}
```

## Troubleshooting

### Types are outdated

**Problem:** TypeScript doesn't recognize new endpoints or fields.

**Solution:** Regenerate the client types:

```bash
pnpm generate:client
```

### API server connection refused

**Problem:** `pnpm generate:client` fails with ECONNREFUSED.

**Solution:** Make sure the API server is running:

```bash
pnpm --filter @kit/api dev
```

### TypeScript errors after regeneration

**Problem:** After regenerating, you get type errors in your code.

**Solution:** Your API contract changed. Update your code to match the new types.

## Related Documentation

- **OpenAPI Spec:** Visit `/docs` on your running API server (e.g., http://localhost:3001/docs)
- **Scalar Docs:** Interactive API documentation with examples
- **openapi-fetch:** https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch
- **openapi-typescript:** https://github.com/drwpow/openapi-typescript

## Examples

See real-world examples in the codebase:

- **Server Component:** `apps/web/src/app/dashboard/api-example/page.tsx`
- **Client Component:** `apps/web/src/app/dashboard/users/page.tsx`
- **Helpers:** `apps/web/src/lib/api.ts`
