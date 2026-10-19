import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const profileSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Enter a valid email" })),
  contacts: z.array(z.object({ name: z.string().min(1, "Enter a contact name") })),
});
const resolveProfile = zodResolver(profileSchema);
const options = { fields: {}, shouldUseNativeValidation: false };

describe("Zod and React Hook Form resolver compatibility", () => {
  it("returns parsed values including schema transformations", async () => {
    const result = await resolveProfile(
      { email: " ada@example.com ", contacts: [{ name: "Ada" }] },
      undefined,
      options,
    );
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ email: "ada@example.com", contacts: [{ name: "Ada" }] });
  });

  it("maps validation errors to ordinary and nested array fields", async () => {
    const result = await resolveProfile(
      { email: "invalid", contacts: [{ name: "" }] },
      undefined,
      options,
    );
    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      email: { message: "Enter a valid email" },
      contacts: [{ name: { message: "Enter a contact name" } }],
    });
  });
});
