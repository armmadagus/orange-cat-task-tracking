"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FilterX,
  ListFilter,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask, softDeleteTask, updateTask } from "@/app/tasks/actions";
import { trackProductEvent } from "@/lib/analytics";
import { validateDateRange } from "@/lib/date-grid";
import type {
  MemberOption,
  TaskMutationInput,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  WorkspaceRole,
} from "@/lib/types";

type SortKey = "created" | "updated" | "start" | "due";

type InitialFilters = {
  q?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  mine?: boolean;
  sort?: string;
  task?: string;
};

type TaskListViewProps = {
  projectId: string;
  initialTasks: TaskRecord[];
  members: MemberOption[];
  currentUserId: string;
  role: WorkspaceRole;
  demoMode: boolean;
  today: string;
  initialFilters?: InitialFilters;
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "ต้องทำ",
  in_progress: "กำลังทำ",
  done: "เสร็จแล้ว",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
};

const monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${monthLabels[month - 1]} ${year + 543}`;
}

function Avatar({ member }: { member?: MemberOption }) {
  if (!member) return <span className="avatar avatar-small"><UserRound size={14} /></span>;
  const initials = member.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className="avatar avatar-small" title={member.displayName}>{initials}</span>;
}

export function TaskDrawer({
  task,
  subtasks,
  members,
  readOnly,
  busy,
  today,
  onClose,
  onSave,
  onAddSubtask,
  onUpdateSubtask,
  onDelete,
}: {
  task: TaskRecord;
  subtasks: TaskRecord[];
  members: MemberOption[];
  readOnly: boolean;
  busy: boolean;
  today: string;
  onClose: () => void;
  onSave: (patch: Partial<TaskMutationInput>) => void;
  onAddSubtask: (title: string) => void;
  onUpdateSubtask: (subtask: TaskRecord, patch: Partial<TaskMutationInput>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority | "">(task.priority ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [startDate, setStartDate] = useState(task.startDate ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const doneCount = subtasks.filter((item) => item.status === "done").length;
  const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : task.status === "done" ? 100 : 0;
  const dateError = validateDateRange(startDate || null, dueDate || null);

  const save = () => {
    onSave({
      title,
      description,
      status,
      priority: priority || null,
      assigneeId: assigneeId || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
    });
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="ปิดรายละเอียด Task" />
      <section ref={dialogRef} className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-dialog-title">
        <header className="drawer-header">
          <h2 id="drawer-dialog-title" className="sr-only">รายละเอียด {task.title}</h2>
          <div>
            <span className="task-id">TASK · {task.id.slice(0, 8).toUpperCase()}</span>
            <small>อัปเดต {formatDate(task.updatedAt.slice(0, 10))}</small>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="ปิด"><X size={21} /></button>
        </header>

        <div className="drawer-scroll">
          <label className="sr-only" htmlFor="drawer-title">ชื่องาน</label>
          <textarea
            id="drawer-title"
            className="drawer-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            readOnly={readOnly}
            maxLength={200}
            rows={2}
          />

          <div className="drawer-field-grid">
            <label className="form-field">
              <span>สถานะ</span>
              <select className="select-input" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} disabled={readOnly}>
                {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>ความสำคัญ</span>
              <select className="select-input" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | "")} disabled={readOnly}>
                <option value="">ไม่กำหนด</option>
                {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>ผู้รับผิดชอบ</span>
              <select className="select-input" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} disabled={readOnly}>
                <option value="">ยังไม่มอบหมาย</option>
                {members.filter((member) => member.role !== "guest").map((member) => <option value={member.id} key={member.id}>{member.displayName}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>วันที่เริ่ม</span>
              <input className="text-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={readOnly} max={dueDate || undefined} />
            </label>
            <label className="form-field">
              <span>กำหนดส่ง</span>
              <input className={`text-input ${dueDate && dueDate < today && status !== "done" ? "date-overdue" : ""}`} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={readOnly} min={startDate || undefined} />
            </label>
            {dateError && <p className="drawer-date-error" role="alert">{dateError}</p>}
          </div>

          <section className="drawer-section">
            <div className="drawer-section-title"><h3>รายละเอียดงาน</h3></div>
            <textarea className="text-area drawer-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="เพิ่มรายละเอียดที่ทีมต้องรู้..." readOnly={readOnly} maxLength={10000} />
          </section>

          {!task.parentTaskId && (
            <section className="drawer-section">
              <div className="drawer-section-title">
                <h3>งานย่อย</h3>
                <span>{doneCount}/{subtasks.length} เสร็จแล้ว</span>
              </div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="subtask-list">
                {subtasks.map((subtask) => (
                  <label className="subtask-item" key={subtask.id}>
                    <input
                      type="checkbox"
                      checked={subtask.status === "done"}
                      disabled={readOnly || busy}
                      onChange={(event) => onUpdateSubtask(subtask, { status: event.target.checked ? "done" : "todo" })}
                    />
                    <span className={subtask.status === "done" ? "completed" : ""}>{subtask.title}</span>
                    <small>{formatDate(subtask.dueDate)}</small>
                  </label>
                ))}
              </div>
              {!readOnly && (
                <form
                  className="subtask-add"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!subtaskTitle.trim()) return;
                    onAddSubtask(subtaskTitle.trim());
                    setSubtaskTitle("");
                  }}
                >
                  <input className="text-input" value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} placeholder="เพิ่มงานย่อย..." maxLength={200} />
                  <button className="secondary-button" type="submit" disabled={busy}><Plus size={16} /> เพิ่ม</button>
                </form>
              )}
            </section>
          )}
        </div>

        <footer className="drawer-footer">
          {!readOnly && <button className="danger-link" type="button" onClick={onDelete} disabled={busy}><Trash2 size={17} /> ลบงานนี้</button>}
          <div className="drawer-footer-actions">
            <button className="secondary-button" type="button" onClick={onClose}>ปิด</button>
            {!readOnly && <button className="primary-button blue" type="button" onClick={save} disabled={busy || !title.trim() || Boolean(dateError)}>{busy ? <LoaderCircle className="spin" size={17} /> : <CircleCheck size={17} />} บันทึกข้อมูล</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}

export function TaskListView({
  projectId,
  initialTasks,
  members,
  currentUserId,
  role,
  demoMode,
  today,
  initialFilters = {},
}: TaskListViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [status, setStatus] = useState(initialFilters.status ?? "");
  const [priority, setPriority] = useState(initialFilters.priority ?? "");
  const [assignee, setAssignee] = useState(initialFilters.assignee ?? "");
  const [mineOnly, setMineOnly] = useState(Boolean(initialFilters.mine));
  const [sort, setSort] = useState<SortKey>((initialFilters.sort as SortKey) || "updated");
  const [expanded, setExpanded] = useState(() => new Set(initialTasks.filter((task) => !task.parentTaskId).map((task) => task.id)));
  const [selectedId, setSelectedId] = useState(initialFilters.task ?? "");
  const [quickTitle, setQuickTitle] = useState("");
  const [visibleCount, setVisibleCount] = useState(80);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busyIds, setBusyIds] = useState(() => new Set<string>());
  const [isPending, startTransition] = useTransition();
  const readOnly = role === "guest";
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const updateUrl = (next: Partial<InitialFilters>) => {
    const params = new URLSearchParams(window.location.search);
    const values: InitialFilters = { q: search, status, priority, assignee, mine: mineOnly, sort, task: selectedId, ...next };
    Object.entries(values).forEach(([key, value]) => {
      if (!value || value === "updated") params.delete(key);
      else params.set(key, String(value));
    });
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  };

  const filteredParents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("th");
    const matches = (task: TaskRecord) => {
      if (query && !task.title.toLocaleLowerCase("th").includes(query)) return false;
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (assignee && task.assigneeId !== assignee) return false;
      if (mineOnly && task.assigneeId !== currentUserId) return false;
      return true;
    };
    const childrenByParent = new Map<string, TaskRecord[]>();
    tasks.filter((task) => task.parentTaskId).forEach((task) => {
      const list = childrenByParent.get(task.parentTaskId!) ?? [];
      list.push(task);
      childrenByParent.set(task.parentTaskId!, list);
    });
    const parents = tasks.filter((task) => !task.parentTaskId).filter((task) => matches(task) || (childrenByParent.get(task.id) ?? []).some(matches));
    const value = (task: TaskRecord) => {
      if (sort === "created") return task.createdAt;
      if (sort === "start") return task.startDate ?? "9999";
      if (sort === "due") return task.dueDate ?? "9999";
      return task.updatedAt;
    };
    return parents.toSorted((a, b) => sort === "created" || sort === "updated" ? value(b).localeCompare(value(a)) : value(a).localeCompare(value(b)));
  }, [tasks, search, status, priority, assignee, mineOnly, currentUserId, sort]);

  const visibleChildren = (parentId: string) => tasks.filter((task) => task.parentTaskId === parentId);
  const selectedTask = tasks.find((task) => task.id === selectedId);

  const markBusy = (id: string, value: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  };

  const applyPatch = (task: TaskRecord, patch: Partial<TaskMutationInput>) => {
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
    if (demoMode) {
      setNotice({ type: "success", text: "อัปเดตข้อมูลในโหมดตัวอย่างแล้ว" });
      return;
    }

    markBusy(task.id, true);
    startTransition(async () => {
      const result = await updateTask(task.id, { projectId, ...patch });
      markBusy(task.id, false);
      if (!result.ok || !result.task) {
        setTasks(previous);
        setNotice({ type: "error", text: result.error || "บันทึกข้อมูลไม่สำเร็จ" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? result.task! : item));
      setNotice({ type: "success", text: "บันทึกการเปลี่ยนแปลงแล้ว" });
      if (patch.startDate !== undefined || patch.dueDate !== undefined) {
        trackProductEvent("task_dates_changed", { source_view: "list", method: "drawer" });
      }
      if (patch.status && patch.status !== task.status) {
        trackProductEvent("task_status_changed", { source_view: "list", from_status: task.status, to_status: patch.status });
      }
      router.refresh();
    });
  };

  const addTask = (title: string, parentTaskId: string | null = null) => {
    const tempId = `temp-${Date.now()}`;
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
      position: tasks.length * 1000 + 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((current) => [...current, task]);
    if (demoMode) {
      setNotice({ type: "success", text: parentTaskId ? "เพิ่มงานย่อยในโหมดตัวอย่างแล้ว" : "เพิ่ม Task ในโหมดตัวอย่างแล้ว" });
      return;
    }

    markBusy(tempId, true);
    startTransition(async () => {
      const result = await createTask({ projectId, parentTaskId, title, status: "todo" });
      markBusy(tempId, false);
      if (!result.ok || !result.task) {
        setTasks((current) => current.filter((item) => item.id !== tempId));
        setNotice({ type: "error", text: result.error || "สร้าง Task ไม่สำเร็จ" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === tempId ? result.task! : item));
      setNotice({ type: "success", text: "สร้าง Task แล้ว" });
      trackProductEvent(parentTaskId ? "subtask_created" : "task_created", { source_view: "list", has_assignee: false, has_due_date: false });
      router.refresh();
    });
  };

  const removeTask = (task: TaskRecord) => {
    if (!window.confirm(`ลบ “${task.title}” และงานย่อยทั้งหมดหรือไม่?`)) return;
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id && item.parentTaskId !== task.id));
    setSelectedId("");
    updateUrl({ task: "" });
    if (demoMode) {
      setNotice({ type: "success", text: "ลบ Task ในโหมดตัวอย่างแล้ว" });
      return;
    }
    startTransition(async () => {
      const result = await softDeleteTask(task.id, projectId);
      if (!result.ok) {
        setTasks(previous);
        setNotice({ type: "error", text: result.error || "ลบ Task ไม่สำเร็จ" });
      } else {
        setNotice({ type: "success", text: "ย้าย Task ออกจากรายการแล้ว" });
        trackProductEvent("task_deleted", { has_subtasks: tasks.some((item) => item.parentTaskId === task.id), source_view: "list" });
        router.refresh();
      }
    });
  };

  const clearFilters = () => {
    setSearch(""); setStatus(""); setPriority(""); setAssignee(""); setMineOnly(false); setSort("updated");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const renderRow = (task: TaskRecord, child = false) => {
    const subtasks = visibleChildren(task.id);
    const doneCount = subtasks.filter((item) => item.status === "done").length;
    const overdue = Boolean(task.dueDate && task.dueDate < today && task.status !== "done");
    const busy = busyIds.has(task.id) || isPending;
    return (
      <div className={`task-row ${child ? "task-row-child" : ""}`} key={task.id}>
        <div className="task-title-cell">
          {!child && subtasks.length > 0 ? (
            <button className="expand-button" type="button" aria-label={expanded.has(task.id) ? "ซ่อนงานย่อย" : "แสดงงานย่อย"} onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(task.id)) next.delete(task.id); else next.add(task.id); return next; })}>
              {expanded.has(task.id) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            </button>
          ) : <span className="row-indent">{child ? "↳" : ""}</span>}
          <button className="task-title-button" type="button" onClick={() => { setSelectedId(task.id); updateUrl({ task: task.id }); }}>
            <strong className={task.status === "done" ? "completed" : ""}>{task.title}</strong>
            {!child && <small>{subtasks.length ? `${doneCount}/${subtasks.length} งานย่อย` : "ไม่มีงานย่อย"}</small>}
          </button>
        </div>
        <div className="task-cell" data-label="สถานะ">
          <select className={`inline-select status-${task.status}`} value={task.status} disabled={readOnly || busy} onChange={(event) => applyPatch(task, { status: event.target.value as TaskStatus })} aria-label={`สถานะ ${task.title}`}>
            {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </div>
        <div className="task-cell" data-label="ความสำคัญ">
          <select className={`inline-select priority-${task.priority || "none"}`} value={task.priority ?? ""} disabled={readOnly || busy} onChange={(event) => applyPatch(task, { priority: (event.target.value || null) as TaskPriority | null })} aria-label={`ความสำคัญ ${task.title}`}>
            <option value="">—</option>
            {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </div>
        <div className="task-cell assignee-cell" data-label="ผู้รับผิดชอบ">
          <Avatar member={task.assigneeId ? memberMap.get(task.assigneeId) : undefined} />
          <select className="inline-select" value={task.assigneeId ?? ""} disabled={readOnly || busy} onChange={(event) => applyPatch(task, { assigneeId: event.target.value || null })} aria-label={`ผู้รับผิดชอบ ${task.title}`}>
            <option value="">ยังไม่มอบหมาย</option>
            {members.filter((member) => member.role !== "guest").map((member) => <option value={member.id} key={member.id}>{member.displayName}</option>)}
          </select>
        </div>
        <div className="task-cell date-cell" data-label="วันที่เริ่ม">{formatDate(task.startDate)}</div>
        <div className={`task-cell date-cell ${overdue ? "overdue" : ""}`} data-label="กำหนดส่ง">{overdue && <AlertCircle size={14} />} {formatDate(task.dueDate)}</div>
        <div className="task-cell row-action-cell">{busy ? <LoaderCircle className="spin" size={17} /> : <button className="icon-button" type="button" onClick={() => { setSelectedId(task.id); updateUrl({ task: task.id }); }} aria-label={`เปิดรายละเอียด ${task.title}`}><ChevronRight size={18} /></button>}</div>
      </div>
    );
  };

  const hasFilters = Boolean(search || status || priority || assignee || mineOnly || sort !== "updated");
  const visibleParents = filteredParents.slice(0, visibleCount);

  return (
    <>
      <section className="task-toolbar workspace-panel">
        <div className="task-filter-row">
          <label className="task-search">
            <Search size={17} />
            <span className="sr-only">ค้นหางาน</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); updateUrl({ q: event.target.value }); }} placeholder="ค้นหาจากชื่องาน..." />
          </label>
          <select className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); updateUrl({ status: event.target.value }); }} aria-label="กรองตามสถานะ">
            <option value="">ทุกสถานะ</option>
            {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
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
        <div className="task-filter-row secondary">
          <label className="sort-control"><ListFilter size={16} /> เรียงตาม
            <select value={sort} onChange={(event) => { setSort(event.target.value as SortKey); updateUrl({ sort: event.target.value }); }}>
              <option value="updated">อัปเดตล่าสุด</option>
              <option value="created">วันที่สร้าง</option>
              <option value="start">วันที่เริ่ม</option>
              <option value="due">กำหนดส่ง</option>
            </select>
          </label>
          {hasFilters && <button className="clear-filter-button" type="button" onClick={clearFilters}><FilterX size={16} /> ล้างตัวกรอง</button>}
          <span className="task-result-count">พบ {filteredParents.length} งานหลัก</span>
        </div>
      </section>

      {notice && <div className={`task-notice ${notice.type}`} role="status" aria-live="polite">{notice.type === "error" ? <AlertCircle size={17} /> : <CircleCheck size={17} />}<span>{notice.text}</span><button className="icon-button" type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ"><X size={16} /></button></div>}

      {!readOnly && (
        <form className="quick-add workspace-panel" onSubmit={(event) => { event.preventDefault(); if (!quickTitle.trim()) return; addTask(quickTitle.trim()); setQuickTitle(""); }}>
          <Plus size={18} />
          <input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="เพิ่ม Task ใหม่ด้วยชื่ออย่างเดียว..." maxLength={200} />
          <button className="primary-button blue" type="submit" disabled={!quickTitle.trim() || isPending}>เพิ่ม Task</button>
        </form>
      )}

      <section className="task-list workspace-panel" aria-label="รายการ Task และ Subtask">
        <div className="task-row task-list-header" aria-hidden="true">
          <div>ชื่องาน</div><div>สถานะ</div><div>ความสำคัญ</div><div>ผู้รับผิดชอบ</div><div>วันที่เริ่ม</div><div>กำหนดส่ง</div><div />
        </div>
        {filteredParents.length === 0 ? (
          <div className="compact-empty-state">
            <Search size={28} />
            <strong>{tasks.length ? "ไม่พบงานตามตัวกรอง" : "ยังไม่มี Task ในโปรเจกต์นี้"}</strong>
            <span>{tasks.length ? "ลองเปลี่ยนหรือล้างตัวกรอง" : readOnly ? "สมาชิกทีมยังไม่ได้เพิ่มงาน" : "เพิ่มงานแรกจากช่องด้านบน"}</span>
            {hasFilters && <button className="secondary-button" type="button" onClick={clearFilters}>ล้างตัวกรอง</button>}
          </div>
        ) : visibleParents.map((task) => (
          <div key={task.id} className="task-group">
            {renderRow(task)}
            {expanded.has(task.id) && visibleChildren(task.id).map((child) => renderRow(child, true))}
          </div>
        ))}
        {visibleParents.length < filteredParents.length && (
          <div className="task-load-more">
            <span>แสดง {visibleParents.length} จาก {filteredParents.length} งานหลัก</span>
            <button className="secondary-button" type="button" onClick={() => setVisibleCount((current) => current + 80)}>แสดงเพิ่มอีก 80 งาน</button>
          </div>
        )}
      </section>

      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id}
          task={selectedTask}
          subtasks={visibleChildren(selectedTask.id)}
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
