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
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.headers.get("strict-transport-security")).toBeNull();
  });
});
