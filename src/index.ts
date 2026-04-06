import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { serverTiming } from "@elysiajs/server-timing";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import pkg from "../package.json";
import { createLogger } from "./lib/logger";
import { requestId } from "./middleware/request-id";
import { requestLogger } from "./middleware/request-logger";
import { securityHeaders } from "./middleware/security-headers";
import { healthRoutes } from "./routes/health";

const log = createLogger({ module: "app" });

function parseCorsOrigins(): (string | RegExp)[] {
  const env = process.env.CORS_ORIGINS;
  if (!env) return [/localhost:\d+/];
  return env.split(",").map((o) => o.trim());
}

const app = new Elysia()
  .use(securityHeaders)
  .use(requestId)
  .use(opentelemetry())
  .use(serverTiming())
  .use(requestLogger)
  .use(
    cors({
      origin: parseCorsOrigins(),
      credentials: true,
    }),
  )
  .use(
    openapi({
      path: "/docs",
      // Type Gen: auto-generates OpenAPI schemas from TypeScript return types
      // No manual annotation needed — Drizzle, BetterAuth, Stripe types all documented automatically
      references: fromTypes(),
      documentation: {
        info: {
          title: pkg.name,
          version: pkg.version,
          description: pkg.description,
        },
      },
    }),
  )
  .use(
    rateLimit({
      max: 100,
      duration: 60_000,
      scoping: "global",
      generator: (req) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
    }),
  )
  .onError(({ code, error, set }) => {
    // Validation errors → 400 with clean message
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation failed" };
    }

    // Not found → 404
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }

    // Everything else → 500 with log
    log.error({ err: error, code }, "unhandled error");
    set.status = 500;
    return { error: "Internal server error" };
  })
  .use(healthRoutes);

// Export the app for Vercel + tests + Eden Treaty type inference
export default app;
export type App = typeof app;
