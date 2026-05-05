import { describe, expect, it } from "vitest";

import { UserSchema } from "./index";

describe("UserSchema", () => {
  it("accepts the shared Better Auth user shape", () => {
    const parsed = UserSchema.parse({
      id: "user_1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(parsed.email).toBe("ada@example.com");
  });
});
