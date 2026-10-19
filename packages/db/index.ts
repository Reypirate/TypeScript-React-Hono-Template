import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";

export const createDb = (url: string, options?: postgres.Options<Record<string, never>>) => {
  return drizzle(postgres(url, options), { schema });
};

export { schema };
export * from "drizzle-orm";
