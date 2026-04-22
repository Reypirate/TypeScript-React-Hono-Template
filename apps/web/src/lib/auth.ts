import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.location.origin, // Assumes API is on the same origin or proxied
});

export const { signIn, signUp, useSession, signOut } = authClient;
