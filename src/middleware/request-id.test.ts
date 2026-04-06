import { describe, expect, it } from "bun:test";
import app from "../index";

describe("Request ID", () => {
  it("returns x-request-id header on every response", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    const id = res.headers.get("x-request-id");
    expect(id).toBeDefined();
    expect(id).toHaveLength(26); // ULID length
  });

  it("generates unique IDs per request", async () => {
    const res1 = await app.handle(new Request("http://localhost/health"));
    const res2 = await app.handle(new Request("http://localhost/health"));
    expect(res1.headers.get("x-request-id")).not.toBe(res2.headers.get("x-request-id"));
  });
});
