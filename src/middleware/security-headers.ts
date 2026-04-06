import { Elysia } from "elysia";

export const securityHeaders = new Elysia({ name: "security-headers" }).onRequest(({ set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["x-frame-options"] = "DENY";
  set.headers["x-xss-protection"] = "0";
  set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
  if (process.env.NODE_ENV === "production") {
    set.headers["strict-transport-security"] = "max-age=63072000; includeSubDomains";
  }
});
