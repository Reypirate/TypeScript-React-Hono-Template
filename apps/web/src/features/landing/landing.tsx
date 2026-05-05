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
    description:
      "The API injects VITE_* values at runtime so one build can move across environments.",
  },
  {
    icon: Activity,
    title: "API docs",
    description:
      "OpenAPI JSON and a Scalar reference are available directly from the Hono service.",
  },
];

const stack = ["React 19", "Hono", "TanStack Router", "TanStack Query", "Drizzle", "pnpm", "Turbo"];

export function LandingPage() {
  return (
    <div className="space-y-10 py-10">
      <HeroSection />
      <HighlightsGrid />
      <StackBadges />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <Badge variant="secondary">Production-minded template</Badge>
        <div className="space-y-4">
          <h1 className="text-foreground max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            A full-stack React and Hono monorepo that is ready to ship.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-8">
            This keeps the scalable workspace layout while adding the deployment, API docs, runtime
            configuration, and quality gates expected from a mature starter.
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

      <WorkspaceCard />
    </section>
  );
}

function WorkspaceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Shape</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <WorkspaceItem
          description="Vite, React, TanStack Router, Query, and shadcn UI."
          icon={Workflow}
          title="apps/web"
        />
        <Separator />
        <WorkspaceItem
          description="Hono service with auth, runtime env, docs, and static serving."
          icon={Activity}
          title="apps/api"
        />
        <Separator />
        <WorkspaceItem
          description="Drizzle schema, singleton connection, and workspace exports."
          icon={Database}
          title="packages/db"
        />
      </CardContent>
    </Card>
  );
}

function WorkspaceItem({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof Workflow;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-primary mt-0.5 size-4" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function HighlightsGrid() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {highlights.map((item) => (
        <Card key={item.title}>
          <CardHeader>
            <item.icon className="text-primary mb-2 size-5" />
            <CardTitle className="text-base">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-6">
            {item.description}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function StackBadges() {
  return (
    <section className="flex flex-wrap gap-2">
      {stack.map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </section>
  );
}
