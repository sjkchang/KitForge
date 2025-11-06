# Configuration System

A type-safe, singleton-based configuration system for the API built with Zod validation.

## Overview

The configuration system provides:

- **Type Safety**: Full TypeScript type inference with Zod validation
- **Fail-Fast**: Catches configuration errors at startup
- **Singleton**: Config loaded once on first import
- **Grouped Structure**: Logical grouping (app, database, auth, clients, email, openapi)
- **Smart Defaults**: Sensible defaults for development
- **Separate Constants**: Project constants separate from environment config

## Structure

```
config/
├── README.md                  # This file
├── index.ts                   # Config singleton and exports
├── config.schema.ts           # Zod schemas
├── config.test-helpers.ts     # Test helpers
└── project.constants.ts       # Project constants
```

## Usage

### Basic Usage

```typescript
import { config, PROJECT_CONSTANTS } from './config';

// Project constants (not from env vars)
console.log(PROJECT_CONSTANTS.name);        // 'SaaS Starter Kit'
console.log(PROJECT_CONSTANTS.version);     // '1.0.0'

// Environment-based configuration
console.log(config.env);                    // 'development'
console.log(config.app.port);               // 3001
console.log(config.app.url);                // 'http://localhost:3001'
console.log(config.database.url);           // 'postgresql://...'
console.log(config.clients.web.url);        // 'http://localhost:3000'
```

### Type-Safe Email Provider Access

```typescript
import { config } from './config';

// TypeScript enforces type narrowing
if (config.email.provider.type === 'resend') {
  // api_key is available and type-safe
  console.log(config.email.provider.api_key);
}

if (config.email.provider.type === 'console') {
  // api_key does NOT exist on console provider (TypeScript error if accessed)
}
```

### Environment Checks

```typescript
import { config } from './config';

if (config.env === 'development') {
  console.log('Running in development mode');
}

if (config.env === 'production') {
  console.log('Running in production mode');
}

if (config.env === 'staging') {
  console.log('Running in staging mode');
}
```

### Testing

```typescript
import { setTestConfig, resetTestConfig } from './config/config.test-helpers';
import { describe, it, beforeEach, afterEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Override specific config values for testing
    setTestConfig({
      email: {
        provider: { type: 'console' },
        from: 'test@test.com',
      },
    });
  });

  afterEach(() => {
    resetTestConfig();
  });

  it('should use test config', () => {
    // Config is automatically available
  });
});
```

## Configuration Sections

### Project Constants

Hardcoded values defined in `project.constants.ts` (imported separately, not part of config):

```typescript
import { PROJECT_CONSTANTS } from './config';

PROJECT_CONSTANTS.name         // 'SaaS Starter Kit'
PROJECT_CONSTANTS.description  // 'A modern SaaS starter kit...'
PROJECT_CONSTANTS.version      // '1.0.0'
```

**When to change**: When forking the template to build your own SaaS product.

**Why separate?**: These are constants that don't need to be secret or environment-specific, making config simpler and more focused on environment variables.

### Environment

Runtime environment information:

```typescript
{
  env: 'development' | 'staging' | 'production';
}
```

**Environment Variable**: `NODE_ENV`
**Default**: `'development'`
**Environments**:
- `development` - Local development
- `staging` - Pre-production testing
- `production` - Live production

### App

This API server configuration:

```typescript
{
  app: {
    port: number;    // Default: 3001
    url: string;     // Default: 'http://localhost:3001'
  }
}
```

**Environment Variables**:
- `PORT` - Server port
- `API_URL` - This API server's URL

### Clients

Client application URLs (for CORS and trusted origins):

```typescript
{
  clients: {
    web: {
      url: string;   // Default: 'http://localhost:3000'
    }
  }
}
```

**Environment Variables**:
- `FRONTEND_URL` - Next.js web app URL

### Database

Database connection configuration:

```typescript
{
  database: {
    url: string;  // Required
  }
}
```

**Environment Variables**:
- `DATABASE_URL` - **Required** PostgreSQL connection string

### Authentication

Better Auth configuration:

```typescript
{
  auth: {
    secret: string;                // Required, min 32 chars
    base_url: string;              // Default: 'http://localhost:3001'
    trusted_origins: string[];     // Default: [FRONTEND_URL]
  }
}
```

**Environment Variables**:
- `BETTER_AUTH_SECRET` - **Required** (min 32 characters)
- `BETTER_AUTH_URL` - Auth base URL
- `FRONTEND_URL` - Auto-added to trusted origins

### Email

Email provider configuration with discriminated union:

```typescript
{
  email: {
    from: string;  // Default: 'noreply@localhost.com'
    provider:
      | { type: 'console' }
      | { type: 'resend'; api_key: string }
  }
}
```

**Environment Variables**:
- `EMAIL_FROM` - Default from address
- `EMAIL_PROVIDER` - 'console' (default) or 'resend'
- `RESEND_API_KEY` - **Required when `EMAIL_PROVIDER=resend`**

**Fail-Fast Behavior**: If you set `EMAIL_PROVIDER=resend` but don't provide `RESEND_API_KEY`, the application will fail to start with a clear error message.

### OpenAPI Documentation

OpenAPI/Scalar documentation configuration:

```typescript
{
  openapi: {
    enabled: boolean;                     // Default: true
    include_better_auth_routes: boolean;  // Default: true
  }
}
```

**Environment Variables**:
- `OPENAPI_ENABLED` - Enable/disable OpenAPI docs endpoint
- `OPENAPI_INCLUDE_BETTER_AUTH_ROUTES` - Include Better Auth routes in combined spec

**Boolean Parsing**: Accepts `true`, `1`, `yes`, `on` for true and `false`, `0`, `no`, `off` for false.

## Customizing for Your SaaS

When forking this template, update `project.constants.ts`:

```typescript
export const PROJECT_CONSTANTS = {
  name: 'Your SaaS Name',
  description: 'Your amazing SaaS description',
  version: '1.0.0',
} as const;
```

These constants are used throughout the application:
- API documentation title
- Email templates
- Error messages
- Logging

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | `your-super-secret-key-min-32-chars` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment (`development`, `staging`, `production`) |
| `PORT` | `3001` | Server port |
| `API_URL` | `http://localhost:3001` | This API server's URL |
| `FRONTEND_URL` | `http://localhost:3000` | Next.js web app URL (for CORS) |
| `BETTER_AUTH_URL` | `http://localhost:3001` | Better Auth base URL |
| `EMAIL_FROM` | `noreply@localhost.com` | Default email sender |
| `EMAIL_PROVIDER` | `console` | Email provider (`console`, `resend`) |
| `RESEND_API_KEY` | - | Resend API key (required if `EMAIL_PROVIDER=resend`) |
| `OPENAPI_ENABLED` | `true` | Enable OpenAPI docs |
| `OPENAPI_INCLUDE_BETTER_AUTH_ROUTES` | `true` | Include auth routes in docs |

## Design Decisions

### Why Singleton Pattern?

Config is loaded once on first import because:
1. **Simplicity**: Just `import { config }` - no function calls needed
2. **Immutability**: Config should be immutable during runtime
3. **Performance**: Prevents repeated environment variable parsing
4. **Consistency**: Ensures same config across entire application

### Why Grouped Structure?

Config properties are grouped into logical sections (`config.app.port`, `config.database.url`, `config.clients.web.url`) because:
1. **Organization**: Related settings grouped together (app, database, auth, clients, email, openapi)
2. **Clarity**: Clear separation between different concerns
3. **Extensibility**: Easy to add new fields (like `config.clients.marketing.url`) without cluttering top level
4. **Discoverability**: `config.clients.` shows all client apps

### Why Separate Project Constants?

Project constants (name, version, description) are separate from config because:
1. **Not secrets**: Don't need environment variable secrecy
2. **Not environment-specific**: Same across all environments
3. **Simpler config**: Config focused only on environment variables
4. **Easy to import**: `PROJECT_CONSTANTS.name` is clearer than hardcoded strings

### Why No 'test' Environment?

Tests use `setTestConfig()` to override config, so 'test' doesn't need to be a valid NODE_ENV value. This keeps the enum cleaner and matches real deployment environments.

### Why Discriminated Unions for Email?

The email provider config uses TypeScript discriminated unions to:
1. Enforce that `api_key` is only present when `type === 'resend'`
2. Provide compile-time safety when accessing provider-specific config
3. Enable fail-fast validation when resend is configured incorrectly

### Why Singleton Pattern?

Configuration is loaded once at startup because:
1. Config should be immutable during runtime
2. Prevents repeated environment variable parsing
3. Ensures consistency across the application
4. Easy to override for testing with `setConfig()`

### Why Fail-Fast?

The system throws errors at startup (not runtime) because:
1. Configuration errors should prevent deployment
2. Clearer error messages during development
3. Prevents production issues from misconfiguration
4. Follows the "fail-fast" principle

## Integration with Service Registry

The configuration system integrates with the Service Registry to determine which service implementations to use:

```typescript
// services/service-registry.ts
import { config } from '../config';

export function registerServices(): void {
  registry.register('email', () => {
    return new EmailService({
      providerType: config.email.provider.type,
      resendApiKey: config.email.provider.type === 'resend'
        ? config.email.provider.api_key
        : undefined,
      defaultFrom: config.email.from,
    });
  });
}
```

This allows the DI system to instantiate the correct service implementation based on configuration.
