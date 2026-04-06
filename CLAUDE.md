# CLAUDE.md

This is an Elysia + Bun API. When working in this codebase, follow these conventions exactly.

## Commands

```bash
just dev          # Start dev server (hot reload)
just start        # Start production server
just build        # Bundle for production
just test         # Run tests
just lint         # Check lint + formatting
just fix          # Auto-fix lint + formatting
just typecheck    # TypeScript check
just ci           # Full CI locally: typecheck + lint + test + build
just db-generate  # Generate migrations after schema changes
just db-migrate   # Apply pending migrations
just db-push      # Push schema to DB (dev only)
just db-studio    # Open Drizzle Studio GUI
just load-test    # Run k6 load test (requires k6)
```

Always run `just ci` before pushing or creating a PR.

## Architecture

```
Drizzle table → drizzle-typebox → Elysia validation → OpenAPI docs → Eden Treaty types
```

Define a table once in `src/db/schema.ts`. Everything else is derived.

## Key Patterns

### Database access

Use `getDb()` — never import a raw `db` object:

```typescript
import { getDb } from "../lib/db";
const users = await getDb().select().from(usersTable);
```

### Adding a route

1. Define tables in `src/db/schema.ts`
2. Create route file in `src/routes/`
3. Derive validation from the DB schema — never write manual TypeBox/Zod schemas:

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
const insertUser = createInsertSchema(users);
const selectUser = createSelectSchema(users);
```

4. Every route needs `body` (for POST/PUT), `response`, and `detail` with tags + summary:

```typescript
import { Elysia, t } from "elysia";
import { getDb } from "../lib/db";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

.post("/", ({ body }) => getDb().insert(users).values(body).returning(), {
  body: insertUser,
  response: t.Array(selectUser),
  detail: { tags: ["Users"], summary: "Create user" },
})
```

5. Register in `src/index.ts` with `.use(yourRoutes)` — add it before `.use(healthRoutes)`

### IDs

Use `newId()` from `src/lib/utils.ts` for all primary keys (generates ULIDs — time-sortable, globally unique).

### Logging

Use the structured logger, not `console.log`:

```typescript
import { createLogger } from "../lib/logger";
const log = createLogger({ module: "your-module" });
log.info({ userId }, "user created");
```

### Error responses

All errors return `{ error: string }`. The global error handler in `src/index.ts` handles validation (400), not found (404), and server errors (500). Throw `Error` or use Elysia's `error()` for custom status codes.

### Audit logging

Use `audit()` from `src/middleware/audit.ts` for any action that changes data:

```typescript
import { audit } from "../middleware/audit";
audit({ action: "create", resource: "booking", resourceId: id, userId });
```

### Environment variables

Prefer `requireEnv()` for new required vars — it throws with a clear message if missing. Existing code may still read `process.env.X` directly and validate manually. Optional vars use `process.env.X` with a fallback.

## Testing

- Co-locate tests next to source: `foo.ts` → `foo.test.ts`
- Cross-cutting tests go in `tests/` (contract, load)
- Test routes via `app.handle()` — no HTTP server needed:

```typescript
import app from "../index";
const res = await app.handle(new Request("http://localhost/your-route"));
```

- Every new route needs a contract test in `tests/contract/openapi.test.ts` verifying the response matches the OpenAPI spec

## File Conventions

| What | Where |
|------|-------|
| DB tables | `src/db/schema.ts` |
| Routes | `src/routes/<resource>.ts` |
| Shared utilities | `src/lib/` |
| Middleware | `src/middleware/` |
| Unit tests | Next to source file (`*.test.ts`) |
| Contract tests | `tests/contract/` |
| Load tests | `tests/load/` |

## Don'ts

- Don't use `any` — Biome will error
- Don't write manual validation schemas — derive from Drizzle tables
- Don't use `console.log` — use the Pino logger
- Don't add routes without `detail` tags — they won't appear in the OpenAPI docs
- Don't import from `../lib/db` as `db` — use `getDb()` function
- Don't hardcode CORS origins — use the `CORS_ORIGINS` env var
- Don't skip `just ci` before pushing
