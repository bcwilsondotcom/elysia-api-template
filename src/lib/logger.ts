import { createRequire } from "node:module";
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

function createTransport() {
  if (isProduction) return undefined;
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return { target: "pino-pretty", options: { colorize: true } };
  } catch {
    return undefined;
  }
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? { formatters: { level: (label: string) => ({ level: label }) } }
    : { transport: createTransport() }),
});

export function createLogger(bindings: Record<string, unknown>) {
  return baseLogger.child(bindings);
}

export { baseLogger as logger };
