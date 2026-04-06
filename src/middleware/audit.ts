import { createLogger } from "../lib/logger";

const log = createLogger({ module: "audit" });

interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  orgId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Log an audit event.
 * TODO: When you have a schema, persist to an audit_log table.
 * For now, structured logs go to your log aggregator.
 */
export function audit(entry: AuditEntry) {
  log.info(entry, "audit");
}
