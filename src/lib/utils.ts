import { ulid } from "ulid";

/** Generate a ULID (time-sortable unique ID) */
export function newId(): string {
  return ulid();
}

/** Standard error shape returned by all error responses */
export interface ApiError {
  error: string;
}

/** Standard paginated response wrapper */
export interface Paginated<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

/** Pick non-undefined env var or throw */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}
