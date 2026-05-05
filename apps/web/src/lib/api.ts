import type { ApiRoutes } from "@repo/api";

import { hc } from "hono/client";

import { env } from "../env";

export const client = hc<ApiRoutes>(env.VITE_API_URL);
export const api = client.api;
