import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,status,due_date,title,project_id,projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed",
  ).length;

  const stats = [
    { label: "Total tasks", value: total, icon: ListTodo, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of all your team's work.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`rounded-lg p-2 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Recent tasks</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          {tasks.slice(0, 8).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Create a project to get started.
            </div>
          ) : (
            tasks.slice(0, 8).map((t) => {
              const isOverdue =
                t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0"
                >
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {(t.projects as { name: string } | null)?.name ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isOverdue && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Overdue
                      </span>
                    )}
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary" },
    completed: { label: "Completed", cls: "bg-success/10 text-success" },
  };
  const m = map[status] ?? map.pending;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
