import type { createDb } from "./index";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { fileURLToPath } from "node:url";

export function migrateDb(database: ReturnType<typeof createDb>, migrationsSchema = "drizzle") {
  return migrate(database, {
    migrationsFolder: fileURLToPath(new URL("./drizzle/", import.meta.url)),
    migrationsSchema,
  });
}
