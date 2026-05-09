import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/projects/$id")({ component: ProjectDetail });

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(150),
  description: z.string().max(1000).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().optional(),
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState<string>("none");
  const [due, setDue] = useState("");
  const [memberId, setMemberId] = useState<string>("");

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", id);
      if (error) throw error;
      return data;
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const userLabel = (uid: string | null | undefined) => {
    if (!uid) return "";
    const u = userMap.get(uid);
    return u ? u.full_name || u.email : "";
  };

  const isOwner = project?.created_by === user?.id;
  const canManage = role === "admin" || isOwner;

  const memberPool = [
    ...(project && userMap.get(project.created_by)
      ? [{ id: project.created_by, label: `${userLabel(project.created_by)} (owner)` }]
      : []),
    ...members
      .map((m) => ({ id: m.user_id, label: userLabel(m.user_id) }))
      .filter((m) => m.label),
  ];

  const createTask = async () => {
    const parsed = taskSchema.safeParse({
      title,
      description: desc,
      assigned_to: assignee === "none" ? null : assignee,
      due_date: due,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    const { error } = await supabase.from("tasks").insert({
      project_id: id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      assigned_to: parsed.data.assigned_to ?? null,
      due_date: parsed.data.due_date ? new Date(parsed.data.due_date).toISOString() : null,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Task created");
    setTaskOpen(false);
    setTitle(""); setDesc(""); setAssignee("none"); setDue("");
    qc.invalidateQueries({ queryKey: ["tasks", id] });
  };

  const updateStatus = async (taskId: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status: status as "pending" | "in_progress" | "completed" }).eq("id", taskId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks", id] });
    qc.invalidateQueries({ queryKey: ["all-tasks"] });
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks", id] });
  };

  const addMember = async () => {
    if (!memberId) return toast.error("Pick a user");
    const { error } = await supabase.from("project_members").insert({ project_id: id, user_id: memberId });
    if (error) return toast.error(error.message);
    toast.success("Member added");
    setMemberOpen(false);
    setMemberId("");
    qc.invalidateQueries({ queryKey: ["project-members", id] });
  };

  const removeMember = async (uid: string) => {
    const { error } = await supabase.from("project_members").delete().eq("project_id", id).eq("user_id", uid);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["project-members", id] });
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <Link to="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to projects
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project?.name ?? "…"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project?.description}</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Add member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter((u) => u.id !== project?.created_by && !members.find((m) => m.user_id === u.id))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <DialogFooter><Button onClick={addMember}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Assignee</Label>
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {memberPool.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due date</Label>
                    <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={createTask}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {members.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {members.map((m) => (
            <span key={m.user_id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
              {userLabel(m.user_id) || m.user_id.slice(0, 8)}
              {canManage && (
                <button onClick={() => removeMember(m.user_id)} className="text-muted-foreground hover:text-destructive">×</button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        {tasks.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No tasks yet.</div>
        ) : (
          tasks.map((t) => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
            const assigneeName = userLabel(t.assigned_to);
            return (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t.title}</div>
                  {t.description && <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{t.description}</div>}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {assigneeName && <span>👤 {assigneeName}</span>}
                    {t.due_date && <span>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
                    {isOverdue && <span className="font-medium text-destructive">Overdue</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <StatusBadge status={t.status} />
                  {(role === "admin" || t.created_by === user!.id) && (
                    <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
