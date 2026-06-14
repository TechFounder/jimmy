import { test, expect } from "@playwright/test";

// Layout sanity that must hold at every viewport. Keyed off geometry and
// structural hooks only, so content edits won't invalidate these.

const widths = [320, 375, 640, 768, 1280];

for (const width of widths) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1); // allow sub-pixel rounding
  });
}

test.describe("nav breakpoint", () => {
  test("below 640px: hamburger shown, inline links hidden", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("[data-menu-toggle]")).toBeVisible();
    await expect(page.locator("nav ul")).toBeHidden();
  });

  test("at/above 640px: inline links shown, hamburger hidden", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/");
    await expect(page.locator("nav ul")).toBeVisible();
    await expect(page.locator("[data-menu-toggle]")).toBeHidden();
  });
});

test("logo never wraps to a second line", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const logo = page.locator('nav a[href="#top"]');
  const height = await logo.evaluate((el) => el.getBoundingClientRect().height);
  // A single line of the 15px logo is ~18-24px; two lines would be ~36px+.
  expect(height).toBeLessThan(30);
});
