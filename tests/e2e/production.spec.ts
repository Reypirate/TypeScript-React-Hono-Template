import { expect, test } from "@playwright/test";

test("production frontend renders with runtime configuration and working assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const runtime = page.waitForResponse((response) => response.url().endsWith("/api/runtime.js"));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A full-stack React and Hono monorepo/u }),
  ).toBeVisible();
  expect((await runtime).status()).toBe(200);
  expect(await page.evaluate(() => window.__env?.VITE_API_URL)).toBe("http://127.0.0.1:4101");
  await expect(page.getByRole("link", { name: "API reference", exact: true })).toHaveAttribute(
    "href",
    "/api/scalar",
  );
  expect(errors).toEqual([]);
});

test("direct frontend deep links render the router's not-found page and recover", async ({
  page,
}) => {
  await page.goto("/missing/deep-link");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go home" }).click();
  await expect(
    page.getByRole("heading", { name: /A full-stack React and Hono monorepo/u }),
  ).toBeVisible();
});

test("production API returns JSON 404s, session refusals, and its OpenAPI document", async ({
  request,
}) => {
  const missing = await request.get("/api/does-not-exist");
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ error: "Not Found" });
  const protectedProfile = await request.get("/api/me");
  expect(protectedProfile.status()).toBe(401);
  expect(protectedProfile.headers()["cache-control"]).toBe("no-store");
  const openapi = await request.get("/api/openapi");
  expect(await openapi.json()).toMatchObject({ openapi: "3.1.0", paths: { "/api/me": {} } });
  const docs = await request.get("/api/scalar");
  expect(docs.status()).toBe(200);
  expect(await docs.text()).toContain('data-url="/api/openapi"');
});

test("runtime settings remain public and uncached in the production bundle", async ({
  request,
}) => {
  const response = await request.get("/api/runtime.js");
  expect(response.headers()["cache-control"]).toBe("no-store");
  const script = await response.text();
  expect(script).not.toContain("BETTER_AUTH_SECRET");
  expect(script).not.toContain("DATABASE_URL");
  expect(script).toContain("VITE_APP_URL");
});
