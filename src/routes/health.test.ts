import { describe, expect, it } from "bun:test";
import app from "../index";

describe("Health Routes", () => {
  it("GET /health returns ok with timestamp and version", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it("GET /health/ready returns ready", async () => {
    const res = await app.handle(new Request("http://localhost/health/ready"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
  });
});

describe("OpenAPI", () => {
  it("GET /docs serves Scalar UI", async () => {
    const res = await app.handle(new Request("http://localhost/docs"));
    expect(res.status).toBe(200);
  });

  it("GET /docs/json returns valid OpenAPI spec", async () => {
    const res = await app.handle(new Request("http://localhost/docs/json"));
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
  });
});

describe("Error Handling", () => {
  it("404 for unknown routes", async () => {
    const res = await app.handle(new Request("http://localhost/nonexistent"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns consistent error shape", async () => {
    const res = await app.handle(new Request("http://localhost/nonexistent"));
    const body = await res.json();
    // All errors must have { error: string }
    expect(typeof body.error).toBe("string");
    expect(Object.keys(body)).toEqual(["error"]);
  });
});
