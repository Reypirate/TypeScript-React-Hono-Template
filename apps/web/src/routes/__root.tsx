import { NotFoundPage } from "../features/not-found/not-found";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-primary">
              Template
            </Link>
            <div className="flex gap-6">
              <Link
                to="/"
                className="text-sm font-medium hover:text-primary transition-colors [&.active]:text-primary"
              >
                Home
              </Link>
              <a
                href="/api/scalar"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                API Docs
              </a>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              TypeScript React Hono
            </span>
          </div>
        </nav>
      </header>
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  ),
  notFoundComponent: NotFoundPage,
});
