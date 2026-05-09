import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/team")({ component: Team });

type RoleVal = "admin" | "member";

function Team() {
  const { role, user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (role && role !== "admin") nav({ to: "/dashboard" });
  }, [role, nav]);

  const { data: members = [] } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role as RoleVal | undefined,
      }));
    },
    enabled: role === "admin",
  });

  const setRole = async (uid: string, newRole: RoleVal) => {
    await supabase.from("user_roles").delete().eq("user_id", uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["team"] });
  };

  if (role !== "admin") return null;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="text-3xl font-bold tracking-tight">Team</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage members and their roles.</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-b-0">
            <div>
              <div className="font-medium">{m.full_name || m.email}</div>
              <div className="text-xs text-muted-foreground">{m.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {m.id === user?.id ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                  {m.role} (you)
                </span>
              ) : (
                <Select value={m.role ?? "member"} onValueChange={(v) => setRole(m.id, v as RoleVal)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No members yet.</div>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Tip: New users sign up via the auth page. Share the app URL with your teammates.
      </p>
      <div className="mt-4">
        <Button variant="outline" asChild>
          <a href="/auth?mode=signup" target="_blank" rel="noreferrer">Open signup link</a>
        </Button>
      </div>
    </div>
  );
}
