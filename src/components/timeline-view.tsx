"use client";

import {
  AlertCircle,
  CalendarClock,
  CircleCheck,
  FilterX,
  LoaderCircle,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { createTask, softDeleteTask, updateTask } from "@/app/tasks/actions";
import { TaskDrawer } from "@/components/task-list-view";
import { trackProductEvent } from "@/lib/analytics";
import {
  createDateGrid,
  dateToDayIndex,
  dateToPixel,
  formatThaiDate,
  getTaskDateRange,
  moveTaskDates,
  resizeTaskDates,
  validateDateRange,
  type TimelineZoom,
} from "@/lib/date-grid";
import type {
  MemberOption,
  TaskMutationInput,
  TaskPriority,
  TaskRecord,
  WorkspaceRole,
} from "@/lib/types";

type TimelineFilters = {
  q?: string;
  priority?: string;
  assignee?: string;
  mine?: boolean;
  task?: string;
  zoom?: string;
};

type TimelineViewProps = {
  projectId: string;
  initialTasks: TaskRecord[];
  members: MemberOption[];
  currentUserId: string;
  role: WorkspaceRole;
  today: string;
  initialFilters?: TimelineFilters;
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
};

function timelineStyle(totalWidth: number, dayWidth: number): CSSProperties {
  return {
    "--timeline-grid-width": `${totalWidth}px`,
    "--timeline-day-width": `${dayWidth}px`,
  } as CSSProperties;
}

export function TimelineView({
  projectId,
  initialTasks,
  members,
  currentUserId,
  role,
  today,
  initialFilters = {},
}: TimelineViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [priority, setPriority] = useState(initialFilters.priority ?? "");
  const [assignee, setAssignee] = useState(initialFilters.assignee ?? "");
  const [mineOnly, setMineOnly] = useState(Boolean(initialFilters.mine));
  const [zoom, setZoom] = useState<TimelineZoom>(initialFilters.zoom === "month" ? "month" : "week");
  const [selectedId, setSelectedId] = useState(initialFilters.task ?? "");
  const [editingId, setEditingId] = useState("");
  const [draftStart, setDraftStart] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busyIds, setBusyIds] = useState(() => new Set<string>());
  const tempIdSequence = useRef(0);
  const interactionRef = useRef<{ task: TaskRecord; mode: "move" | "start" | "end"; originX: number; dayDelta: number } | null>(null);
  const suppressOpenRef = useRef("");
  const [dragPreview, setDragPreview] = useState<{ taskId: string; startDate: string | null; dueDate: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();
  const readOnly = role === "guest";

  const updateUrl = (next: Partial<TimelineFilters>) => {
    const params = new URLSearchParams(window.location.search);
    const values: TimelineFilters = {
      q: search,
      priority,
      assignee,
      mine: mineOnly,
      task: selectedId,
      zoom,
      ...next,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (!value || (key === "zoom" && value === "week")) params.delete(key);
      else params.set(key, String(value));
    });
    params.set("view", "timeline");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  };

  const parentTasks = useMemo(() => tasks.filter((task) => !task.parentTaskId), [tasks]);
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("th");
    return parentTasks.filter((task) => {
      if (query && !task.title.toLocaleLowerCase("th").includes(query)) return false;
      if (priority && task.priority !== priority) return false;
      if (assignee && task.assigneeId !== assignee) return false;
      if (mineOnly && task.assigneeId !== currentUserId) return false;
      return true;
    }).toSorted((a, b) => a.position - b.position);
  }, [parentTasks, search, priority, assignee, mineOnly, currentUserId]);
  const scheduledTasks = filteredTasks.filter((task) => getTaskDateRange(task));
  const undatedTasks = filteredTasks.filter((task) => !getTaskDateRange(task));
  const grid = useMemo(() => createDateGrid(parentTasks, today, zoom), [parentTasks, today, zoom]);
  const selectedTask = tasks.find((task) => task.id === selectedId);
  const editingTask = tasks.find((task) => task.id === editingId);
  const draftError = validateDateRange(draftStart || null, draftDue || null);

  const markBusy = (id: string, value: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  };

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
        setNotice({ type: "error", text: result.error || "บันทึกวันที่ไม่สำเร็จ ระบบคืนค่าเดิมแล้ว" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? result.task! : item));
      setNotice({ type: "success", text: "บันทึกการเปลี่ยนแปลงแล้ว" });
      setEditingId("");
      if (patch.startDate !== undefined || patch.dueDate !== undefined) {
        trackProductEvent("task_dates_changed", { source_view: "timeline", method: dateMethod });
      }
      if (patch.status && patch.status !== task.status) {
        trackProductEvent("task_status_changed", { source_view: "timeline", from_status: task.status, to_status: patch.status });
      }
      router.refresh();
    });
  };

  const addTask = (title: string, parentTaskId: string | null = null) => {
    tempIdSequence.current += 1;
    const tempId = `temp-${projectId}-${tempIdSequence.current}`;
    const task: TaskRecord = {
      id: tempId,
      projectId,
      parentTaskId,
      title,
      description: null,
      status: "todo",
      priority: null,
      assigneeId: null,
      startDate: null,
      dueDate: null,
      position: Math.max(0, ...tasks.map((item) => item.position)) + 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((current) => [...current, task]);
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
      setNotice({ type: "success", text: "สร้างงานย่อยแล้ว" });
      trackProductEvent(parentTaskId ? "subtask_created" : "task_created", { source_view: "timeline", has_assignee: false, has_due_date: false });
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
        setNotice({ type: "success", text: "ย้าย Task ออกจากโปรเจกต์แล้ว" });
        trackProductEvent("task_deleted", { has_subtasks: tasks.some((item) => item.parentTaskId === task.id), source_view: "timeline" });
        router.refresh();
      }
    });
  };

  const openTask = (task: TaskRecord) => {
    setSelectedId(task.id);
    updateUrl({ task: task.id });
  };

  const editDates = (task: TaskRecord) => {
    setEditingId(task.id);
    setDraftStart(task.startDate ?? "");
    setDraftDue(task.dueDate ?? "");
  };

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

  const clearFilters = () => {
    setSearch("");
    setPriority("");
    setAssignee("");
    setMineOnly(false);
    updateUrl({ q: "", priority: "", assignee: "", mine: false });
  };

  const hasFilters = Boolean(search || priority || assignee || mineOnly);

  return (
    <>
      <section className="task-toolbar timeline-toolbar workspace-panel">
        <div className="task-filter-row">
          <label className="task-search">
            <Search size={17} />
            <span className="sr-only">ค้นหางานในไทม์ไลน์</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); updateUrl({ q: event.target.value }); }} placeholder="ค้นหาจากชื่องาน..." />
          </label>
          <select className="filter-select" value={priority} onChange={(event) => { setPriority(event.target.value); updateUrl({ priority: event.target.value }); }} aria-label="กรองตามความสำคัญ">
            <option value="">ทุกความสำคัญ</option>
            {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <select className="filter-select" value={assignee} onChange={(event) => { setAssignee(event.target.value); updateUrl({ assignee: event.target.value }); }} aria-label="กรองตามผู้รับผิดชอบ">
            <option value="">ผู้รับผิดชอบทั้งหมด</option>
            {members.map((member) => <option value={member.id} key={member.id}>{member.displayName}</option>)}
          </select>
          <button className={`filter-chip ${mineOnly ? "active" : ""}`} type="button" onClick={() => { setMineOnly(!mineOnly); updateUrl({ mine: !mineOnly }); }}><UserRound size={16} /> งานของฉัน</button>
        </div>
        <div className="task-filter-row secondary timeline-toolbar-secondary">
          <div className="timeline-zoom" role="group" aria-label="ระดับการซูมไทม์ไลน์">
            {(["week", "month"] as const).map((value) => (
              <button key={value} type="button" className={zoom === value ? "active" : ""} aria-pressed={zoom === value} onClick={() => { setZoom(value); updateUrl({ zoom: value }); }}>
                {value === "week" ? "สัปดาห์" : "เดือน"}
              </button>
            ))}
          </div>
          {hasFilters && <button className="clear-filter-button" type="button" onClick={clearFilters}><FilterX size={16} /> ล้างตัวกรอง</button>}
          <span className="task-result-count">พบ {filteredTasks.length} งานหลัก · มีช่วงเวลา {scheduledTasks.length}</span>
        </div>
      </section>

      {notice && <div className={`task-notice ${notice.type}`} role="status" aria-live="polite">{notice.type === "error" ? <AlertCircle size={17} /> : <CircleCheck size={17} />}<span>{notice.text}</span><button className="icon-button" type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ"><X size={16} /></button></div>}

      {editingTask && !readOnly && (
        <section className="timeline-date-editor workspace-panel" aria-label={`แก้ช่วงเวลาของ ${editingTask.title}`}>
          <div className="timeline-date-editor-copy">
            <CalendarClock size={19} />
            <div><strong>{editingTask.title}</strong><small>กำหนดช่วงเวลาโดยใช้ข้อมูล Task เดียวกับ List, Drawer และ Kanban</small></div>
          </div>
          <label className="form-field"><span>วันที่เริ่ม</span><input className="text-input" type="date" value={draftStart} max={draftDue || undefined} onChange={(event) => setDraftStart(event.target.value)} /></label>
          <label className="form-field"><span>กำหนดส่ง</span><input className="text-input" type="date" value={draftDue} min={draftStart || undefined} onChange={(event) => setDraftDue(event.target.value)} /></label>
          <div className="timeline-date-editor-actions">
            <button className="secondary-button" type="button" onClick={() => setEditingId("")}>ยกเลิก</button>
            <button className="primary-button blue" type="button" disabled={Boolean(draftError) || busyIds.has(editingTask.id) || isPending} onClick={() => applyPatch(editingTask, { startDate: draftStart || null, dueDate: draftDue || null })}>
              {busyIds.has(editingTask.id) ? <LoaderCircle className="spin" size={16} /> : <CircleCheck size={16} />} บันทึกวันที่
            </button>
          </div>
          {draftError && <p className="timeline-date-editor-error" role="alert">{draftError}</p>}
        </section>
      )}

      <section className="timeline-panel workspace-panel" aria-label="ไทม์ไลน์งานหลัก">
        <div className="timeline-scroll">
          <div className="timeline-content" style={timelineStyle(grid.totalWidth, grid.dayWidth)}>
            <div className="timeline-header-row">
              <div className="timeline-row-name timeline-corner"><strong>งานหลัก</strong><small>{formatThaiDate(grid.startDate)} – {formatThaiDate(grid.endDate)}</small></div>
              <div className="timeline-grid-header" style={{ width: grid.totalWidth }}>
                <div className="timeline-groups">
                  {grid.groups.map((group) => <div key={group.key} style={{ width: group.span * grid.dayWidth }}>{group.label}</div>)}
                </div>
                <div className="timeline-days" aria-hidden="true">
                  {grid.cells.map((cell) => <div className={cell.isWeekend ? "weekend" : ""} key={cell.date} style={{ width: grid.dayWidth }}>{cell.day}</div>)}
                </div>
              </div>
            </div>

            {scheduledTasks.map((task) => {
              const effectiveTask = dragPreview?.taskId === task.id ? { ...task, ...dragPreview } : task;
              const range = getTaskDateRange(effectiveTask)!;
              const left = dateToPixel(range.startDate, grid);
              const width = (dateToDayIndex(range.endDate) - dateToDayIndex(range.startDate) + 1) * grid.dayWidth;
              return (
                <div className="timeline-row" key={task.id}>
                  <div className="timeline-row-name">
                    <button type="button" onClick={() => openTask(task)}><strong>{task.title}</strong><small>{range.kind === "milestone" ? "Milestone · " : range.kind === "start-only" ? "ยังไม่มีกำหนดส่ง · " : ""}{formatThaiDate(range.startDate)}{range.endDate !== range.startDate ? ` – ${formatThaiDate(range.endDate)}` : ""}</small></button>
                    {!readOnly && <button className="timeline-edit-date" type="button" onClick={() => editDates(task)} aria-label={`แก้วันที่ ${task.title}`}><CalendarClock size={16} /></button>}
                  </div>
                  <div className="timeline-grid-row" style={{ width: grid.totalWidth }}>
                    <span className="timeline-today-line" style={{ left: grid.todayOffset + grid.dayWidth / 2 }} aria-hidden="true" />
                    <div
                      role="button"
                      tabIndex={0}
                      className={`timeline-bar status-${task.status} ${range.kind}`}
                      style={{ left: left + 2, width: Math.max(grid.dayWidth - 4, width - 4) }}
                      onClick={() => { if (suppressOpenRef.current === task.id) suppressOpenRef.current = ""; else openTask(task); }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") openTask(task);
                        if (!readOnly && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                          event.preventDefault();
                          commitDateChange(task, "move", event.key === "ArrowLeft" ? -1 : 1);
                        }
                      }}
                      onPointerDown={(event) => startDateInteraction(event, task, "move")}
                      onPointerMove={moveDateInteraction}
                      onPointerUp={finishDateInteraction}
                      onPointerCancel={() => { interactionRef.current = null; setDragPreview(null); }}
                      title={`${task.title}: ${formatThaiDate(range.startDate)} – ${formatThaiDate(range.endDate)}`}
                    >
                      {!readOnly && <button className="timeline-resize-handle start" type="button" aria-label={`ปรับวันที่เริ่ม ${task.title}`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => startDateInteraction(event, task, "start")} onPointerMove={moveDateInteraction} onPointerUp={finishDateInteraction} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); commitDateChange(task, "start", event.key === "ArrowLeft" ? -1 : 1); } }} />}
                      <span>{task.title}</span>
                      {!readOnly && <button className="timeline-resize-handle end" type="button" aria-label={`ปรับกำหนดส่ง ${task.title}`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => startDateInteraction(event, task, "end")} onPointerMove={moveDateInteraction} onPointerUp={finishDateInteraction} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); commitDateChange(task, "end", event.key === "ArrowLeft" ? -1 : 1); } }} />}
                    </div>
                  </div>
                </div>
              );
            })}

            {scheduledTasks.length === 0 && (
              <div className="timeline-empty-grid"><CalendarClock size={28} /><strong>ยังไม่มีงานที่กำหนดช่วงเวลา</strong><span>เพิ่มวันที่จากรายการด้านล่างหรือเปิด Task drawer</span></div>
            )}
          </div>
        </div>
      </section>

      <section className="timeline-undated workspace-panel" aria-labelledby="timeline-undated-title">
        <div className="timeline-undated-heading"><div><h2 id="timeline-undated-title">ยังไม่กำหนดเวลา</h2><p>งานเหล่านี้ยังไม่มีทั้งวันที่เริ่มและกำหนดส่ง แต่ยังเข้าถึงและแก้ไขได้ครบ</p></div><span>{undatedTasks.length} งาน</span></div>
        {undatedTasks.length ? (
          <div className="timeline-undated-list">
            {undatedTasks.map((task) => (
              <article key={task.id}>
                <button type="button" onClick={() => openTask(task)}><strong>{task.title}</strong><span>เปิดรายละเอียด</span></button>
                {!readOnly && <button className="secondary-button" type="button" onClick={() => editDates(task)}><CalendarClock size={16} /> เพิ่มวันที่</button>}
              </article>
            ))}
          </div>
        ) : <p className="timeline-undated-empty">งานที่แสดงทั้งหมดมีวันที่แล้ว</p>}
      </section>

      {readOnly && <p className="kanban-read-only">Guest สามารถดูไทม์ไลน์และรายละเอียดได้ แต่แก้ช่วงเวลาไม่ได้</p>}

      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id}
          task={selectedTask}
          subtasks={tasks.filter((item) => item.parentTaskId === selectedTask.id)}
          members={members}
          readOnly={readOnly}
          busy={busyIds.has(selectedTask.id) || isPending}
          today={today}
          onClose={() => { setSelectedId(""); updateUrl({ task: "" }); }}
          onSave={(patch) => applyPatch(selectedTask, patch)}
          onAddSubtask={(title) => addTask(title, selectedTask.id)}
          onUpdateSubtask={applyPatch}
          onDelete={() => removeTask(selectedTask)}
        />
      )}
    </>
  );
}
