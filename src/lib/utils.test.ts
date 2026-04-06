import { describe, expect, it } from "bun:test";
import { newId, requireEnv } from "./utils";

describe("newId", () => {
  it("returns a 26-character ULID", () => {
    const id = newId();
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-Z]{26}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
  });

  it("is time-sortable (later IDs sort after earlier ones)", async () => {
    const first = newId();
    await Bun.sleep(1); // ULIDs need at least 1ms difference
    const second = newId();
    expect(second > first).toBe(true);
  });
});

describe("requireEnv", () => {
  it("returns the value when env var exists", () => {
    process.env.TEST_REQUIRE_ENV = "hello";
    expect(requireEnv("TEST_REQUIRE_ENV")).toBe("hello");
    delete process.env.TEST_REQUIRE_ENV;
  });

  it("throws when env var is missing", () => {
    expect(() => requireEnv("DEFINITELY_NOT_SET_ABC123")).toThrow(
      "Missing required env var: DEFINITELY_NOT_SET_ABC123",
    );
  });

  it("throws when env var is empty string", () => {
    process.env.TEST_EMPTY = "";
    expect(() => requireEnv("TEST_EMPTY")).toThrow();
    delete process.env.TEST_EMPTY;
  });
});
