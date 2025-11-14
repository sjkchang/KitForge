# Environment Configuration

Centralized environment variable management for the Kit monorepo.

## Structure

```
env/
├── .env.global          # Global defaults for all services (committed)
├── .env.api             # API service config (committed)
├── .env.web             # Web app config (committed)
├── .env.marketing       # Marketing site config (committed)
├── .env.local           # Local overrides (gitignored, optional)
└── README.md            # This file
```

## Loading Strategy

Each service loads environment variables in this order (later overrides earlier):

1. **`.env.global`** - Global defaults shared across all services
2. **`.env.[service]`** - Service-specific configuration
3. **`.env.local`** - Local developer overrides (gitignored)

Example for `apps/api`:
```
env/.env.global → env/.env.api → env/.env.local
```

## Usage

### In Your App

Use the `@kit/env` package which handles loading automatically:

```typescript
// apps/api/src/index.ts
import '@kit/env'; // Auto-loads: .env.global + .env.api + .env.local
```

The `@kit/env` package:
- Detects which service is loading (based on `process.cwd()`)
- Loads global config first
- Loads service-specific config
- Applies local overrides last

### Adding a New Service

1. Create `env/.env.[service]` with service-specific variables
2. Update `@kit/env` to recognize the service name
3. Import `@kit/env` in your service entry point

## Files

### `.env.global` (committed ✅)
Global defaults for all services:
- Database URLs
- Shared service URLs
- Common configuration

### `.env.[service]` (committed ✅)
Service-specific configuration:
- Port numbers
- Service-specific API keys
- Feature flags
- Service endpoints

### `.env.local` (gitignored ❌)
Developer-specific overrides:
- Local database credentials
- Personal API keys for testing
- Custom ports
- Debug flags

**Never commit this file!**

## Best Practices

### 1. Keep Secrets in .env.local
```bash
# ❌ Don't commit real secrets
# env/.env.api
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long

# ✅ Override with real secrets locally
# env/.env.local
BETTER_AUTH_SECRET=actual-production-secret-from-1password
```

### 2. Document All Variables
Add comments explaining:
- What the variable does
- Where to get the value (for API keys)
- Default values
- Required vs optional

### 3. Use Sensible Defaults
Make development "just work":
```bash
# Good: Works out of the box for local dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kit_dev

# Bad: Requires setup before running
DATABASE_URL=YOUR_DATABASE_URL_HERE
```

### 4. Minimize Duplication
- Put shared config in `.env.global`
- Only override in service files when needed
- Use `.env.local` for personal tweaks

## Tool Integration

### Docker Compose

The `docker-compose.yml` file automatically loads environment variables from the centralized `/env` directory:

```yaml
env_file:
  - env/.env.global
  - env/.env.local  # Optional - gitignored
```

This means environment variables in `env/.env.global` and `env/.env.local` are available to all Docker Compose services.

### Node.js Services

Services using `@kit/env` automatically load the appropriate env files based on their directory:

- `apps/api` loads: `env/.env.global` → `env/.env.api` → `env/.env.local`
- `apps/web` loads: `env/.env.global` → `env/.env.web` → `env/.env.local`

### Scripts and CI/CD

For scripts or CI/CD pipelines, you can manually load env files:

```bash
# Load global + service-specific env
set -a
source env/.env.global
source env/.env.api
set +a

# Run command
node dist/index.js
```

Or use `dotenv-cli`:

```bash
dotenv -e env/.env.global -e env/.env.api -- node dist/index.js
```

## Example Workflow

### First Time Setup

1. Copy the env files (already done by template)
2. Create `env/.env.local` for personal overrides:
```bash
# env/.env.local
DATABASE_URL=postgresql://postgres:mypassword@localhost:5433/my_db
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

### Adding a New Environment Variable

1. Add to appropriate file:
   - Shared? → `.env.global`
   - Service-specific? → `.env.[service]`
   - Personal? → `.env.local`

2. Document it with comments

3. Update TypeScript config validation if needed

### Working with Secrets

For production secrets:
1. Never commit real values
2. Use placeholder values in committed files
3. Override in `.env.local` for local dev
4. Inject via CI/CD for production

## Service Mapping

| Service | Env File | Working Directory |
|---------|----------|-------------------|
| API | `.env.api` | `apps/api` |
| Web | `.env.web` | `apps/web` |
| Marketing | `.env.marketing` | `apps/marketing` |

## Debugging

The `@kit/env` package logs loaded files in development:

```
[env] Loaded: .env.global, .env.api, .env.local
```

This helps verify the loading order and which files are being used.

## Migration from Root .env

If migrating from a single `.env` at root:

1. Split variables into:
   - `env/.env.global` - Shared config
   - `env/.env.[service]` - Service-specific
   - `env/.env.local` - Personal overrides

2. Update imports to use `@kit/env`

3. Remove root `.env` file

4. Test each service loads correctly
