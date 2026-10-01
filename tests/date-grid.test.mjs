import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTaskProgress,
  createDateGrid,
  dateToPixel,
  getTaskDateRange,
  moveTaskDates,
  pixelToDate,
  resizeTaskDates,
  validateDateRange,
} from "../src/lib/date-grid.ts";

test("normalizes full, due-only, start-only, and undated ranges", () => {
  assert.deepEqual(getTaskDateRange({ startDate: "2026-09-01", dueDate: "2026-09-03" }), {
    startDate: "2026-09-01", endDate: "2026-09-03", kind: "range",
  });
  assert.equal(getTaskDateRange({ startDate: null, dueDate: "2026-09-03" })?.kind, "milestone");
  assert.equal(getTaskDateRange({ startDate: "2026-09-01", dueDate: null })?.kind, "start-only");
  assert.equal(getTaskDateRange({ startDate: null, dueDate: null }), null);
});

test("week grid aligns to Monday/Sunday and maps dates to pixels round-trip", () => {
  const grid = createDateGrid([{ startDate: "2026-09-27", dueDate: "2026-10-02" }], "2026-09-27", "week");
  assert.equal(new Date(`${grid.startDate}T00:00:00Z`).getUTCDay(), 1);
  assert.equal(new Date(`${grid.endDate}T00:00:00Z`).getUTCDay(), 0);
  const pixel = dateToPixel("2026-09-27", grid);
  assert.equal(pixelToDate(pixel, grid), "2026-09-27");
});

test("month grid includes task dates and reports invalid ranges", () => {
  const grid = createDateGrid([{ startDate: "2026-01-15", dueDate: "2026-03-20" }], "2026-02-01", "month");
  assert.ok(grid.startDate <= "2026-01-15");
  assert.ok(grid.endDate >= "2026-03-20");
  assert.equal(validateDateRange("2026-09-10", "2026-09-09"), "กำหนดส่งต้องไม่อยู่ก่อนวันที่เริ่ม");
  assert.equal(validateDateRange("2026-09-10", "2026-09-10"), null);
});

test("move and resize preserve partial dates and valid ordering", () => {
  assert.deepEqual(moveTaskDates({ startDate: null, dueDate: "2026-09-10" }, 2), { startDate: null, dueDate: "2026-09-12" });
  assert.deepEqual(moveTaskDates({ startDate: "2026-09-10", dueDate: null }, -2), { startDate: "2026-09-08", dueDate: null });
  assert.deepEqual(resizeTaskDates({ startDate: "2026-09-10", dueDate: "2026-09-12" }, "start", 8), { startDate: "2026-09-12", dueDate: "2026-09-12" });
  assert.deepEqual(resizeTaskDates({ startDate: "2026-09-10", dueDate: null }, "end", 3), { startDate: "2026-09-10", dueDate: "2026-09-13" });
});

test("calculates parent progress from subtasks and falls back to task status", () => {
  assert.equal(calculateTaskProgress({ status: "in_progress" }, []), 0);
  assert.equal(calculateTaskProgress({ status: "done" }, []), 100);
  assert.equal(calculateTaskProgress(
    { status: "in_progress" },
    [{ status: "done" }, { status: "done" }, { status: "todo" }],
  ), 67);
});
