import { Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mb-8 max-w-md text-sm leading-6 text-muted-foreground">
        The route you opened does not exist in this template yet.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
