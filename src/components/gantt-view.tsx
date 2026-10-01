"use client";

import { AlertCircle, CalendarClock, ChevronDown, ChevronRight, CircleCheck, FilterX, Search, UserRound, X } from "lucide-react";
import { useMemo, useRef, useState, useTransition, type CSSProperties, type PointerEvent as ReactPointerEvent, type UIEvent } from "react";
import { useRouter } from "next/navigation";
import { createTask, softDeleteTask, updateTask } from "@/app/tasks/actions";
import { TaskDrawer } from "@/components/task-list-view";
import { trackProductEvent } from "@/lib/analytics";
import {
  calculateTaskProgress,
  createDateGrid,
  dateToDayIndex,
  dateToPixel,
  formatThaiDate,
  getTaskDateRange,
  moveTaskDates,
  resizeTaskDates,
  type TimelineZoom,
} from "@/lib/date-grid";
import type { MemberOption, TaskMutationInput, TaskPriority, TaskRecord, WorkspaceRole } from "@/lib/types";

type GanttFilters = { q?: string; priority?: string; assignee?: string; mine?: boolean; task?: string; zoom?: string };
type GanttViewProps = {
  projectId: string;
  initialTasks: TaskRecord[];
  members: MemberOption[];
  currentUserId: string;
  role: WorkspaceRole;
  today: string;
  initialFilters?: GanttFilters;
};
type GanttRow = { task: TaskRecord; child: boolean; progress: number };

const ROW_HEIGHT = 56;
const WINDOW_THRESHOLD = 200;
const OVERSCAN = 12;
const priorityLabels: Record<TaskPriority, string> = { low: "ต่ำ", medium: "ปานกลาง", high: "สูง" };
const statusLabels = { todo: "ต้องทำ", in_progress: "กำลังทำ", done: "เสร็จแล้ว" } as const;

function ganttStyle(totalWidth: number, dayWidth: number): CSSProperties {
  return { "--timeline-grid-width": `${totalWidth}px`, "--timeline-day-width": `${dayWidth}px` } as CSSProperties;
}

function memberInitials(member: MemberOption | undefined) {
  if (!member) return "—";
  return member.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function GanttView({ projectId, initialTasks, members, currentUserId, role, today, initialFilters = {} }: GanttViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [priority, setPriority] = useState(initialFilters.priority ?? "");
  const [assignee, setAssignee] = useState(initialFilters.assignee ?? "");
  const [mineOnly, setMineOnly] = useState(Boolean(initialFilters.mine));
  const [zoom, setZoom] = useState<TimelineZoom>(initialFilters.zoom === "month" ? "month" : "week");
  const [selectedId, setSelectedId] = useState(initialFilters.task ?? "");
  const [expanded, setExpanded] = useState(() => new Set(initialTasks.filter((task) => !task.parentTaskId).map((task) => task.id)));
  const [mobileChart, setMobileChart] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(640);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busyIds, setBusyIds] = useState(() => new Set<string>());
  const [dragPreview, setDragPreview] = useState<{ taskId: string; startDate: string | null; dueDate: string | null } | null>(null);
  const interactionRef = useRef<{ task: TaskRecord; mode: "move" | "start" | "end"; originX: number; dayDelta: number } | null>(null);
  const suppressOpenRef = useRef("");
  const tempIdSequence = useRef(0);
  const [isPending, startTransition] = useTransition();
  const readOnly = role === "guest";

  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const task of tasks) {
      if (!task.parentTaskId) continue;
      const children = map.get(task.parentTaskId) ?? [];
      children.push(task);
      map.set(task.parentTaskId, children);
    }
    for (const children of map.values()) children.sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

  const updateUrl = (next: Partial<GanttFilters>) => {
    const params = new URLSearchParams(window.location.search);
    const values: GanttFilters = { q: search, priority, assignee, mine: mineOnly, task: selectedId, zoom, ...next };
    Object.entries(values).forEach(([key, value]) => {
      if (!value || (key === "zoom" && value === "week")) params.delete(key);
      else params.set(key, String(value));
    });
    params.set("view", "gantt");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  };

  const filteredParents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("th");
    return tasks.filter((task) => !task.parentTaskId).filter((task) => {
      const children = childrenByParent.get(task.id) ?? [];
      if (query && !task.title.toLocaleLowerCase("th").includes(query) && !children.some((child) => child.title.toLocaleLowerCase("th").includes(query))) return false;
      if (priority && task.priority !== priority) return false;
      if (assignee && task.assigneeId !== assignee) return false;
      if (mineOnly && task.assigneeId !== currentUserId) return false;
      return true;
    }).toSorted((a, b) => a.position - b.position);
  }, [tasks, childrenByParent, search, priority, assignee, mineOnly, currentUserId]);

  const rows = useMemo(() => {
    const result: GanttRow[] = [];
    for (const parent of filteredParents) {
      const children = childrenByParent.get(parent.id) ?? [];
      result.push({ task: parent, child: false, progress: calculateTaskProgress(parent, children) });
      if (expanded.has(parent.id)) {
        for (const child of children) result.push({ task: child, child: true, progress: calculateTaskProgress(child, []) });
      }
    }
    return result;
  }, [filteredParents, childrenByParent, expanded]);

  const filteredTasks = useMemo(() => rows.map((row) => row.task), [rows]);
  const grid = useMemo(() => createDateGrid(filteredTasks, today, zoom), [filteredTasks, today, zoom]);
  const selectedTask = tasks.find((task) => task.id === selectedId);
  const windowed = rows.length > WINDOW_THRESHOLD;
  const windowStart = windowed ? Math.max(0, Math.floor(Math.max(0, scrollTop - 72) / ROW_HEIGHT) - OVERSCAN) : 0;
  const windowEnd = windowed ? Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN) : rows.length;
  const visibleRows = rows.slice(windowStart, windowEnd);
  const overallProgress = filteredParents.length
    ? Math.round(filteredParents.reduce((sum, task) => sum + calculateTaskProgress(task, childrenByParent.get(task.id) ?? []), 0) / filteredParents.length)
    : 0;

  const markBusy = (id: string, value: boolean) => setBusyIds((current) => {
    const next = new Set(current);
    if (value) next.add(id); else next.delete(id);
    return next;
  });

  const applyPatch = (task: TaskRecord, patch: Partial<TaskMutationInput>, dateMethod: "drawer" | "drag" | "resize" = "drawer") => {
    const previous = tasks;
    const optimistic: TaskRecord = {
      ...task,
      title: patch.title ?? task.title,
      description: patch.description !== undefined ? patch.description : task.description,
      status: patch.status ?? task.status,
      priority: patch.priority !== undefined ? patch.priority : task.priority,
      assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : task.assigneeId,
      startDate: patch.startDate !== undefined ? patch.startDate : task.startDate,
      dueDate: patch.dueDate !== undefined ? patch.dueDate : task.dueDate,
      position: patch.position ?? task.position,
      updatedAt: new Date().toISOString(),
    };
    setTasks((current) => current.map((item) => item.id === task.id ? optimistic : item));
    setNotice(null);
    markBusy(task.id, true);
    startTransition(async () => {
      const result = await updateTask(task.id, { projectId, ...patch });
      markBusy(task.id, false);
      if (!result.ok || !result.task) {
        setTasks(previous);
        setNotice({ type: "error", text: result.error || "บันทึก Gantt ไม่สำเร็จ ระบบคืนค่าเดิมแล้ว" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? result.task! : item));
      setNotice({ type: "success", text: "บันทึกการเปลี่ยนแปลงแล้ว" });
      if (patch.startDate !== undefined || patch.dueDate !== undefined) {
        trackProductEvent("task_dates_changed", { source_view: "gantt", method: dateMethod });
      }
      if (patch.status && patch.status !== task.status) {
        trackProductEvent("task_status_changed", { source_view: "gantt", from_status: task.status, to_status: patch.status });
      }
      router.refresh();
    });
  };

  const addTask = (title: string, parentTaskId: string | null = null) => {
    tempIdSequence.current += 1;
    const tempId = `temp-${projectId}-${tempIdSequence.current}`;
    const task: TaskRecord = {
      id: tempId, projectId, parentTaskId, title, description: null, status: "todo", priority: null, assigneeId: null,
      startDate: null, dueDate: null,
      position: Math.max(0, ...tasks.filter((item) => item.parentTaskId === parentTaskId).map((item) => item.position)) + 1000,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setTasks((current) => [...current, task]);
    if (parentTaskId) setExpanded((current) => new Set(current).add(parentTaskId));
    markBusy(tempId, true);
    startTransition(async () => {
      const result = await createTask({ projectId, parentTaskId, title, status: "todo" });
      markBusy(tempId, false);
      if (!result.ok || !result.task) {
        setTasks((current) => current.filter((item) => item.id !== tempId));
        setNotice({ type: "error", text: result.error || "สร้างงานย่อยไม่สำเร็จ" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === tempId ? result.task! : item));
      trackProductEvent(parentTaskId ? "subtask_created" : "task_created", { source_view: "gantt", has_assignee: false, has_due_date: false });
      router.refresh();
    });
  };

  const removeTask = (task: TaskRecord) => {
    if (!window.confirm(`ลบ “${task.title}” และงานย่อยทั้งหมดหรือไม่?`)) return;
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id && item.parentTaskId !== task.id));
    setSelectedId("");
    updateUrl({ task: "" });
    startTransition(async () => {
      const result = await softDeleteTask(task.id, projectId);
      if (!result.ok) {
        setTasks(previous);
        setNotice({ type: "error", text: result.error || "ลบ Task ไม่สำเร็จ" });
      } else {
        trackProductEvent("task_deleted", { has_subtasks: (childrenByParent.get(task.id) ?? []).length > 0, source_view: "gantt" });
        router.refresh();
      }
    });
  };

  const openTask = (task: TaskRecord) => { setSelectedId(task.id); updateUrl({ task: task.id }); };
  const commitDateChange = (task: TaskRecord, mode: "move" | "start" | "end", dayDelta: number) => {
    if (dayDelta === 0) return;
    applyPatch(task, mode === "move" ? moveTaskDates(task, dayDelta) : resizeTaskDates(task, mode, dayDelta), mode === "move" ? "drag" : "resize");
  };
  const startDateInteraction = (event: ReactPointerEvent<HTMLElement>, task: TaskRecord, mode: "move" | "start" | "end") => {
    if (readOnly || busyIds.has(task.id) || event.pointerType === "touch") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = { task, mode, originX: event.clientX, dayDelta: 0 };
    setDragPreview({ taskId: task.id, startDate: task.startDate, dueDate: task.dueDate });
  };
  const moveDateInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    const dayDelta = Math.round((event.clientX - interaction.originX) / grid.dayWidth);
    if (dayDelta === interaction.dayDelta) return;
    interaction.dayDelta = dayDelta;
    const patch = interaction.mode === "move" ? moveTaskDates(interaction.task, dayDelta) : resizeTaskDates(interaction.task, interaction.mode, dayDelta);
    setDragPreview({ taskId: interaction.task.id, ...patch });
  };
  const finishDateInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    interactionRef.current = null;
    setDragPreview(null);
    if (interaction.dayDelta !== 0) suppressOpenRef.current = interaction.task.id;
    commitDateChange(interaction.task, interaction.mode, interaction.dayDelta);
  };
  const handleScroll = (event: UIEvent<HTMLDivElement>) => { setScrollTop(event.currentTarget.scrollTop); setViewportHeight(event.currentTarget.clientHeight); };
  const clearFilters = () => { setSearch(""); setPriority(""); setAssignee(""); setMineOnly(false); updateUrl({ q: "", priority: "", assignee: "", mine: false }); };
  const hasFilters = Boolean(search || priority || assignee || mineOnly);

  return (
    <>
      <section className="task-toolbar timeline-toolbar workspace-panel">
        <div className="task-filter-row">
          <label className="task-search"><Search size={17} /><span className="sr-only">ค้นหางานในแกนต์</span><input value={search} onChange={(event) => { setSearch(event.target.value); updateUrl({ q: event.target.value }); }} placeholder="ค้นหาจากชื่องาน..." /></label>
          <select className="filter-select" value={priority} onChange={(event) => { setPriority(event.target.value); updateUrl({ priority: event.target.value }); }} aria-label="กรองตามความสำคัญ"><option value="">ทุกความสำคัญ</option>{Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          <select className="filter-select" value={assignee} onChange={(event) => { setAssignee(event.target.value); updateUrl({ assignee: event.target.value }); }} aria-label="กรองตามผู้รับผิดชอบ"><option value="">ผู้รับผิดชอบทั้งหมด</option>{members.map((member) => <option value={member.id} key={member.id}>{member.displayName}</option>)}</select>
          <button className={`filter-chip ${mineOnly ? "active" : ""}`} type="button" onClick={() => { setMineOnly(!mineOnly); updateUrl({ mine: !mineOnly }); }}><UserRound size={16} /> งานของฉัน</button>
        </div>
        <div className="task-filter-row secondary timeline-toolbar-secondary">
          <div className="timeline-zoom" role="group" aria-label="ระดับการซูมแผนภูมิแกนต์">{(["week", "month"] as const).map((value) => <button key={value} type="button" className={zoom === value ? "active" : ""} aria-pressed={zoom === value} onClick={() => { setZoom(value); updateUrl({ zoom: value }); }}>{value === "week" ? "สัปดาห์" : "เดือน"}</button>)}</div>
          <button className={`secondary-button gantt-mobile-toggle ${mobileChart ? "active" : ""}`} type="button" onClick={() => setMobileChart((current) => !current)}>{mobileChart ? "ดูรายการ" : "เปิดแผนภูมิ"}</button>
          {hasFilters && <button className="clear-filter-button" type="button" onClick={clearFilters}><FilterX size={16} /> ล้างตัวกรอง</button>}
          <span className="task-result-count">{rows.length} แถว · ความคืบหน้า {overallProgress}%{windowed ? " · windowed" : ""}</span>
        </div>
      </section>

      {notice && <div className={`task-notice ${notice.type}`} role="status" aria-live="polite">{notice.type === "error" ? <AlertCircle size={17} /> : <CircleCheck size={17} />}<span>{notice.text}</span><button className="icon-button" type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ"><X size={16} /></button></div>}

      <section className={`gantt-panel workspace-panel ${mobileChart ? "show-chart" : ""}`} aria-label="แผนภูมิแกนต์ Task และ Subtask">
        <div className="gantt-scroll" onScroll={handleScroll} data-windowed={windowed || undefined}>
          <div className="gantt-content" style={ganttStyle(grid.totalWidth, grid.dayWidth)}>
            <div className="gantt-header-row">
              <div className="gantt-table-header"><span>งาน / สถานะ</span><span>ผู้รับผิดชอบ</span><span>ช่วงเวลา</span><span>คืบหน้า</span></div>
              <div className="timeline-grid-header gantt-grid-pane" style={{ width: grid.totalWidth }}><div className="timeline-groups">{grid.groups.map((group) => <div key={group.key} style={{ width: group.span * grid.dayWidth }}>{group.label}</div>)}</div><div className="timeline-days" aria-hidden="true">{grid.cells.map((cell) => <div className={cell.isWeekend ? "weekend" : ""} key={cell.date} style={{ width: grid.dayWidth }}>{cell.day}</div>)}</div></div>
            </div>
            {windowStart > 0 && <div className="gantt-spacer" style={{ height: windowStart * ROW_HEIGHT }} aria-hidden="true" />}
            {visibleRows.map(({ task, child, progress }) => {
              const children = childrenByParent.get(task.id) ?? [];
              const effectiveTask = dragPreview?.taskId === task.id ? { ...task, ...dragPreview } : task;
              const range = getTaskDateRange(effectiveTask);
              const left = range ? dateToPixel(range.startDate, grid) : 0;
              const width = range ? (dateToDayIndex(range.endDate) - dateToDayIndex(range.startDate) + 1) * grid.dayWidth : 0;
              const member = task.assigneeId ? memberMap.get(task.assigneeId) : undefined;
              return (
                <div className={`gantt-row ${child ? "child" : "parent"}`} key={task.id}>
                  <div className="gantt-table-cell">
                    <div className="gantt-task-identity">
                      {!child && children.length > 0 ? <button className="expand-button" type="button" aria-label={expanded.has(task.id) ? `ซ่อนงานย่อย ${task.title}` : `แสดงงานย่อย ${task.title}`} onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(task.id)) next.delete(task.id); else next.add(task.id); return next; })}>{expanded.has(task.id) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button> : <span className="gantt-indent">{child ? "↳" : ""}</span>}
                      <button type="button" onClick={() => openTask(task)}><strong>{task.title}</strong><small className={`status-${task.status}`}>{statusLabels[task.status]}</small></button>
                    </div>
                    <span className="gantt-assignee" title={member?.displayName ?? "ยังไม่มอบหมาย"}>{memberInitials(member)}</span>
                    <button className="gantt-date-summary" type="button" onClick={() => openTask(task)} aria-label={`เปิดวันที่ ${task.title}`}>{range ? <>{formatThaiDate(range.startDate)}{range.endDate !== range.startDate ? ` – ${formatThaiDate(range.endDate)}` : ""}</> : <><CalendarClock size={14} /> ยังไม่กำหนด</>}</button>
                    <span className="gantt-progress"><span><i style={{ width: `${progress}%` }} /></span><b>{progress}%</b></span>
                  </div>
                  <div className="timeline-grid-row gantt-grid-pane" style={{ width: grid.totalWidth }}>
                    <span className="timeline-today-line" style={{ left: grid.todayOffset + grid.dayWidth / 2 }} aria-hidden="true" />
                    {range && <div role="button" tabIndex={0} className={`timeline-bar gantt-bar status-${task.status} ${range.kind}`} style={{ left: left + 2, width: Math.max(grid.dayWidth - 4, width - 4) }} onClick={() => { if (suppressOpenRef.current === task.id) suppressOpenRef.current = ""; else openTask(task); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openTask(task); if (!readOnly && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); commitDateChange(task, "move", event.key === "ArrowLeft" ? -1 : 1); } }} onPointerDown={(event) => startDateInteraction(event, task, "move")} onPointerMove={moveDateInteraction} onPointerUp={finishDateInteraction} onPointerCancel={() => { interactionRef.current = null; setDragPreview(null); }} title={`${task.title}: ${formatThaiDate(range.startDate)} – ${formatThaiDate(range.endDate)}`}>
                      {!readOnly && <button className="timeline-resize-handle start" type="button" aria-label={`ปรับวันที่เริ่ม ${task.title}`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => startDateInteraction(event, task, "start")} onPointerMove={moveDateInteraction} onPointerUp={finishDateInteraction} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); commitDateChange(task, "start", event.key === "ArrowLeft" ? -1 : 1); } }} />}
                      <span>{task.title}</span>
                      {!readOnly && <button className="timeline-resize-handle end" type="button" aria-label={`ปรับกำหนดส่ง ${task.title}`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => startDateInteraction(event, task, "end")} onPointerMove={moveDateInteraction} onPointerUp={finishDateInteraction} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); commitDateChange(task, "end", event.key === "ArrowLeft" ? -1 : 1); } }} />}
                    </div>}
                  </div>
                </div>
              );
            })}
            {windowEnd < rows.length && <div className="gantt-spacer" style={{ height: (rows.length - windowEnd) * ROW_HEIGHT }} aria-hidden="true" />}
            {rows.length === 0 && <div className="gantt-empty"><CalendarClock size={28} /><strong>ไม่พบงานสำหรับแสดงในแกนต์</strong><span>ลองล้างตัวกรองหรือเพิ่ม Task จากมุมมองรายการ</span></div>}
          </div>
        </div>
      </section>

      {readOnly && <p className="kanban-read-only">Guest สามารถดู Gantt และรายละเอียดได้ แต่แก้ช่วงเวลาไม่ได้</p>}
      {selectedTask && <TaskDrawer key={selectedTask.id} task={selectedTask} subtasks={childrenByParent.get(selectedTask.id) ?? []} members={members} readOnly={readOnly} busy={busyIds.has(selectedTask.id) || isPending} today={today} onClose={() => { setSelectedId(""); updateUrl({ task: "" }); }} onSave={(patch) => applyPatch(selectedTask, patch)} onAddSubtask={(title) => addTask(title, selectedTask.id)} onUpdateSubtask={applyPatch} onDelete={() => removeTask(selectedTask)} />}
    </>
  );
}
