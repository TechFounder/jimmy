import { test, expect } from "@playwright/test";

// Mobile dropdown behavior. All assertions are on the toggle/panel hooks and
// aria state — independent of the link labels.

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("toggle opens and closes the panel", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-menu-toggle]");
    const panel = page.locator("[data-menu-panel]");

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });

  test("closes when a menu link is tapped", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    await page.locator('[data-menu-panel] a[href="#about"]').click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("closes on Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("closes on outside click", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    await expect(page.locator("[data-menu-panel]")).toBeVisible();
    await page.mouse.click(10, 400); // away from panel and toggle
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("closes when resized past the breakpoint", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
