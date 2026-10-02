import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const mutationProjectId = process.env.E2E_PROJECT_ID;
const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "true";

async function login(page: Page) {
  await page.goto("/login?next=/");
  await page.getByLabel("อีเมล").fill(email!);
  await page.getByLabel("รหัสผ่าน").fill(password!);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "โปรเจกต์ของทีม" })).toBeVisible();
}

test.describe("authenticated workspace", () => {
  test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in the process environment.");

  test("keeps the task summary consistent across every task view", async ({ page }) => {
    await login(page);
    const projectLink = page.locator('a[href^="/projects/"]').first();
    test.skip(await projectLink.count() === 0, "The authenticated workspace needs at least one project.");

    await projectLink.click();
    const summary = page.locator(".task-summary strong").first();
    const expectedCount = await summary.innerText();

    for (const view of ["บอร์ดคัมบัง", "รายการงาน", "ไทม์ไลน์", "แผนภูมิแกนต์"]) {
      await page.getByRole("link", { name: view }).click();
      await expect(page.locator(".task-summary strong").first()).toHaveText(expectedCount);
    }

    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  });

  test("shows the signed-in user's profile without exposing password data", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "โปรไฟล์ของฉัน" }).first().click();

    await expect(page.getByRole("heading", { name: "โปรไฟล์ของฉัน" })).toBeVisible();
    await expect(page.getByLabel("ชื่อที่แสดง")).toBeVisible();
    await expect(page.getByLabel("อีเมล")).toHaveValue(email!);
    await expect(page.getByLabel("รหัสผ่านปัจจุบัน")).toHaveValue("");
    await expect(page.getByLabel("รหัสผ่านใหม่", { exact: true })).toHaveValue("");
  });

  test("creates one shared task, verifies every view, and soft-deletes it", async ({ page }) => {
    test.skip(!allowMutations || !mutationProjectId, "Set E2E_ALLOW_MUTATIONS=true and E2E_PROJECT_ID to opt into disposable task mutations.");
    await login(page);

    const title = `E2E shared task ${Date.now()}`;
    await page.goto(`/projects/${mutationProjectId}?view=list`);
    await page.getByPlaceholder("เพิ่ม Task ใหม่ด้วยชื่ออย่างเดียว...").fill(title);
    await page.getByRole("button", { name: "เพิ่ม Task" }).click();
    await expect(page.getByRole("button", { name: title }).first()).toBeVisible();

    await page.getByRole("link", { name: "บอร์ดคัมบัง" }).click();
    await page.getByPlaceholder("ค้นหาจากชื่องาน...").fill(title);
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

    await page.getByRole("link", { name: "ไทม์ไลน์" }).click();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

    await page.getByRole("link", { name: "รายการงาน" }).click();
    await page.getByRole("button", { name: title }).first().click();
    const dialog = page.getByRole("dialog", { name: `รายละเอียด ${title}` });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await dialog.getByLabel("วันที่เริ่ม").fill("2026-09-28");
    await dialog.getByLabel("กำหนดส่ง").fill("2026-10-02");
    await dialog.getByRole("button", { name: "บันทึกข้อมูล" }).click();
    await expect(page.getByText("บันทึกการเปลี่ยนแปลงแล้ว")).toBeVisible();
    await dialog.getByRole("button", { name: "ปิด", exact: true }).click();

    await page.getByRole("link", { name: "ไทม์ไลน์" }).click();
    await expect(page.locator(".timeline-bar", { hasText: title })).toBeVisible();

    await page.getByRole("link", { name: "แผนภูมิแกนต์" }).click();
    await expect(page.locator(".gantt-table-cell", { hasText: title })).toBeVisible();
    await expect(page.locator(".gantt-bar", { hasText: title })).toBeVisible();

    await page.getByRole("link", { name: "รายการงาน" }).click();
    await page.getByRole("button", { name: title }).first().click();
    await expect(dialog).toBeVisible();

    page.once("dialog", (confirmation) => confirmation.accept());
    await dialog.getByRole("button", { name: "ลบงานนี้" }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });
});
