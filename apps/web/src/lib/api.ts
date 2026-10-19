import type { ApiRoutes } from "@repo/api/types";

import { hc } from "hono/client";

import { env } from "../env";

export const client = hc<ApiRoutes>(env.VITE_API_URL, {
  init: { credentials: "include" },
});
export const api = client.api;
