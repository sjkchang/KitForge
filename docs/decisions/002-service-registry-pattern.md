# ADR 002: Service Registry Pattern for Dependency Injection

**Status:** Accepted
**Date:** 2025-10-30
**Deciders:** Development Team

## Context

We needed a consistent, ergonomic pattern for managing application services (email, SMS, storage, payments, etc.) across the SaaS starter kit. The initial implementation used module-level singleton functions which had several issues:

### Problems with Initial Approach

1. **Poor testability:** Required calling `resetEmailService()` in tests, a code smell indicating tight coupling
2. **Indirect dependencies:** Better Auth and other modules called `getEmailService()` directly, creating hidden global state
3. **No composition root:** Unlike the repository pattern described in our architecture docs, there was no clear place where all services were wired together
4. **Cumbersome API:** Multiple factory layers (`createEmailProvider()` + `EmailService`) felt over-engineered
5. **Verbose usage:** Required `getEmailService()` call on every use

### Requirements

- Ergonomic API: Simple, clean syntax for accessing services
- Type safety: Full TypeScript autocomplete and compile-time checking
- Testability: Easy to mock services for testing
- Centralized management: Single place to register all services
- Lazy initialization: Services created only when needed
- Scalable: Easy pattern for adding new services

## Decision

We adopted a **Service Registry pattern** with the following design:

### Architecture

```
apps/api/src/services/
├── registry.ts           # Generic ServiceRegistry<T> class
├── types.ts             # Services interface (type definitions)
└── service-registry.ts  # Service registration + exported instance
```

### Key Design Decisions

1. **Proxy-based property access:** Export a `services` object that auto-registers on first access

    ```typescript
    services.email.sendEmailVerification(...) // Clean syntax
    ```

2. **Type-safe interface:** Define all services in a `Services` interface for autocomplete

    ```typescript
    interface Services {
        email: EmailService;
    }
    ```

3. **Lazy initialization:** Services registered as factories, instantiated on first access

    ```typescript
    registry.register('email', () => new EmailService(...));
    ```

4. **Auto-registration:** Services register automatically via Proxy on first property access
    - No need to call `registerServices()` manually in production code
    - Can still call explicitly for control in tests

5. **Simplified service implementation:** Merged email provider factory into EmailService constructor
    - Reduced indirection
    - Service takes config, creates provider internally

### Implementation

```typescript
// services/service-registry.ts
const registry = new ServiceRegistry<Services>();

export function registerServices(): void {
    registry.register('email', () => {
        return new EmailService({
            providerType: process.env.EMAIL_PROVIDER || 'console',
            resendApiKey: process.env.RESEND_API_KEY,
            defaultFrom: process.env.EMAIL_FROM || 'noreply@localhost.com',
        });
    });
}

// Auto-registering proxy
const servicesProxy = new Proxy(registry, {
    get(target, prop) {
        if (!registered) registerServices();
        return target.get(prop as keyof Services);
    },
});

export const services = servicesProxy as Services;
```

### Usage

```typescript
// Production code
import { services } from './services/service-registry';
await services.email.sendEmailVerification(...);

// Testing
import { configureServices, resetServices } from './services/service-registry';

beforeEach(() => {
  configureServices({ email: mockEmailService });
});
```

## Rationale

### Why Service Registry over Alternatives?

**Considered alternatives:**

1. **Context-based injection:** Pass context object everywhere
    - ❌ Requires threading context through all functions
    - ❌ Verbose, clutters function signatures

2. **Simple module-level singleton:** (Original implementation)
    - ❌ Hard to test (need reset functions)
    - ❌ Hidden global state
    - ❌ Not composable

3. **Full DI framework:** (e.g., InversifyJS, tsyringe)
    - ❌ Over-engineering for our needs
    - ❌ Additional complexity and learning curve
    - ❌ Decorators and reflection add build complexity

4. **Functional approach:** Export factory functions directly
    - ✅ Simple and clean
    - ❌ Less organized as service count grows
    - ❌ Harder to override for testing

### Why This Pattern Wins

- **Ergonomic:** `services.email` is clean and intuitive
- **Type-safe:** TypeScript autocomplete works perfectly
- **Centralized:** One place to see all services
- **Simple:** No decorators, no complex framework
- **Testable:** Easy `configureServices()` for mocks
- **Scalable:** Clear pattern for adding services

### Why Proxy-Based Auto-Registration?

- **DX benefit:** Import once, use anywhere without ceremony
- **No startup coupling:** Don't need explicit `registerServices()` call in production
- **Lazy by default:** Services created only when needed
- **Still explicit for tests:** Can call `registerServices()` or `configureServices()` for test control

## Consequences

### Positive

- ✅ **Excellent DX:** Developers love the clean `services.email` syntax
- ✅ **Easy testing:** `configureServices()` makes mocking trivial
- ✅ **Type safety:** Compiler catches typos and missing services
- ✅ **Maintainable:** Clear single responsibility for each file
- ✅ **Scalable:** Easy to add new services following same pattern
- ✅ **Standard pattern:** All future services will follow this approach

### Negative

- ⚠️ **Proxy magic:** Some developers may find Proxy less obvious than explicit calls
    - Mitigated by: Clear documentation and examples
- ⚠️ **Global state:** Still uses module-level singleton
    - Mitigated by: Explicit `resetServices()` for testing, clear lifecycle
- ⚠️ **Runtime errors:** Missing services throw at runtime, not compile-time
    - Mitigated by: TypeScript prevents access to undefined services

### Neutral

- 📝 **Learning curve:** New pattern to learn (but simpler than DI frameworks)
- 📝 **Migration effort:** Need to update existing services to follow this pattern
    - Completed for email service as reference implementation

## Alternatives Considered

### 1. Service Locator with String Keys

```typescript
registry.get<EmailService>('email');
```

**Rejected because:**

- Less type-safe (manual type annotations)
- More verbose than property access
- No autocomplete for service names

### 2. Direct Named Exports

```typescript
export const email = createEmailService();
```

**Rejected because:**

- Harder to override for testing
- No central registry to inspect
- Services instantiate at module load time (not lazy)

### 3. Explicit Factory in app.ts

```typescript
export function createApp() {
  const emailService = new EmailService(...);
  return { app, services: { email: emailService } };
}
```

**Rejected because:**

- Better Auth initializes at module level, can't receive injected services
- Would require major refactoring of Better Auth integration
- Less ergonomic for general service access

## Implementation Notes

### Migration Steps

1. ✅ Created `ServiceRegistry<T>` generic class
2. ✅ Created `Services` interface
3. ✅ Implemented auto-registering proxy
4. ✅ Simplified EmailService (merged factory)
5. ✅ Updated Better Auth to use `services.email`
6. ✅ Updated all tests
7. ✅ Documented in CLAUDE.md

### Future Services

All new services should follow this pattern:

1. Create service class in its own directory (e.g., `sms/sms.service.ts`)
2. Add interface to `services/types.ts`
3. Register factory in `services/service-registry.ts`
4. Use via `services.sms`

Examples: SMS, storage (S3/R2), payment (Stripe/Polar), analytics, logging

## References

- Service Locator Pattern: https://en.wikipedia.org/wiki/Service_locator_pattern
- Dependency Injection Patterns: https://martinfowler.com/articles/injection.html
- CLAUDE.md: Service Registry Pattern section
