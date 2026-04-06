import { Elysia, t } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get(
    "/",
    () => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    }),
    {
      detail: { tags: ["Health"], summary: "Health check" },
      response: t.Object({
        status: t.Literal("ok"),
        timestamp: t.String(),
        version: t.String(),
      }),
    },
  )
  .get(
    "/ready",
    async () => {
      // TODO: Add DB ping, Redis ping, etc. when services are wired
      return { ready: true };
    },
    {
      detail: { tags: ["Health"], summary: "Readiness check" },
      response: t.Object({ ready: t.Boolean() }),
    },
  );
