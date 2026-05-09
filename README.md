TaskFlow — Team Task Manager
=============================

A full-stack team task & project management web app.

STACK
-----
- Frontend: React 19 + TanStack Start (TanStack Router) + Tailwind CSS v4 + shadcn/ui
- Backend: Lovable Cloud (managed Postgres + Auth + RLS)
- Auth: JWT-based session auth (issued by Lovable Cloud Auth)
- DB: PostgreSQL with Row Level Security policies

FEATURES
--------
- Email + password signup / login (JWT sessions)
- Role-based access control: Admin & Member
  * The first user to sign up is automatically promoted to Admin
  * Admins can: create projects, add members to projects, change roles
  * Members can: view assigned projects, update task status
- Projects: create, view, delete
- Project membership: add/remove team members per project
- Tasks: create, assign, set due dates, change status
  * Statuses: Pending, In Progress, Completed
- Dashboard with: Total tasks, Completed, Pending, Overdue
- Protected routes via TanStack Router layout guards
- Form validation via Zod
- Responsive modern UI (sidebar on desktop, sheet menu on mobile)

DATABASE SCHEMA 
---------------------------------------------
- profiles(id, email, full_name)
- user_roles(user_id, role: admin|member)
- projects(id, name, description, created_by)
- project_members(project_id, user_id)
- tasks(id, project_id, title, description, status, assigned_to, due_date, created_by)

All tables have Row-Level Security enabled. Permissions are enforced at the
DB layer via RLS policies and a `has_role(user_id, role)` security-definer
function.

GETTING STARTED 
----------------------------
1. The app is already running in the Lovable preview.
2. Click "Get started" and sign up — your first account becomes the Admin.
3. Create a project from the Projects page.
4. Add team members from the project detail page.
5. Create tasks, assign them, and track status.

