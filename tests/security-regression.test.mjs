import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function sourceFiles(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(`${relative}/`));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(relative);
  }
  return files;
}

test("client and server source never reference privileged Supabase secrets", async () => {
  const files = await sourceFiles("src/");
  const contents = await Promise.all(files.map((file) => readFile(new URL(file, root), "utf8")));
  const combined = contents.join("\n");
  assert.doesNotMatch(combined, /SUPABASE_SERVICE_ROLE|service_role_key|sb_secret_[a-z0-9_-]+/i);
  const adminClient = await readFile(new URL("src/lib/supabase/admin.ts", root), "utf8");
  assert.match(adminClient, /import "server-only"/);
  assert.match(adminClient, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_[A-Z_]*SECRET/);
});

test("foundation migration keeps exposed tables behind RLS and removes anon grants", async () => {
  const migration = await readFile(new URL("supabase/migrations/20260927034154_phase_1_foundation.sql", root), "utf8");
  for (const table of ["profiles", "workspaces", "workspace_members", "projects", "tasks"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(migration, /revoke all on public\.profiles[\s\S]*from anon/i);
  assert.match(migration, /create policy tasks_update_editor[\s\S]*using[\s\S]*with check/i);
});

test("task mutations retain validation and server-side editor authorization", async () => {
  const actions = await readFile(new URL("src/app/tasks/actions.ts", root), "utf8");
  assert.match(actions, /safeParse\(input\)/);
  assert.match(actions, /workspace\.workspace\.role === "guest"/);
  assert.match(actions, /workspace\.projects\.some/);
  assert.match(actions, /validateDateRange/);
});

test("product analytics only permits privacy-safe properties", async () => {
  const analytics = await readFile(new URL("src/lib/analytics.ts", root), "utf8");
  assert.doesNotMatch(analytics, /["'](?:title|description|email|task_id|project_id|workspace_id)["']/);
  assert.match(analytics, /allowedProperties/);
  assert.match(analytics, /Object\.entries\(properties\)\.filter/);
});

test("profile mutations authenticate and scope changes to the signed-in user", async () => {
  const actions = await readFile(new URL("src/app/profile/actions.ts", root), "utf8");
  assert.match(actions, /supabase\.auth\.getUser\(\)/);
  assert.match(actions, /\.eq\("id", user\.id\)/);
  assert.match(actions, /supabase\.auth\.updateUser\(\{/);
  assert.match(actions, /current_password: parsed\.data\.currentPassword/);
  assert.doesNotMatch(actions, /SERVICE_ROLE|secret[_-]?key/i);
});

test("member account creation stays server-only and checks workspace admin access", async () => {
  const accountCreation = await readFile(new URL("src/lib/members/create-account.ts", root), "utf8");
  const route = await readFile(new URL("src/app/api/members/route.ts", root), "utf8");
  const adminClient = await readFile(new URL("src/lib/supabase/admin.ts", root), "utf8");
  assert.match(accountCreation, /workspace\.workspace\.role !== "admin"/);
  assert.match(accountCreation, /admin\.auth\.admin\.createUser\(\{/);
  assert.match(accountCreation, /email_confirm: true/);
  assert.match(accountCreation, /admin\.auth\.admin\.deleteUser\(created\.user\.id\)/);
  assert.doesNotMatch(accountCreation, /console\.(?:log|error|warn)/);
  assert.match(route, /isSameOrigin\(request\)/);
  assert.doesNotMatch(route, /console\.(?:log|error|warn)/);
  assert.match(adminClient, /import "server-only"/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_[A-Z_]*SECRET/);
});
