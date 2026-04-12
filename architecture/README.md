# Invictus AI — Architecture Documentation

> Comprehensive architecture reference for the Invictus AI wealth management platform.
> These documents describe both the **current state** and the **target architecture** for the full-stack platform.

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Platform Overview](01-platform-overview.md) | Vision, module catalog, tech stack, deployment model |
| 02 | [Module Architecture](02-module-architecture.md) | Module definition, boundaries, registry, directory structure |
| 03 | [Frontend Architecture](03-frontend-architecture.md) | React SPA structure, modularity, lazy loading, shared code |
| 04 | [Backend Architecture](04-backend-architecture.md) | Server framework, service layer, middleware, background jobs |
| 05 | [Database Architecture](05-database-architecture.md) | Schema design, multi-tenancy, entity models, migrations |
| 06 | [API Design](06-api-design.md) | REST conventions, auth headers, pagination, real-time APIs |
| 07 | [Administration & RBAC](07-administration-and-rbac.md) | Auth flow, roles, permissions, multi-tenant isolation |
| 08 | [Cross-Module Integration](08-cross-module-integration.md) | Integration patterns, event bus, shared contracts, Deals integration |
| 09 | [Routing & Navigation](09-routing-and-navigation.md) | URL structure, route guards, sidebar behavior |
| 10 | [State Management](10-state-management.md) | Zustand stores, caching, real-time sync |
| 11 | [Infrastructure & Deployment](11-infrastructure-and-deployment.md) | Hosting, CI/CD, environments, monitoring, security |
| 12 | [AI Integration](12-ai-integration.md) | LLM orchestration, agent runtime, knowledge base, AI features per module |

## How to Read

- **New to the project?** Read documents 01 and 02 first for the big picture, then dive into specific areas.
- **Building a module?** Read 02 (module architecture), then the relevant stack doc (03 for frontend, 04 for backend, 05 for database).
- **Working on auth/permissions?** Start with 07 (Administration & RBAC).
- **Integrating modules?** Read 08 (Cross-Module Integration).

## Diagrams

Architecture diagrams are stored in the [`diagrams/`](diagrams/) directory.
