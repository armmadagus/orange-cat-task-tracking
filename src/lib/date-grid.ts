import type { TaskRecord } from "@/lib/types";

export type TimelineZoom = "week" | "month";

export type DateGridCell = {
  date: string;
  day: number;
  isWeekend: boolean;
};

export type DateGridGroup = {
  key: string;
  label: string;
  startIndex: number;
  span: number;
};

export type DateGrid = {
  startDate: string;
  endDate: string;
  dayWidth: number;
  totalWidth: number;
  cells: DateGridCell[];
  groups: DateGridGroup[];
  todayOffset: number;
};

export type TaskDateRange = {
  startDate: string;
  endDate: string;
  kind: "range" | "milestone" | "start-only";
};

const DAY_MS = 86_400_000;
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function parts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function dateToDayIndex(value: string) {
  const { year, month, day } = parts(value);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

export function dayIndexToDate(value: number) {
  return new Date(value * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number) {
  return dayIndexToDate(dateToDayIndex(value) + amount);
}

function startOfWeek(value: string) {
  const index = dateToDayIndex(value);
  const weekday = new Date(index * DAY_MS).getUTCDay();
  return dayIndexToDate(index - ((weekday + 6) % 7));
}

function endOfWeek(value: string) {
  return addDays(startOfWeek(value), 6);
}

function startOfMonth(value: string) {
  const { year, month } = parts(value);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function endOfMonth(value: string) {
  const { year, month } = parts(value);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function addMonths(value: string, amount: number) {
  const { year, month } = parts(value);
  return new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 10);
}

export function getTaskDateRange(task: Pick<TaskRecord, "startDate" | "dueDate">): TaskDateRange | null {
  if (!task.startDate && !task.dueDate) return null;
  if (!task.startDate && task.dueDate) {
    return { startDate: task.dueDate, endDate: task.dueDate, kind: "milestone" };
  }
  if (task.startDate && !task.dueDate) {
    return { startDate: task.startDate, endDate: task.startDate, kind: "start-only" };
  }
  return { startDate: task.startDate!, endDate: task.dueDate!, kind: "range" };
}

export function validateDateRange(startDate: string | null | undefined, dueDate: string | null | undefined) {
  return Boolean(startDate && dueDate && dueDate < startDate)
    ? "กำหนดส่งต้องไม่อยู่ก่อนวันที่เริ่ม"
    : null;
}

export function createDateGrid(
  tasks: Array<Pick<TaskRecord, "startDate" | "dueDate">>,
  today: string,
  zoom: TimelineZoom,
): DateGrid {
  const datedValues = tasks.flatMap((task) => [task.startDate, task.dueDate].filter((value): value is string => Boolean(value)));
  const earliest = datedValues.reduce((value, date) => date < value ? date : value, today);
  const latest = datedValues.reduce((value, date) => date > value ? date : value, today);
  const startDate = zoom === "week"
    ? startOfWeek(addDays(earliest, -14))
    : startOfMonth(addMonths(earliest, -1));
  const endDate = zoom === "week"
    ? endOfWeek(addDays(latest, 14))
    : endOfMonth(addMonths(latest, 1));
  const startIndex = dateToDayIndex(startDate);
  const endIndex = dateToDayIndex(endDate);
  const dayWidth = zoom === "week" ? 44 : 24;
  const cells: DateGridCell[] = [];
  const groups: DateGridGroup[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    const date = dayIndexToDate(index);
    const dayOfWeek = new Date(index * DAY_MS).getUTCDay();
    cells.push({ date, day: parts(date).day, isWeekend: dayOfWeek === 0 || dayOfWeek === 6 });
    const groupKey = zoom === "week" ? startOfWeek(date) : date.slice(0, 7);
    const current = groups.at(-1);
    if (current?.key === groupKey) current.span += 1;
    else {
      const { year, month, day } = parts(date);
      const label = zoom === "week"
        ? `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`
        : `${THAI_MONTHS[month - 1]} ${year + 543}`;
      groups.push({ key: groupKey, label, startIndex: cells.length - 1, span: 1 });
    }
  }

  return {
    startDate,
    endDate,
    dayWidth,
    totalWidth: cells.length * dayWidth,
    cells,
    groups,
    todayOffset: (dateToDayIndex(today) - startIndex) * dayWidth,
  };
}

export function dateToPixel(date: string, grid: Pick<DateGrid, "startDate" | "dayWidth">) {
  return (dateToDayIndex(date) - dateToDayIndex(grid.startDate)) * grid.dayWidth;
}

export function pixelToDate(pixel: number, grid: Pick<DateGrid, "startDate" | "dayWidth">) {
  return addDays(grid.startDate, Math.round(pixel / grid.dayWidth));
}

export function moveTaskDates(task: Pick<TaskRecord, "startDate" | "dueDate">, dayDelta: number) {
  return {
    startDate: task.startDate ? addDays(task.startDate, dayDelta) : null,
    dueDate: task.dueDate ? addDays(task.dueDate, dayDelta) : null,
  };
}

export function resizeTaskDates(
  task: Pick<TaskRecord, "startDate" | "dueDate">,
  edge: "start" | "end",
  dayDelta: number,
) {
  const range = getTaskDateRange(task);
  if (!range) return { startDate: null, dueDate: null };
  if (edge === "start") {
    const candidate = addDays(range.startDate, dayDelta);
    return { startDate: candidate > range.endDate ? range.endDate : candidate, dueDate: task.dueDate };
  }
  const candidate = addDays(range.endDate, dayDelta);
  return { startDate: task.startDate, dueDate: candidate < range.startDate ? range.startDate : candidate };
}

export function formatThaiDate(value: string) {
  const { year, month, day } = parts(value);
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}

export function calculateTaskProgress(
  task: Pick<TaskRecord, "status">,
  subtasks: Array<Pick<TaskRecord, "status">>,
) {
  if (subtasks.length === 0) return task.status === "done" ? 100 : 0;
  return Math.round((subtasks.filter((item) => item.status === "done").length / subtasks.length) * 100);
}
