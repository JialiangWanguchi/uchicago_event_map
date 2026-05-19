import { test, expect } from "@playwright/test";

test("home page loads explore UI", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /what's happening on campus/i })).toBeVisible();
  await expect(page.getByLabel("Search events")).toBeVisible();
  await expect(page.getByText("Campus map")).toBeVisible();
});

test("filter shortcuts update URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Happening now" }).click();
  await expect(page).toHaveURL(/happeningNow=1/);
  await page.getByRole("button", { name: "Smart search" }).click();
  await expect(page).toHaveURL(/semantic=1/);
});

test("top nav links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Saved" }).click();
  await expect(page).toHaveURL(/\/saved/);
});
