import { Activity, Boxes, Database, FileJson, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

const highlights = [
  {
    icon: Boxes,
    title: "Monorepo first",
    description: "Apps and packages stay independently owned while Turbo handles orchestration.",
  },
  {
    icon: ShieldCheck,
    title: "Auth ready",
    description: "Better Auth, Drizzle tables, secure headers, and credentialed CORS are wired in.",
  },
  {
    icon: FileJson,
    title: "Runtime config",
    description: "The API injects VITE_* values at runtime so one build can move across environments.",
  },
  {
    icon: Activity,
    title: "API docs",
    description: "OpenAPI JSON and a Scalar reference are available directly from the Hono service.",
  },
];

const stack = ["React 19", "Hono", "TanStack Router", "TanStack Query", "Drizzle", "pnpm", "Turbo"];

export function LandingPage() {
  return (
    <div className="space-y-10 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary">Production-minded template</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              A full-stack React and Hono monorepo that is ready to ship.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              This keeps the scalable workspace layout while adding the deployment, API docs,
              runtime configuration, and quality gates expected from a mature starter.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/api/scalar">API reference</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/health">Health check</a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Shape</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Workflow className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">apps/web</p>
                <p className="text-muted-foreground">Vite, React, TanStack Router, Query, and shadcn UI.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">apps/api</p>
                <p className="text-muted-foreground">Hono service with auth, runtime env, docs, and static serving.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">packages/db</p>
                <p className="text-muted-foreground">Drizzle schema, singleton connection, and workspace exports.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <item.icon className="mb-2 size-5 text-primary" />
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {item.description}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        {stack.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </section>
    </div>
  );
}
