import { Settings2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { GanttView } from "@/components/gantt-view";
import { KanbanBoard } from "@/components/kanban-board";
import { ProjectViewTabs } from "@/components/project-view-tabs";
import { TaskListView } from "@/components/task-list-view";
import { TimelineView } from "@/components/timeline-view";
import { loadProjectTasks, loadWorkspaceMembers } from "@/lib/tasks";
import { loadWorkspaceData } from "@/lib/workspace";

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, SearchValue>>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const data = await loadWorkspaceData();
  if (!data) redirect("/onboarding");

  const project = data.projects.find((item) => item.id === projectId);
  if (!project) notFound();
  const requestedView = first(query.view);
  const activeView = requestedView === "list" || requestedView === "timeline" || requestedView === "gantt" ? requestedView : "kanban";

  const [tasks, members] = await Promise.all([loadProjectTasks(project.id), loadWorkspaceMembers(data)]);
  const parentTasks = tasks.filter((task) => !task.parentTaskId);
  const doneCount = parentTasks.filter((task) => task.status === "done").length;
  const activeCount = parentTasks.filter((task) => task.status === "in_progress").length;
  return (
    <AppShell data={data} currentProject={project} onSignOut={signOut}>
      <div className="page-container project-page">
        <div className="page-heading-row project-heading-row">
          <div className="page-heading">
            <p className="eyebrow">Project · {activeView === "kanban" ? "Kanban board" : activeView === "list" ? "List view" : activeView === "timeline" ? "Timeline view" : "Gantt chart"}</p>
            <h1>{project.name}</h1>
            <p>{project.description || "จัดการงาน ผู้รับผิดชอบ และกำหนดส่งของโปรเจกต์นี้"}</p>
          </div>
          {data.workspace.role === "admin" && (
            <div className="heading-actions">
              <Link href={`/projects/${project.id}/settings`} className="secondary-button"><Settings2 size={17} /> ตั้งค่าโปรเจกต์</Link>
            </div>
          )}
        </div>

        <ProjectViewTabs projectId={project.id} activeView={activeView} />

        <section className="task-summary" aria-label="สรุปงานในโปรเจกต์">
          <span><strong>{parentTasks.length}</strong> งานหลัก</span>
          <span><strong>{activeCount}</strong> กำลังทำ</span>
          <span><strong>{doneCount}</strong> เสร็จแล้ว</span>
          {data.workspace.role === "guest" && <span className="read-only-label">Guest · ดูอย่างเดียว</span>}
        </section>

        {activeView === "kanban" ? (
          <KanbanBoard
            projectId={project.id}
            initialTasks={tasks}
            members={members}
            currentUserId={data.user.id}
            role={data.workspace.role}
            demoMode={false}
            today={new Date().toISOString().slice(0, 10)}
            initialFilters={{
              q: first(query.q),
              priority: first(query.priority),
              assignee: first(query.assignee),
              mine: first(query.mine) === "true",
              task: first(query.task),
            }}
          />
        ) : activeView === "list" ? (
          <TaskListView
            projectId={project.id}
            initialTasks={tasks}
            members={members}
            currentUserId={data.user.id}
            role={data.workspace.role}
            demoMode={false}
            today={new Date().toISOString().slice(0, 10)}
            initialFilters={{
              q: first(query.q),
              status: first(query.status),
              priority: first(query.priority),
              assignee: first(query.assignee),
              mine: first(query.mine) === "true",
              sort: first(query.sort),
              task: first(query.task),
            }}
          />
        ) : activeView === "timeline" ? (
          <TimelineView
            projectId={project.id}
            initialTasks={tasks}
            members={members}
            currentUserId={data.user.id}
            role={data.workspace.role}
            today={new Date().toISOString().slice(0, 10)}
            initialFilters={{
              q: first(query.q),
              priority: first(query.priority),
              assignee: first(query.assignee),
              mine: first(query.mine) === "true",
              task: first(query.task),
              zoom: first(query.zoom),
            }}
          />
        ) : (
          <GanttView
            projectId={project.id}
            initialTasks={tasks}
            members={members}
            currentUserId={data.user.id}
            role={data.workspace.role}
            today={new Date().toISOString().slice(0, 10)}
            initialFilters={{
              q: first(query.q),
              priority: first(query.priority),
              assignee: first(query.assignee),
              mine: first(query.mine) === "true",
              task: first(query.task),
              zoom: first(query.zoom),
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
