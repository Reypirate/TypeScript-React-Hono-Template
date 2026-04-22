import { z } from "zod";

// Base User Schema for the template
// This matches the database 'user' table but is decoupled for the frontend
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().optional().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type User = z.infer<typeof UserSchema>;

// Example of how to add more shared schemas
// export const CreateProfileSchema = z.object({ ... })
