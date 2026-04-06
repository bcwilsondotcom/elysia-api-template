import { Elysia } from "elysia";
import { createLogger } from "../lib/logger";

const log = createLogger({ module: "request" });

/** Logs method + path + status + duration for every request (skips health checks) */
export const requestLogger = new Elysia({ name: "request-logger" })
  .derive(() => ({ startTime: performance.now() }))
  .onAfterResponse(({ request, set, startTime }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/health")) return;
    const ms = Math.round((performance.now() - startTime) * 100) / 100;
    log.info(
      {
        method: request.method,
        path: url.pathname,
        status: set.status || 200,
        ms,
      },
      "request",
    );
  });
