import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, Users, LayoutDashboard, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-brand)" }} />
          <span className="text-lg font-semibold">TaskFlow</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
          </Button>
        </div>
      </header>

      <section className="px-6 pt-16 pb-24 text-center md:px-10 md:pt-24">
        <div
          className="mx-auto inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          Team task management, reimagined
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Ship work together with{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            clarity & speed
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Plan projects, assign tasks, and track progress in one beautiful workspace built for modern teams.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-4 md:px-10">
        {[
          { icon: LayoutDashboard, t: "Smart dashboard", d: "See totals, completed, pending & overdue at a glance." },
          { icon: CheckCircle2, t: "Task tracking", d: "Pending, in progress, completed — with due dates." },
          { icon: Users, t: "Team management", d: "Invite members and assign work to the right people." },
          { icon: ShieldCheck, t: "Roles & access", d: "Admin and member roles with secure permissions." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
