"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CalendarDays,
  CircleCheck,
  FilterX,
  GripVertical,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask, softDeleteTask, updateTask } from "@/app/tasks/actions";
import { TaskDrawer } from "@/components/task-list-view";
import { trackProductEvent } from "@/lib/analytics";
import type {
  MemberOption,
  TaskMutationInput,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  WorkspaceRole,
} from "@/lib/types";

type KanbanFilters = {
  q?: string;
  priority?: string;
  assignee?: string;
  mine?: boolean;
  task?: string;
};

type KanbanBoardProps = {
  projectId: string;
  initialTasks: TaskRecord[];
  members: MemberOption[];
  currentUserId: string;
  role: WorkspaceRole;
  demoMode: boolean;
  today: string;
  initialFilters?: KanbanFilters;
};

const columns: Array<{ status: TaskStatus; label: string; tone: string }> = [
  { status: "todo", label: "ต้องทำ", tone: "slate" },
  { status: "in_progress", label: "กำลังทำ", tone: "blue" },
  { status: "done", label: "เสร็จแล้ว", tone: "green" },
];

const priorityLabels: Record<TaskPriority, string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
};

const monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatDate(value: string | null) {
  if (!value) return "ยังไม่กำหนด";
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${monthLabels[month - 1]} ${year + 543}`;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function KanbanCardContent({
  task,
  subtasks,
  member,
  today,
  readOnly,
  busy,
  onOpen,
  onStatusChange,
  dragHandle,
}: {
  task: TaskRecord;
  subtasks: TaskRecord[];
  member?: MemberOption;
  today: string;
  readOnly: boolean;
  busy: boolean;
  onOpen?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  dragHandle?: Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">;
}) {
  const doneCount = subtasks.filter((item) => item.status === "done").length;
  const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : task.status === "done" ? 100 : 0;
  const overdue = Boolean(task.dueDate && task.dueDate < today && task.status !== "done");

  return (
    <>
      <div className="kanban-card-top">
        <span className={`priority-badge priority-${task.priority || "none"}`}>
          {task.priority ? priorityLabels[task.priority] : "ไม่กำหนด"}
        </span>
        {dragHandle && !readOnly && (
          <button
            className="kanban-drag-handle"
            type="button"
            aria-label={`ลากเพื่อจัดลำดับ ${task.title}`}
            disabled={busy}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
          >
            <GripVertical size={17} />
          </button>
        )}
      </div>
      <button className="kanban-card-title" type="button" onClick={onOpen}>
        {task.title}
      </button>
      {subtasks.length > 0 && (
        <div className="kanban-progress">
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{doneCount}/{subtasks.length} งานย่อย</small>
        </div>
      )}
      <div className="kanban-card-meta">
        <span className={overdue ? "kanban-due overdue" : "kanban-due"}>
          {overdue ? <AlertCircle size={14} /> : <CalendarDays size={14} />}
          {formatDate(task.dueDate)}
        </span>
        <span className="avatar avatar-small" title={member?.displayName || "ยังไม่มอบหมาย"}>
          {member ? initials(member.displayName) : <UserRound size={13} />}
        </span>
      </div>
      {!readOnly && onStatusChange && (
        <label className="kanban-status-control">
          <span className="sr-only">ย้าย {task.title} ไปสถานะ</span>
          <select
            value={task.status}
            disabled={busy}
            onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
            aria-label={`ย้าย ${task.title} ไปสถานะ`}
          >
            {columns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}
          </select>
        </label>
      )}
    </>
  );
}

function SortableKanbanCard({
  task,
  subtasks,
  member,
  today,
  readOnly,
  busy,
  onOpen,
  onStatusChange,
}: {
  task: TaskRecord;
  subtasks: TaskRecord[];
  member?: MemberOption;
  today: string;
  readOnly: boolean;
  busy: boolean;
  onOpen: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: readOnly || busy,
    data: { type: "task", status: task.status },
  });

  return (
    <article
      ref={setNodeRef}
      className={`kanban-card ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <KanbanCardContent
        task={task}
        subtasks={subtasks}
        member={member}
        today={today}
        readOnly={readOnly}
        busy={busy}
        onOpen={onOpen}
        onStatusChange={onStatusChange}
        dragHandle={{ attributes, listeners }}
      />
    </article>
  );
}

function KanbanColumn({
  status,
  label,
  tone,
  tasks,
  allTasks,
  members,
  today,
  readOnly,
  busyIds,
  activeOnMobile,
  quickTitle,
  onQuickTitle,
  onQuickAdd,
  onOpen,
  onStatusChange,
}: {
  status: TaskStatus;
  label: string;
  tone: string;
  tasks: TaskRecord[];
  allTasks: TaskRecord[];
  members: Map<string, MemberOption>;
  today: string;
  readOnly: boolean;
  busyIds: Set<string>;
  activeOnMobile: boolean;
  quickTitle: string;
  onQuickTitle: (value: string) => void;
  onQuickAdd: () => void;
  onOpen: (task: TaskRecord) => void;
  onStatusChange: (task: TaskRecord, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    data: { type: "column", status },
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${activeOnMobile ? "mobile-active" : ""} ${isOver ? "is-over" : ""}`}
      aria-label={`${label} ${tasks.length} งาน`}
    >
      <header className="kanban-column-header">
        <span className={`kanban-column-dot ${tone}`} />
        <h2>{label}</h2>
        <span className="kanban-column-count">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-card-list">
          {tasks.map((task) => (
            <SortableKanbanCard
              key={task.id}
              task={task}
              subtasks={allTasks.filter((item) => item.parentTaskId === task.id)}
              member={task.assigneeId ? members.get(task.assigneeId) : undefined}
              today={today}
              readOnly={readOnly}
              busy={busyIds.has(task.id)}
              onOpen={() => onOpen(task)}
              onStatusChange={(nextStatus) => onStatusChange(task, nextStatus)}
            />
          ))}
          {tasks.length === 0 && <div className="kanban-column-empty">วาง Task ที่นี่</div>}
        </div>
      </SortableContext>
      {!readOnly && (
        <form className="kanban-quick-add" onSubmit={(event) => { event.preventDefault(); onQuickAdd(); }}>
          <input
            value={quickTitle}
            onChange={(event) => onQuickTitle(event.target.value)}
            placeholder={`เพิ่มงานใน “${label}”`}
            maxLength={200}
            aria-label={`ชื่องานใหม่ในสถานะ ${label}`}
          />
          <button type="submit" disabled={!quickTitle.trim()} aria-label={`เพิ่มงานในสถานะ ${label}`}><Plus size={17} /></button>
        </form>
      )}
    </section>
  );
}

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
  currentUserId,
  role,
  demoMode,
  today,
  initialFilters = {},
}: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [priority, setPriority] = useState(initialFilters.priority ?? "");
  const [assignee, setAssignee] = useState(initialFilters.assignee ?? "");
  const [mineOnly, setMineOnly] = useState(Boolean(initialFilters.mine));
  const [selectedId, setSelectedId] = useState(initialFilters.task ?? "");
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("todo");
  const [quickTitles, setQuickTitles] = useState<Record<TaskStatus, string>>({ todo: "", in_progress: "", done: "" });
  const [activeId, setActiveId] = useState("");
  const [busyIds, setBusyIds] = useState(() => new Set<string>());
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const tempIdSequence = useRef(0);
  const [isPending, startTransition] = useTransition();
  const readOnly = role === "guest";
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateUrl = (next: Partial<KanbanFilters>) => {
    const params = new URLSearchParams(window.location.search);
    const values: KanbanFilters = { q: search, priority, assignee, mine: mineOnly, task: selectedId, ...next };
    Object.entries(values).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, String(value));
    });
    params.set("view", "kanban");
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
    });
  }, [parentTasks, search, priority, assignee, mineOnly, currentUserId]);
  const tasksByStatus = useMemo(() => {
    return new Map(columns.map((column) => [
      column.status,
      filteredTasks.filter((task) => task.status === column.status).toSorted((a, b) => a.position - b.position),
    ]));
  }, [filteredTasks]);
  const selectedTask = tasks.find((task) => task.id === selectedId);
  const activeTask = tasks.find((task) => task.id === activeId);

  const markBusy = (id: string, value: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  };

  const applyPatch = (task: TaskRecord, patch: Partial<TaskMutationInput>, quiet = false) => {
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
    if (patch.status && patch.status !== task.status) {
      trackProductEvent("task_status_changed", { source_view: "kanban", from_status: task.status, to_status: patch.status });
    }
    if (demoMode) {
      if (!quiet) setNotice({ type: "success", text: "อัปเดต Kanban ในโหมดตัวอย่างแล้ว" });
      return;
    }

    markBusy(task.id, true);
    startTransition(async () => {
      const result = await updateTask(task.id, { projectId, ...patch });
      markBusy(task.id, false);
      if (!result.ok || !result.task) {
        setTasks(previous);
        setNotice({ type: "error", text: result.error || "บันทึก Kanban ไม่สำเร็จ ระบบคืนค่าเดิมแล้ว" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? result.task! : item));
      if (!quiet) setNotice({ type: "success", text: "บันทึกการเปลี่ยนแปลงแล้ว" });
      router.refresh();
    });
  };

  const addTask = (title: string, status: TaskStatus, parentTaskId: string | null = null) => {
    tempIdSequence.current += 1;
    const tempId = `temp-${projectId}-${tempIdSequence.current}`;
    const statusTasks = parentTasks.filter((task) => task.status === status);
    const task: TaskRecord = {
      id: tempId,
      projectId,
      parentTaskId,
      title,
      description: null,
      status,
      priority: null,
      assigneeId: null,
      startDate: null,
      dueDate: null,
      position: Math.max(0, ...statusTasks.map((item) => item.position)) + 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((current) => [...current, task]);
    trackProductEvent(parentTaskId ? "subtask_created" : "task_created", {
      source_view: "kanban",
      has_assignee: false,
      has_due_date: false,
    });
    if (demoMode) {
      setNotice({ type: "success", text: parentTaskId ? "เพิ่มงานย่อยในโหมดตัวอย่างแล้ว" : "เพิ่ม Task ในโหมดตัวอย่างแล้ว" });
      return;
    }

    markBusy(tempId, true);
    startTransition(async () => {
      const result = await createTask({ projectId, parentTaskId, title, status });
      markBusy(tempId, false);
      if (!result.ok || !result.task) {
        setTasks((current) => current.filter((item) => item.id !== tempId));
        setNotice({ type: "error", text: result.error || "สร้าง Task ไม่สำเร็จ" });
        return;
      }
      setTasks((current) => current.map((item) => item.id === tempId ? result.task! : item));
      setNotice({ type: "success", text: "สร้าง Task แล้ว" });
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
        setNotice({ type: "success", text: "ย้าย Task ออกจาก Kanban แล้ว" });
        trackProductEvent("task_deleted", { has_subtasks: tasks.some((item) => item.parentTaskId === task.id), source_view: "kanban" });
        router.refresh();
      }
    });
  };

  const openTask = (task: TaskRecord) => {
    setSelectedId(task.id);
    updateUrl({ task: task.id });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId("");
    const active = tasks.find((task) => task.id === String(event.active.id));
    if (!active || !event.over || readOnly) return;
    const overId = String(event.over.id);
    const overStatus = event.over.data.current?.status as TaskStatus | undefined;
    const destinationStatus = overId.startsWith("column:") ? overId.replace("column:", "") as TaskStatus : overStatus;
    if (!destinationStatus) return;

    const destinationBeforeMove = parentTasks
      .filter((task) => task.status === destinationStatus)
      .toSorted((a, b) => a.position - b.position);
    const activeOriginalIndex = destinationBeforeMove.findIndex((task) => task.id === active.id);
    const overOriginalIndex = destinationBeforeMove.findIndex((task) => task.id === overId);
    const withoutActive = destinationBeforeMove.filter((task) => task.id !== active.id);
    let insertIndex = overId.startsWith("column:") ? withoutActive.length : withoutActive.findIndex((task) => task.id === overId);
    if (insertIndex < 0) insertIndex = withoutActive.length;
    if (active.status === destinationStatus && activeOriginalIndex >= 0 && overOriginalIndex > activeOriginalIndex) insertIndex += 1;

    const previousTask = withoutActive[insertIndex - 1];
    const nextTask = withoutActive[insertIndex];
    const position = previousTask && nextTask
      ? (previousTask.position + nextTask.position) / 2
      : previousTask
        ? previousTask.position + 1000
        : nextTask
          ? Math.max(0, nextTask.position / 2)
          : 1000;
    if (destinationStatus === active.status && Math.abs(position - active.position) < 0.000001) return;
    applyPatch(active, { status: destinationStatus, position }, true);
  };

  const clearFilters = () => {
    setSearch(""); setPriority(""); setAssignee(""); setMineOnly(false);
    const params = new URLSearchParams();
    params.set("view", "kanban");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  };

  const hasFilters = Boolean(search || priority || assignee || mineOnly);

  return (
    <>
      <section className="task-toolbar kanban-toolbar workspace-panel">
        <div className="task-filter-row">
          <label className="task-search">
            <Search size={17} />
            <span className="sr-only">ค้นหางาน</span>
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
        <div className="task-filter-row secondary">
          {hasFilters && <button className="clear-filter-button" type="button" onClick={clearFilters}><FilterX size={16} /> ล้างตัวกรอง</button>}
          <span className="task-result-count">พบ {filteredTasks.length} งานหลัก</span>
        </div>
      </section>

      {notice && <div className={`task-notice ${notice.type}`} role="status" aria-live="polite">{notice.type === "error" ? <AlertCircle size={17} /> : <CircleCheck size={17} />}<span>{notice.text}</span><button className="icon-button" type="button" onClick={() => setNotice(null)} aria-label="ปิดข้อความ"><X size={16} /></button></div>}

      <div className="kanban-mobile-tabs" role="tablist" aria-label="สถานะงาน">
        {columns.map((column) => (
          <button
            key={column.status}
            type="button"
            role="tab"
            aria-selected={mobileStatus === column.status}
            className={mobileStatus === column.status ? "active" : ""}
            onClick={() => setMobileStatus(column.status)}
          >
            {column.label}<span>{tasksByStatus.get(column.status)?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <DndContext
        id={`kanban-${projectId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveId("")}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              {...column}
              tasks={tasksByStatus.get(column.status) ?? []}
              allTasks={tasks}
              members={memberMap}
              today={today}
              readOnly={readOnly}
              busyIds={busyIds}
              activeOnMobile={mobileStatus === column.status}
              quickTitle={quickTitles[column.status]}
              onQuickTitle={(value) => setQuickTitles((current) => ({ ...current, [column.status]: value }))}
              onQuickAdd={() => {
                const title = quickTitles[column.status].trim();
                if (!title) return;
                addTask(title, column.status);
                setQuickTitles((current) => ({ ...current, [column.status]: "" }));
              }}
              onOpen={openTask}
              onStatusChange={(task, status) => applyPatch(task, { status, position: Math.max(0, ...(tasksByStatus.get(status) ?? []).map((item) => item.position)) + 1000 })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <article className="kanban-card kanban-card-overlay">
              <KanbanCardContent
                task={activeTask}
                subtasks={tasks.filter((item) => item.parentTaskId === activeTask.id)}
                member={activeTask.assigneeId ? memberMap.get(activeTask.assigneeId) : undefined}
                today={today}
                readOnly
                busy={false}
              />
            </article>
          ) : null}
        </DragOverlay>
      </DndContext>

      {readOnly && <p className="kanban-read-only">Guest สามารถเปิดดูรายละเอียดได้ แต่ย้ายหรือแก้ไข Task ไม่ได้</p>}

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
          onAddSubtask={(title) => addTask(title, "todo", selectedTask.id)}
          onUpdateSubtask={applyPatch}
          onDelete={() => removeTask(selectedTask)}
        />
      )}
    </>
  );
}
