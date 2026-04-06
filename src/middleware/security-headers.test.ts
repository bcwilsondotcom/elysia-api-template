import { describe, expect, it } from "bun:test";
import app from "../index";

describe("Security Headers", () => {
  it("sets security headers on responses", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("x-xss-protection")).toBe("0");
  });

  it("does not set HSTS in non-production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const res = await app.handle(new Request("http://localhost/health"));
      expect(res.headers.get("strict-transport-security")).toBeNull();
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it("sets HSTS in production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await app.handle(new Request("http://localhost/health"));
      expect(res.headers.get("strict-transport-security")).toBe("max-age=63072000; includeSubDomains");
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
