import { beforeAll, describe, expect, it } from "bun:test";
import app from "../../src/index";

/**
 * Contract tests validate that API responses match the OpenAPI spec.
 *
 * These catch schema drift: if a route returns fields that don't match
 * the documented spec, these tests fail. Critical when frontends
 * depend on the API's types via Eden Treaty.
 */

interface SchemaObject {
  type?: string;
  const?: unknown;
  enum?: unknown[];
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
}

interface PathItem {
  [method: string]: {
    responses: Record<string, { content?: Record<string, { schema: SchemaObject }> }>;
  };
}

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, PathItem>;
}

let spec: OpenAPISpec;

/** Look up a path in the spec, handling trailing slash differences */
function findPath(path: string): PathItem | undefined {
  return spec.paths[path] || spec.paths[`${path}/`] || spec.paths[path.replace(/\/$/, "")];
}

/** Get the 200 response schema for a GET endpoint */
function getResponseSchema(path: string): SchemaObject | undefined {
  const pathItem = findPath(path);
  return pathItem?.get?.responses?.["200"]?.content?.["application/json"]?.schema;
}

/** Validate primitive types */
function validatePrimitive(value: unknown, schema: SchemaObject, path: string): string[] {
  if (schema.type === "string" && typeof value !== "string") return [`${path}: expected string, got ${typeof value}`];
  if (schema.type === "boolean" && typeof value !== "boolean")
    return [`${path}: expected boolean, got ${typeof value}`];
  if (schema.type === "number" && typeof value !== "number") return [`${path}: expected number, got ${typeof value}`];
  return [];
}

/** Validate an object against its schema */
function validateObject(value: unknown, schema: SchemaObject, path: string): string[] {
  if (typeof value !== "object" || value === null) return [`${path}: expected object, got ${typeof value}`];
  const errors: string[] = [];
  const obj = value as Record<string, unknown>;
  for (const req of schema.required || []) {
    if (!(req in obj)) errors.push(`${path}.${req}: required field missing`);
  }
  for (const [key, propSchema] of Object.entries(schema.properties || {})) {
    if (key in obj) errors.push(...validateSchema(obj[key], propSchema, `${path}.${key}`));
  }
  return errors;
}

/** Validate an array against its schema */
function validateArray(value: unknown, schema: SchemaObject, path: string): string[] {
  if (!Array.isArray(value)) return [`${path}: expected array, got ${typeof value}`];
  if (!schema.items) return [];
  return value.flatMap((item, i) => validateSchema(item, schema.items as SchemaObject, `${path}[${i}]`));
}

/** Validate a value against a JSON Schema-like object */
function validateSchema(value: unknown, schema: SchemaObject, path = ""): string[] {
  if (schema.const !== undefined) {
    return value === schema.const
      ? []
      : [`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`];
  }
  if (schema.enum) {
    return schema.enum.includes(value)
      ? []
      : [`${path}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`];
  }
  if (schema.type === "object") return validateObject(value, schema, path);
  if (schema.type === "array") return validateArray(value, schema, path);
  return validatePrimitive(value, schema, path);
}

/** Assert response body matches its OpenAPI schema */
function assertMatchesSpec(body: unknown, schema: SchemaObject | undefined, label: string) {
  expect(schema).toBeDefined();
  const errors = validateSchema(body, schema as SchemaObject);
  if (errors.length > 0) {
    throw new Error(`${label} schema violations:\n${errors.join("\n")}`);
  }
}

beforeAll(async () => {
  const res = await app.handle(new Request("http://localhost/docs/json"));
  spec = await res.json();
});

describe("Contract: responses match OpenAPI spec", () => {
  it("GET /health response matches spec", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    assertMatchesSpec(await res.json(), getResponseSchema("/health"), "/health");
  });

  it("GET /health/ready response matches spec", async () => {
    const res = await app.handle(new Request("http://localhost/health/ready"));
    assertMatchesSpec(await res.json(), getResponseSchema("/health/ready"), "/health/ready");
  });

  it("all documented paths are reachable", async () => {
    const paths = Object.keys(spec.paths || {});
    expect(paths.length).toBeGreaterThan(0);

    for (const path of paths) {
      for (const method of Object.keys(spec.paths[path])) {
        if (method === "parameters") continue;
        const res = await app.handle(new Request(`http://localhost${path}`, { method: method.toUpperCase() }));
        expect(res.status).not.toBe(404);
      }
    }
  });

  it("spec has required info fields", () => {
    expect(spec.info.title).toBeDefined();
    expect(spec.info.version).toBeDefined();
    expect(spec.openapi).toMatch(/^3\./);
  });
});
