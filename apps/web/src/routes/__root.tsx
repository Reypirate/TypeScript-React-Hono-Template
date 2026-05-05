import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { NotFoundPage } from "../features/not-found/not-found";

export const Route = createRootRoute({
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
      <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-primary text-xl font-bold tracking-tight">
              Template
            </Link>
            <div className="flex gap-6">
              <Link
                to="/"
                className="hover:text-primary [&.active]:text-primary text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <a
                href="/api/scalar"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
              TypeScript React Hono
            </span>
          </div>
        </nav>
      </header>
      <main className="w-full flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-destructive mb-4 text-4xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-2 font-medium text-white transition-colors"
      >
        Try again
      </button>
    </div>
  ),
  notFoundComponent: NotFoundPage,
});
