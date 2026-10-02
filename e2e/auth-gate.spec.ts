import { expect, test } from "@playwright/test";

const protectedPath = "/projects/00000000-0000-0000-0000-000000000001?view=gantt";

test("protected project routes preserve the return URL at every supported breakpoint", async ({ page }) => {
  await page.goto(protectedPath);

  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole("heading", { name: "เข้าสู่พื้นที่ทำงาน" })).toBeVisible();
  await expect(page.getByLabel("อีเมล")).toBeVisible();
  await expect(page.getByLabel("รหัสผ่าน")).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue(protectedPath);

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeVisible();
  }

  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
});

test("profile remains behind the mandatory login gate", async ({ page }) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  await expect(page.locator('input[name="next"]')).toHaveValue("/profile");
  await expect(page.getByRole("heading", { name: "เข้าสู่พื้นที่ทำงาน" })).toBeVisible();
});
