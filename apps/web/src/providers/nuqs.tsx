import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

export function NuqsProvider({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
