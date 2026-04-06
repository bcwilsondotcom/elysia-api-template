# Default recipe: list all available commands
default:
    @just --list

# Start dev server with hot reload
dev:
    bun run --watch src/server.ts

# Start production server
start:
    NODE_ENV=production bun run src/server.ts

# Run all tests
test *args:
    bun test {{ args }}

# Run linter + formatter check
lint:
    bun x biome check src/ tests/

# Auto-fix lint + format issues
fix:
    bun x biome check --write src/ tests/

# TypeScript type check
typecheck:
    bun x tsc --noEmit

# Run full CI pipeline locally (typecheck + lint + test + build)
ci: typecheck lint test build

# Bundle for production
build:
    bun build src/index.ts --outdir=dist --target=bun

# Generate Drizzle migrations from schema changes
db-generate:
    bun x drizzle-kit generate

# Apply pending migrations
db-migrate:
    bun x drizzle-kit migrate

# Push schema directly to database (dev only)
db-push:
    bun x drizzle-kit push

# Open Drizzle Studio GUI
db-studio:
    bun x drizzle-kit studio

# Run k6 load test (requires k6 installed)
load-test:
    k6 run tests/load/smoke.js
