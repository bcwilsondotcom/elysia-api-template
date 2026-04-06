import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? { formatters: { level: (label: string) => ({ level: label }) } }
    : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});

export function createLogger(bindings: Record<string, unknown>) {
  return baseLogger.child(bindings);
}

export { baseLogger as logger };
