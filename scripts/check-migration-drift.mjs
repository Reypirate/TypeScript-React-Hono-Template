import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const databasePackage = join(root, "packages", "db");
const migrationDirectory = join(databasePackage, "drizzle");
const require = createRequire(join(databasePackage, "package.json"));

function snapshot() {
  if (!existsSync(migrationDirectory)) return "";
  return JSON.stringify(
    readdirSync(migrationDirectory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name);
        return [path, readFileSync(path, "utf8")];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

const before = snapshot();
const drizzleBin = join(dirname(require.resolve("drizzle-kit")), "bin.cjs");
const result = spawnSync(process.execPath, [drizzleBin, "generate"], {
  cwd: databasePackage,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: "postgres://postgres:password@localhost:5432/migration_check",
  },
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (before !== snapshot()) {
  console.error("Schema drift detected. Review and commit the files created by pnpm db:generate.");
  process.exit(1);
}
console.log("Schema and committed migrations agree.");
