import { test, expect } from "@playwright/test";

// A failed submission must surface a *visible* error — the status line turns
// red (is-error), not the muted progress tint it uses for "Sending…".
test.describe("contact modal error state", () => {
  test("empty submit shows a red error message", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-open-modal]:visible").first().click();

    const modal = page.locator("[data-modal]");
    await expect(modal).toHaveClass(/is-open/);

    await page.locator("#contact-form button[type=submit]").click();

    const status = page.locator("#form-status");
    await expect(status).toHaveText(/please fill in all fields/i);
    await expect(status).toHaveClass(/is-error/);

    // The error tint must be the danger red, distinct from muted secondary text.
    const color = await status.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(248, 113, 113)"); // #f87171
  });
});
