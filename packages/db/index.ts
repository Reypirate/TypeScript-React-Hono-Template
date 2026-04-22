import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

let client: postgres.Sql | null = null;

export const createDb = (url: string) => {
  if (!client) {
    client = postgres(url);
  }
  return drizzle(client, { schema });
};

export { schema };
export * from "drizzle-orm";
