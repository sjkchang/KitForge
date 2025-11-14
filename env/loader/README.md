# @kit/env

Environment variable loader for the Kit monorepo.

## Overview

This loader utility automatically loads environment variables from the `/env` directory based on the service being run.

**Structure:**
- `/env/*.env.*` - Environment configuration files
- `/env/loader/` - This loader utility (you are here)

All environment files are stored in `/env` at the workspace root, keeping configuration centralized and preventing cross-pollution between services.

## Loading Order

Environment files are loaded in this order (later files override earlier ones):

```
1. env/.env.global      - Global defaults for all services
2. env/.env.[service]   - Service-specific configuration
3. env/.env.local       - Local developer overrides (gitignored)
```

Example for `apps/api`:
```
env/.env.global → env/.env.api → env/.env.local
```

## Usage

Simply import at the top of your application entry point:

```typescript
import '@kit/env';
```

The package automatically:
- Detects which service is running (based on current working directory)
- Loads the global configuration
- Loads service-specific configuration
- Applies local overrides

## Service Detection

The package automatically detects the service based on directory:

| Directory | Service | Env File |
|-----------|---------|----------|
| `apps/api` | api | `env/.env.api` |
| `apps/web` | web | `env/.env.web` |
| `apps/marketing` | marketing | `env/.env.marketing` |
| `packages/*` | (none) | Only loads `.env.global` |

## Files

See `/env/README.md` for detailed documentation on the environment file structure.

## Debugging

In development, the package logs which files were loaded:

```
[env] Loaded: .env.global, .env.api, .env.local
```

## Benefits

- **Centralized**: All env files in one place (`/env`)
- **Co-located**: Loader code lives alongside env files in `/env/loader`
- **No cross-pollution**: Each service loads only its config
- **Turborepo friendly**: Doesn't interfere with caching
- **Type-safe**: Works with config validation systems
- **Developer-friendly**: Simple `.env.local` for overrides
