import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "../features/landing/landing";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
