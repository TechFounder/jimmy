import { test, expect, type Page } from "@playwright/test";

// Guards the scroll-offset fix: clicking a nav link should land the target
// section's content just below the fixed pill — not buried under it, and not
// floating far below it. We assert against the section's first child (its
// eyebrow label) rather than the padded section box, and poll until the
// Lenis smooth-scroll settles.

async function expectLandsBelowNav(page: Page, sectionId: string) {
  await expect(async () => {
    const navBottom = await page
      .locator("[data-nav-pill]")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const contentTop = await page
      .locator(`${sectionId} p`)
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(contentTop).toBeGreaterThan(navBottom); // clears the pill
    expect(contentTop - navBottom).toBeLessThan(80); // sits close to it
  }).toPass({ timeout: 5000 });
}

test.describe("desktop anchor links", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const id of ["#about", "#work"]) {
    test(`${id} lands just below the nav`, async ({ page }) => {
      await page.goto("/");
      await page.locator(`nav a[href="${id}"]`).click();
      await expectLandsBelowNav(page, id);
    });
  }
});

test("mobile menu link lands the section below the nav", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.locator("[data-menu-toggle]").click();
  await page.locator('[data-menu-panel] a[href="#about"]').click();
  await expectLandsBelowNav(page, "#about");
});
