import { describe, expect, it } from "bun:test";
import { audit } from "./audit";

describe("audit", () => {
  it("does not throw when called with valid entry", () => {
    expect(() =>
      audit({
        action: "create",
        resource: "booking",
        resourceId: "01ABC123",
        userId: "user-1",
        orgId: "org-1",
        meta: { source: "api" },
      }),
    ).not.toThrow();
  });

  it("works without optional fields", () => {
    expect(() =>
      audit({
        action: "delete",
        resource: "user",
        userId: "user-1",
      }),
    ).not.toThrow();
  });
});
