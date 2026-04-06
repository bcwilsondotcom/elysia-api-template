# Elysia API Template

Production-ready API template. Fork this to start a new project.

## Stack

| Layer | Tool | Why |
|-------|------|-----|
| **Runtime** | [Bun](https://bun.sh) | Fast, native TypeScript |
| **Framework** | [Elysia](https://elysiajs.com) | Type-safe, OpenAPI-native, <2ms overhead |
| **Database** | [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech) | SQL-like, zero overhead, serverless Postgres |
| **Validation** | [drizzle-typebox](https://npmjs.com/drizzle-typebox) | DB schema → validation → OpenAPI in one step |
| **Auth** | [BetterAuth](https://better-auth.com) | Self-hosted, org/RBAC plugins, Elysia adapter |
| **Payments** | [Stripe](https://stripe.com) | Connect for marketplaces, standard for SaaS |
| **Docs** | [@elysiajs/openapi](https://elysiajs.com/plugins/openapi) + Type Gen | Auto-generated from TypeScript types — zero annotation |
| **Observability** | [@elysiajs/opentelemetry](https://elysiajs.com/patterns/opentelemetry) + [Server Timing](https://elysiajs.com/plugins/server-timing) | Traces + perf headers out of the box |
| **Logging** | [Pino](https://getpino.io) | Structured JSON logs (pretty in dev) |
| **Linting** | [Biome](https://biomejs.dev) | Lint + format, 100x faster than ESLint |
| **Deploy** | [Vercel](https://vercel.com) | Zero-config Elysia support, Fluid Compute |
| **CI** | GitHub Actions | Typecheck + lint + test + build + SAST (Semgrep) |

## Key Design Decisions

### Single Source of Truth
```
Drizzle table → drizzle-typebox → Elysia validation → OpenAPI docs → Eden Treaty client
```
Define a table once. Validation, documentation, and frontend types are all derived.

### OpenAPI Type Gen
Return types from route handlers are automatically converted to OpenAPI schemas.
No manual response annotations needed — Drizzle queries, BetterAuth types, Stripe objects all documented automatically.

### Global Error Handler
Validation errors return `{ error: string }` with 400 status. Built into the app from day 1.
No per-route error handling boilerplate.

### Dependency Notes

`@sinclair/typebox` is pinned to `0.34.49` via `overrides` in `package.json` to resolve a version conflict between `drizzle-typebox` and `@elysiajs/openapi`. Remove the override after both packages align on the same typebox version.

## Getting Started

```bash
# 1. Fork/clone this template
gh repo create my-api --template bcwilsondotcom/elysia-api-template --private --clone
cd my-api

# 2. Install deps
bun install

# 3. Configure
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

# 4. Run
bun run dev
```

API at `http://localhost:3000`. Docs at `/docs` (Scalar UI).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with hot reload |
| `bun run start` | Production start |
| `bun run typecheck` | TypeScript check |
| `bun run lint` | Biome lint + format check |
| `bun run lint:fix` | Auto-fix lint + format |
| `bun test` | Run tests |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:push` | Push schema directly (dev) |
| `bun run db:studio` | Drizzle Studio GUI |

## Project Structure

```
src/
├── index.ts              # Elysia app (exported for Vercel + tests + Eden)
├── server.ts             # Standalone server entry
├── db/
│   └── schema.ts         # Drizzle table definitions (single source of truth)
├── lib/
│   ├── db.ts             # Neon database connection (lazy-init)
│   ├── db.test.ts        # Unit tests: lazy init, missing DATABASE_URL
│   ├── logger.ts         # Pino structured logging
│   ├── utils.ts          # IDs, env, shared types
│   └── utils.test.ts     # Unit tests: ULID, requireEnv
├── middleware/
│   ├── audit.ts          # Audit logging helper
│   ├── audit.test.ts     # Unit tests: audit entries
│   └── request-logger.ts # HTTP request logger (method/path/status/ms)
└── routes/
    ├── health.ts         # Health + readiness endpoints
    └── health.test.ts    # Integration tests via app.handle()
tests/
├── contract/
│   └── openapi.test.ts   # Contract tests: responses match OpenAPI spec
└── load/
    └── smoke.js          # k6 load test (5 VUs, p95<200ms)
```

**Test convention:** `*.test.ts` co-located next to source files. Cross-cutting tests (contract, load) stay in `tests/`.

## Adding a Route

```typescript
// src/routes/bookings.ts
import { Elysia, t } from "elysia";
import { getDb } from "../lib/db";
import { bookings } from "../db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

// Derive validation from DB schema — no manual Zod/TypeBox definitions
const insertBooking = createInsertSchema(bookings);
const selectBooking = createSelectSchema(bookings);

export const bookingRoutes = new Elysia({ prefix: "/bookings" })
  .post("/", ({ body }) => getDb().insert(bookings).values(body).returning(), {
    body: insertBooking,
    response: t.Array(selectBooking),
    detail: { tags: ["Bookings"], summary: "Create booking" },
  });
```

Then add to `src/index.ts`:
```typescript
import { bookingRoutes } from "./routes/bookings";
// ...
.use(bookingRoutes)
```

The route is now:
- ✅ Validated (input matches DB schema)
- ✅ Type-safe (body and response fully typed)
- ✅ Documented (OpenAPI + Scalar UI)
- ✅ Ready for Eden Treaty (frontend gets types for free)

## Frontend Integration (Eden Treaty)

```typescript
// In your frontend project
import { treaty } from "@elysiajs/eden";
import type { App } from "your-api-package"; // or import from shared types

const api = treaty<App>("https://api.yourapp.com");

// Fully typed — autocomplete for routes, params, body, response
const { data, error } = await api.bookings.post({ guestName: "Jane" });
```

No code generation. No Orval. No OpenAPI → client pipeline. Just import the type.

## Forking for a New Project

1. Fork or use as GitHub template
2. Update `package.json` name/description
3. Set `CORS_ORIGINS` in your environment (comma-separated allowed origins)
4. Update OpenAPI title/description in `src/index.ts`
5. Add your DB schema in `src/db/schema.ts`
6. Wire up BetterAuth (org plugin for multi-tenant)
7. Add routes in `src/routes/`
8. Set up Vercel project + environment variables
