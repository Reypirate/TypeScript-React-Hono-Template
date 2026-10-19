import { createServerEnv } from "./env-config";

export const env = createServerEnv(process.env);

export type { ClientEnv, ServerEnv } from "./env-config";
