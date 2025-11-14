# API Structure Documentation

**Last Updated:** 2025-11-11

This document describes the organizational structure of the API (`apps/api/src`), including design principles, current implementation, and future expansion patterns.

---

## Design Philosophy

### Services vs Domains

**Services (Technical/Reusable):**

- Could be extracted and used in another application with minimal changes
- Technical implementations (email, storage, payments, SMS, etc.)
- No business logic specific to this SaaS application
- May include their own HTTP routes if they expose generic endpoints
- Examples: email service, file upload service, payment processor

**Domains (Business/Domain-Specific):**

- Business logic specific to this application
- Domain models and rules (users, teams, projects, etc.)
- Uses services as dependencies
- Contains entities, repositories, and domain-specific logic
- Examples: user management, team management, subscription management

**Key Question:** _"Could another application use this implementation with minimal changes?"_

- If YES → Service
- If NO → Module

### Routes Organization

**Business Routes (`routes/`):**

- Application-specific HTTP endpoints
- Thin layer - handles request/response
- Contains business logic orchestration
- Uses modules and services
- Flat structure (one file per domain)

**Service Routes (`services/{name}/*.routes.ts`):**

- Generic, reusable HTTP endpoints
- Part of self-contained service packages
- Can be mounted in any application
- Examples: generic file upload, generic auth endpoints

---

## Current Structure

```
apps/api/src/
├── index.ts                       # Application entry point
├── app.ts                         # App setup, middleware, route registration
│
├── config/                        # Configuration management
│   ├── index.ts                   # Exports config singleton
│   ├── config.schema.ts           # Zod schemas for env vars
│   ├── config.test-helpers.ts     # Test utilities
│   ├── project.constants.ts       # Hardcoded project constants
│   └── README.md                  # Config documentation
│
├── lib/                           # Shared utilities
│   └── ...
│
├── types/                         # Global TypeScript definitions
│   ├── better-auth.d.ts           # Better Auth type extensions
│   └── hono.d.ts                  # Hono context type extensions
│
├── middleware/                    # HTTP middleware (may move to services/auth)
│   ├── auth.ts                    # jwtAuth, requireAdmin
│   └── auth.test.ts
│
├── routes/                        # Business/app-specific routes (flat)
│   ├── index.ts                   # Exports all app routes
│   ├── health.routes.ts           # System health endpoint
│   ├── users.routes.ts            # User management endpoints
│   └── openapi.routes.ts          # OpenAPI documentation endpoints
│
├── schemas/                       # Core/shared OpenAPI schemas
│   ├── index.ts                   # Exports all schemas
│   ├── error.ts                   # Error response schemas (shared)
│   ├── health.ts                  # Health check schema
│   └── user.ts                    # User schema (core domain)
│
├── services/                      # Reusable technical services
│   ├── registry.ts                # Generic ServiceRegistry class
│   ├── service-registry.ts        # Service registration & exports
│   ├── types.ts                   # Services interface definition
│   │
│   ├── auth/                      # Authentication service
│   │   ├── index.ts               # Exports service, routes, middleware
│   │   ├── auth.lib.ts            # Better Auth instance
│   │   ├── auth.routes.ts         # Better Auth integration routes
│   │   └── auth.middleware.ts     # jwtAuth, requireAdmin
│   │
│   └── email/                     # Email service (technical)
│       ├── index.ts               # Exports EmailService
│       ├── email.service.ts       # Core email logic
│       ├── email.service.test.ts
│       ├── email.service.integration.test.ts
│       ├── providers/
│       │   ├── console-email-provider.ts
│       │   ├── console-email-provider.test.ts
│       │   └── resend-email-provider.ts
│       ├── templates/             # Email templates (reusable)
│       │   ├── email-verification.template.ts
│       │   ├── email-verification.template.test.ts
│       │   └── password-reset.template.ts
│       └── types/
│           └── email-provider.interface.ts
│
└── domains/                       # Business domains
    └── users/                     # User management (business logic)
        ├── index.ts               # Exports for module
        ├── user.entity.ts         # User entity (Zod schema)
        ├── user.entity.test.ts
        ├── user.repository.ts     # User data access
        └── user.repository.test.ts
```

---

## Future Expansion Patterns

### Adding a Service with Routes

**Example: Storage Service**

```
services/storage/
├── index.ts                       # Exports StorageService + storageRoutes
├── storage.service.ts             # Core upload/download logic
├── storage.service.test.ts
├── storage.routes.ts              # Generic HTTP endpoints
├── storage.schema.ts              # OpenAPI schemas for routes
├── storage.middleware.ts          # File validation, size limits
├── providers/
│   ├── storage-provider.interface.ts
│   ├── s3-provider.ts             # AWS S3 implementation
│   ├── local-provider.ts          # Local filesystem implementation
│   └── gcs-provider.ts            # Google Cloud Storage implementation
└── types/
    └── index.ts
```

**Usage in app.ts:**

```typescript
import { storageRoutes } from './services/storage';

// Mount generic storage routes
app.route('/api/v1/storage', storageRoutes);
```

**Generic Routes Provided:**

- `POST /api/v1/storage/upload` - Generic file upload
- `GET /api/v1/storage/:id` - Generic file retrieval
- `DELETE /api/v1/storage/:id` - Generic file deletion

**Service Usage:**

```typescript
// services/service-registry.ts
import { StorageService } from './storage';

export function registerServices(): void {
    registry.register('storage', () => {
        return new StorageService({
            provider: config.storage.provider.type,
            bucket: config.storage.bucket,
        });
    });
}

// In business logic
import { services } from './services/service-registry';

await services.storage.upload(file, { path: 'avatars/' });
```

### Adding a Service without Routes

**Example: SMS Service**

```
services/sms/
├── index.ts                       # Exports SmsService only (no routes)
├── sms.service.ts                 # Core SMS logic
├── sms.service.test.ts
├── providers/
│   ├── sms-provider.interface.ts
│   ├── twilio-provider.ts
│   └── console-provider.ts        # Dev/testing
└── types/
    └── index.ts
```

**Usage (Programmatic Only):**

```typescript
import { services } from './services/service-registry';

// Used in business logic, no HTTP endpoints
await services.sms.send({
    to: user.phoneNumber,
    message: 'Your verification code is: 123456',
});
```

### Adding a Business Domain

**Example: Team Management Module**

```
domains/teams/
├── index.ts                       # Exports entities, repositories
├── team.entity.ts                 # Team domain model
├── team.entity.test.ts
├── team.repository.ts             # Team data access
├── team.repository.test.ts
├── team-member.entity.ts          # Team member domain model
├── team-member.repository.ts      # Team member data access
├── team.schema.ts                 # Team-specific OpenAPI schemas (optional)
└── team-avatar.service.ts         # Business logic (uses storage service)
```

**Corresponding Business Route:**

```
routes/teams.routes.ts             # Team-specific HTTP endpoints
```

**Route Implementation:**

```typescript
// routes/teams.routes.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { teamRepository } from '../domains/teams';
import { services } from '../services/service-registry';

export const teamsRoutes = new OpenAPIHono()
    .openapi(createTeamRoute, async (c) => {
        const data = c.req.valid('json');
        const user = c.get('user');

        // Business logic
        const team = await teamRepository.create({
            name: data.name,
            ownerId: user.id,
        });

        return c.json({ team }, 201);
    })
    .openapi(uploadTeamAvatarRoute, async (c) => {
        const { teamId } = c.req.valid('param');
        const { file } = c.req.valid('form');

        // Business logic: Check permissions
        const team = await teamRepository.findById(teamId);
        if (!canUploadAvatar(c.get('user'), team)) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        // Use storage service
        const result = await services.storage.upload(file, {
            path: `teams/${teamId}/avatar`,
            maxSize: '2MB',
        });

        // Business logic: Update team
        await teamRepository.update(teamId, { avatarUrl: result.url });

        return c.json({ avatarUrl: result.url });
    });
```

**Schema Organization:**

```typescript
// Core domain schema (centralized)
// schemas/team.ts
export const TeamSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.string().uuid(),
    avatarUrl: z.string().url().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// Niche/endpoint-specific schemas (in module if needed)
// domains/teams/team.schema.ts
export const CreateTeamInvitationSchema = z.object({
    email: z.string().email(),
    role: z.enum(['member', 'admin']),
    expiresInDays: z.number().min(1).max(30),
});
```

### Adding a Complex Feature (Billing)

**Services:**

```
services/payments/                 # Reusable payment service
├── index.ts
├── payment.service.ts             # Generic payment logic
├── providers/
│   ├── stripe-provider.ts
│   └── paddle-provider.ts
└── types/
```

**Domains:**

```
domains/billing/                   # App-specific billing logic
├── index.ts
├── subscription.entity.ts         # Subscription domain model
├── subscription.repository.ts
├── subscription.service.ts        # Business logic (uses payment service)
├── invoice.entity.ts
└── invoice.repository.ts
```

**Routes:**

```
routes/billing.routes.ts           # Billing endpoints
```

**Schemas:**

```
schemas/subscription.ts            # Core subscription schema (centralized)
domains/billing/billing.schema.ts  # Niche schemas (if needed)
```

---

## Decision Trees

### "Where does this code go?"

#### New HTTP Endpoint

```
Is this endpoint generic and reusable across applications?
├─ YES → Create/add to service routes
│         services/{service}/service.routes.ts
│
└─ NO → Is it business-specific?
    └─ YES → Create/add to business routes
              routes/{domain}.routes.ts
```

#### New Service vs Module

```
Is this technical infrastructure that could be reused?
├─ YES → Create a service
│         services/{service-name}/
│
└─ NO → Does it contain business logic specific to this app?
    └─ YES → Create a module
              domains/{domain}/
```

#### New Schema

```
Is this a core domain object? (User, Team, Subscription)
├─ YES → Centralized schema
│         schemas/{entity}.ts
│
└─ NO → Is it specific to one module/endpoint?
    └─ YES → Domain-specific schema
              domains/{domain}/{entity}.schema.ts
```

### "Should this be a service or module?"

**Ask yourself:**

- Could another SaaS use this with <10% changes? → **Service**
- Does it implement business rules unique to my app? → **Module**
- Is it technical (email, storage, payments)? → **Service**
- Is it domain-specific (users, teams, projects)? → **Module**

**Examples:**

| Feature                   | Type    | Reason                                       |
| ------------------------- | ------- | -------------------------------------------- |
| Email sending             | Service | Generic, any app sends emails                |
| Email verification flow   | Module  | Business rule: how/when you verify           |
| File upload/download      | Service | Generic, any app uploads files               |
| Team avatar upload        | Module  | Business rule: who can upload, size limits   |
| Stripe payment processing | Service | Generic, any app can charge cards            |
| Subscription management   | Module  | Business rule: your pricing, tiers, features |
| SMS sending               | Service | Generic, any app sends SMS                   |
| 2FA via SMS               | Module  | Business rule: when/how you require 2FA      |

---

## Service Registry Pattern

All services are registered and accessed via the Service Registry:

```typescript
// services/service-registry.ts
import { ServiceRegistry } from './registry';
import type { Services } from './types';

const registry = new ServiceRegistry<Services>();

export function registerServices(): void {
    registry.register('email', () => {
        return new EmailService({
            providerType: config.email.provider.type,
            resendApiKey:
                config.email.provider.type === 'resend'
                    ? config.email.provider.api_key
                    : undefined,
            defaultFrom: config.email.from,
        });
    });

    // Future services:
    // registry.register('storage', () => new StorageService(...));
    // registry.register('sms', () => new SmsService(...));
}

// Auto-registers on first access
export const services = createServicesProxy();
```

**Adding a New Service to Registry:**

1. Create service in `services/{name}/`
2. Add to `Services` interface in `services/types.ts`
3. Register in `registerServices()` in `services/service-registry.ts`
4. Use anywhere: `services.{name}.method()`

---

## Migration Checklist

When adding new features, follow this checklist:

### New Service Checklist

- [ ] Create `services/{name}/` directory
- [ ] Implement `{name}.service.ts`
- [ ] Add tests: `{name}.service.test.ts`
- [ ] If exposing HTTP endpoints: create `{name}.routes.ts`
- [ ] If routes: create `{name}.schema.ts` for OpenAPI
- [ ] Add to `Services` interface in `services/types.ts`
- [ ] Register in `registerServices()` in `services/service-registry.ts`
- [ ] If routes: mount in `app.ts`
- [ ] Update this documentation

### New Domain Checklist

- [ ] Create `domains/{name}/` directory
- [ ] Define entity: `{name}.entity.ts` (Zod schema)
- [ ] Create repository: `{name}.repository.ts`
- [ ] Add tests for entity and repository
- [ ] If core domain: add schema to `schemas/{name}.ts`
- [ ] Create business routes in `routes/{name}.routes.ts`
- [ ] Add route tests
- [ ] Mount routes in `app.ts`
- [ ] Update this documentation

### New Business Route Checklist

- [ ] Create `routes/{name}.routes.ts`
- [ ] Define OpenAPI schemas (centralized or module-specific)
- [ ] Implement route handlers using domains/services
- [ ] Add route tests
- [ ] Mount in `app.ts`
- [ ] Regenerate API client: `pnpm generate:client`
- [ ] Update this documentation

---

## Best Practices

### Services

1. **Keep services focused** - One service, one technical concern
2. **Provider pattern** - Support multiple implementations (Resend/SendGrid, S3/GCS)
3. **Configuration-driven** - Use `config` for provider selection
4. **Include routes if needed** - Generic endpoints belong with service
5. **Export everything** - Service class, routes, schemas, types from `index.ts`

### Domains

1. **Entity-first** - Start with Zod entity schema (source of truth)
2. **Repository pattern** - Always validate DB results against entity
3. **Thin routes** - Route handlers orchestrate, don't implement logic
4. **Use services** - Don't reimplement technical concerns
5. **Test at every layer** - Entity, repository, route tests

### Routes

1. **One file per domain** - Flat structure, no nesting
2. **OpenAPI-first** - Always use `createRoute()` with schemas
3. **Comprehensive docs** - Description, use cases, code samples
4. **Consistent errors** - Use shared error schemas
5. **Authorization** - Always check permissions for protected routes

### Schemas

1. **Centralize core domains** - User, Team, Subscription in `schemas/`
2. **Domain-specific for niche** - One-off schemas can live in modules
3. **Reuse shared** - Error responses, pagination, etc.
4. **OpenAPI examples** - Always include realistic examples
5. **Validation-first** - Use Zod, generate TypeScript types from it

---

## Testing Strategy

### Services

- **Unit tests** - Mock providers, test service logic
- **Integration tests** - Real providers (use Testcontainers if needed)
- **Contract tests** - Ensure provider interface compliance

### Domains

- **Entity tests** - Validate Zod schemas
- **Repository tests** - Integration tests with real DB (Testcontainers)
- **Service tests** - Unit tests with mocked repositories

### Routes

- **Route tests** - Integration tests hitting actual endpoints
- **Authorization tests** - Verify permission checks
- **Validation tests** - Test error handling for invalid inputs

---

## Future Considerations

### Potential Services

- **Storage** (`services/storage/`) - File uploads (S3, GCS, local)
- **SMS** (`services/sms/`) - SMS notifications (Twilio, etc.)
- **Payments** (`services/payments/`) - Payment processing (Stripe, Paddle)
- **Analytics** (`services/analytics/`) - Event tracking (Mixpanel, PostHog)
- **Search** (`services/search/`) - Full-text search (Algolia, Meilisearch)

### Potential Domains

- **Teams** (`domains/teams/`) - Team management, invitations, roles
- **Billing** (`domains/billing/`) - Subscriptions, invoices, usage
- **Projects** (`domains/projects/`) - User projects/workspaces
- **Notifications** (`domains/notifications/`) - In-app notifications
- **Webhooks** (`domains/webhooks/`) - Webhook management

### Extracting Packages

As services mature, consider extracting to workspace packages:

```
packages/
├── @kit/email/                    # Extracted email service
├── @kit/storage/                  # Extracted storage service
└── @kit/payments/                 # Extracted payment service
```

This allows:

- Separate versioning
- Reuse across multiple apps in monorepo
- Potential open-source extraction
- Clearer dependency boundaries

---

## Questions?

When in doubt, ask:

1. **"Could another app use this?"** → Service
2. **"Is this specific to our business?"** → Module
3. **"Where do routes go?"** → Generic in service, business in routes/
4. **"Where do schemas go?"** → Core in schemas/, niche in domains/

**Remember:** This structure serves the goal of building a **maintainable, scalable, and extractable SaaS starter kit**. When patterns don't fit perfectly, choose what makes the codebase clearest for the next developer.
