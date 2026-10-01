import { track } from "@vercel/analytics";

export type ProductAnalyticsEvent =
  | "project_created"
  | "task_created"
  | "subtask_created"
  | "task_status_changed"
  | "task_dates_changed"
  | "view_changed"
  | "filter_applied"
  | "task_deleted"
  | "permission_denied";

type AnalyticsValue = string | number | boolean | null;

const allowedProperties: Record<ProductAnalyticsEvent, readonly string[]> = {
  project_created: ["role"],
  task_created: ["source_view", "has_assignee", "has_due_date"],
  subtask_created: ["source_view"],
  task_status_changed: ["source_view", "from_status", "to_status"],
  task_dates_changed: ["source_view", "method"],
  view_changed: ["from_view", "to_view"],
  filter_applied: ["view", "filter_type"],
  task_deleted: ["has_subtasks", "source_view"],
  permission_denied: ["role", "attempted_action"],
};

export function trackProductEvent(event: ProductAnalyticsEvent, properties: Record<string, AnalyticsValue> = {}) {
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => allowedProperties[event].includes(key)),
  );

  track(event, safeProperties);
  window.dispatchEvent(new CustomEvent("task-tracking:analytics", {
    detail: { event, ...safeProperties },
  }));
}
