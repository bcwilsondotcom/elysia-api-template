import { Elysia } from "elysia";
import { newId } from "../lib/utils";

export const requestId = new Elysia({ name: "request-id" })
  .onRequest(({ set }) => {
    const id = newId();
    set.headers["x-request-id"] = id;
  })
  .as("plugin")
  .derive(({ set }) => {
    return { requestId: set.headers["x-request-id"] as string };
  })
  .as("plugin");
