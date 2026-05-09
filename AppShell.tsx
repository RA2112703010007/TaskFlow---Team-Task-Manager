import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, FolderKanban, Users, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/team", label: "Team", icon: Users, adminOnly: true },
];

function NavList({ onClick }: { onClick?: () => void }) {
  const { pathname } = useLocation();
  const { role } = useAuth();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav
        .filter((n) => !n.adminOnly || role === "admin")
        .map((n) => {
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-accent"
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const nav2 = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    nav2({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="h-7 w-7 rounded-md" style={{ background: "var(--gradient-brand)" }} />
          <span className="font-semibold">TaskFlow</span>
        </div>
        <NavList />
        <div className="mt-auto border-t border-sidebar-border p-3">
          <div className="px-2 py-2">
            <div className="truncate text-sm font-medium">{user?.email}</div>
            <div className="text-xs capitalize text-muted-foreground">{role ?? "—"}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <div className="h-7 w-7 rounded-md" style={{ background: "var(--gradient-brand)" }} />
                <span className="font-semibold">TaskFlow</span>
              </div>
              <NavList onClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">TaskFlow</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
