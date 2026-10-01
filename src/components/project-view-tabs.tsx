"use client";

import { CalendarRange, ChartNoAxesGantt, KanbanSquare, ListTree } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackProductEvent } from "@/lib/analytics";

type ProjectViewTabsProps = {
  projectId: string;
  activeView: "kanban" | "list" | "timeline" | "gantt";
};

export function ProjectViewTabs({ projectId, activeView }: ProjectViewTabsProps) {
  const searchParams = useSearchParams();

  const viewHref = (view: "kanban" | "list" | "timeline" | "gantt") => {
    const params = new URLSearchParams();
    params.set("view", view);
    for (const key of ["q", "priority", "assignee", "mine", "task"] as const) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    if (view === "list") {
      for (const key of ["status", "sort"] as const) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
    }
    if (view === "timeline" || view === "gantt") {
      const zoom = searchParams.get("zoom");
      if (zoom) params.set("zoom", zoom);
    }
    return `/projects/${projectId}?${params}` as Route;
  };

  return (
    <nav className="view-tabs" aria-label="มุมมองโปรเจกต์">
      <Link href={viewHref("kanban")} onClick={() => trackProductEvent("view_changed", { from_view: activeView, to_view: "kanban" })} className={`view-tab ${activeView === "kanban" ? "active" : ""}`} aria-current={activeView === "kanban" ? "page" : undefined}><KanbanSquare size={17} /> บอร์ดคัมบัง</Link>
      <Link href={viewHref("list")} onClick={() => trackProductEvent("view_changed", { from_view: activeView, to_view: "list" })} className={`view-tab ${activeView === "list" ? "active" : ""}`} aria-current={activeView === "list" ? "page" : undefined}><ListTree size={17} /> รายการงาน</Link>
      <Link href={viewHref("timeline")} onClick={() => trackProductEvent("view_changed", { from_view: activeView, to_view: "timeline" })} className={`view-tab ${activeView === "timeline" ? "active" : ""}`} aria-current={activeView === "timeline" ? "page" : undefined}><CalendarRange size={17} /> ไทม์ไลน์</Link>
      <Link href={viewHref("gantt")} onClick={() => trackProductEvent("view_changed", { from_view: activeView, to_view: "gantt" })} className={`view-tab ${activeView === "gantt" ? "active" : ""}`} aria-current={activeView === "gantt" ? "page" : undefined}><ChartNoAxesGantt size={17} /> แผนภูมิแกนต์</Link>
    </nav>
  );
}
