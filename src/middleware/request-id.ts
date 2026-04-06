import { Elysia } from "elysia";
import { newId } from "../lib/utils";

/** Generates a ULID request ID and sets x-request-id on every response. */
export const requestId = new Elysia({ name: "request-id" }).onRequest(({ set }) => {
  set.headers["x-request-id"] = newId();
});
