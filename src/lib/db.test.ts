import { afterEach, describe, expect, it } from "bun:test";
import { getDb } from "./db";

describe("getDb", () => {
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    // Restore env
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("throws when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDb()).toThrow("DATABASE_URL is required");
  });

  it("throws when DATABASE_URL is empty", () => {
    process.env.DATABASE_URL = "";
    expect(() => getDb()).toThrow("DATABASE_URL is required");
  });
});
