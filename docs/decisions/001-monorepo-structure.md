# ADR 001: Monorepo Structure with pnpm + Turborepo

**Status:** Accepted
**Date:** 2025-10-15
**Deciders:** Steven (with Claude Code)

## Context

We need to organize a SaaS starter kit that includes multiple applications (API, Web, Marketing) and shared packages (validation, database, auth, etc.). We want to maximize code reuse while maintaining clear boundaries and good developer experience.

## Decision

We will use a **monorepo** structure with:
- **pnpm workspaces** for package management
- **Turborepo** for build orchestration and caching
- **Workspace protocol** (`workspace:*`) for internal package dependencies

## Rationale

### Why Monorepo?

**Pros:**
- Single source of truth for shared code (validation, types, auth)
- Atomic commits across API and frontend
- Easier to refactor (all code in one place)
- Simplified dependency management
- Better for selling as a complete kit

**Cons Considered:**
- More complex build setup (mitigated by Turborepo)
- Potentially slower CI (mitigated by caching)
- Larger repository (acceptable for starter kit)

### Why pnpm?

**vs npm:**
- Faster installs (hard links, content-addressable storage)
- Strict dependency resolution (prevents phantom dependencies)
- Better workspace support
- Disk space efficient

**vs Yarn:**
- Faster
- Better workspace protocol support
- Simpler, more predictable

### Why Turborepo?

**vs pnpm alone:**
- **Build caching** - Only rebuild changed packages
- **Task orchestration** - Understands dependency graph
- **Parallel execution** - Smart parallelization
- **Remote caching** - Share cache across team/CI (optional)

**Real-world impact:**
```bash
# Without Turborepo
pnpm -r build  # Rebuilds everything: 2-3 minutes

# With Turborepo
turbo build    # Rebuilds only changed: 15 seconds
turbo build    # Second run with cache: instant
```

**Cost:**
- One config file (`turbo.json`)
- ~20MB dependency
- Minimal learning curve

**Benefit:**
- Massive speed improvements
- Better DX during development
- Faster CI/CD

## Package Structure

```
packages/
├── @kit/validation       # Shared Zod schemas
├── @kit/database         # DB client & migrations
├── @kit/auth             # Better Auth config
├── @kit/authorization    # CASL abilities
├── @kit/api-client       # Generated OpenAPI client
└── @kit/config           # Shared build configs
```

### Why `workspace:*` Protocol?

Ensures all packages always use local version:
```json
{
  "dependencies": {
    "@kit/validation": "workspace:*"  // Always local
  }
}
```

**Benefits:**
- No version skew between API and Web
- Simpler versioning (one version for whole kit)
- Atomic deployments
- No need to publish internally

## Consequences

### Positive
- ✅ Fast builds with caching
- ✅ Clear package boundaries
- ✅ Easy to share code
- ✅ Simple to version as a unit
- ✅ Great DX for development

### Negative
- ❌ Requires understanding of monorepo concepts
- ❌ Initial setup more complex than multi-repo
- ❌ CI needs to handle monorepo (not an issue with modern CI)

### Neutral
- Package changes require rebuilding consumers
- All packages versioned together (intentional choice)

## Alternatives Considered

### Multi-repo (Rejected)
**Pros:** Simple, independent versioning
**Cons:** Hard to share code, no atomic commits, version management nightmare

### Lerna (Rejected)
**Pros:** Established monorepo tool
**Cons:** Outdated, slower than pnpm, no build caching

### Nx (Rejected)
**Pros:** Powerful, comprehensive
**Cons:** Too complex for starter kit, heavier than Turborepo, opinionated structure

### pnpm alone (Rejected)
**Pros:** Simpler
**Cons:** No build caching, slower iterations, manual task orchestration

## Follow-up

- Set up Turbo cache in CI for faster builds
- Document monorepo best practices for contributors
- Create scripts for common operations

## References

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [Monorepo.tools](https://monorepo.tools/)
