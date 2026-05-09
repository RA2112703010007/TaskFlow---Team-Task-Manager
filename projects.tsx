import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/projects")({ component: Projects });

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  description: z.string().max(500).optional(),
});

function Projects() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, tasks(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = async () => {
    const parsed = projectSchema.safeParse({ name, description: desc });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    const { error } = await supabase
      .from("projects")
      .insert({ name: parsed.data.name, description: parsed.data.description ?? null, created_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setOpen(false);
    setName("");
    setDesc("");
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize work into projects.</p>
        </div>
        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pname">Name</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pdesc">Description</Label>
                  <Textarea id="pdesc" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="mt-10 text-center text-muted-foreground">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {role === "admin" ? "No projects yet. Create your first one." : "No projects assigned to you yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const count = (p.tasks as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <div
                key={p.id}
                className="group relative rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <Link to="/projects/$id" params={{ id: p.id }} className="block">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description || "No description"}
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground">{count} task{count === 1 ? "" : "s"}</div>
                </Link>
                {(role === "admin" || p.created_by === user!.id) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
