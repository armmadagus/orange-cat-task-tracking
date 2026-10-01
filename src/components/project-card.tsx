import { ArrowUpRight, CalendarDays, FolderKanban, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { ProjectSummary } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const updated = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(project.updated_at));

  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="project-icon" style={{ color: project.color ?? "#0B63F6" }}>
          <FolderKanban size={21} />
        </span>
        <button className="icon-button" type="button" aria-label={`ตัวเลือก ${project.name}`}>
          <MoreHorizontal size={19} />
        </button>
      </div>
      <div>
        <h3>{project.name}</h3>
        <p>{project.description || "ยังไม่มีรายละเอียดโปรเจกต์"}</p>
      </div>
      <div className="project-card-meta">
        <span><CalendarDays size={15} /> อัปเดต {updated}</span>
        <Link href={`/projects/${project.id}`} aria-label={`เปิด ${project.name}`}>
          เปิดโปรเจกต์ <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="project-accent" style={{ background: project.color ?? "#64748B" }} />
    </article>
  );
}
