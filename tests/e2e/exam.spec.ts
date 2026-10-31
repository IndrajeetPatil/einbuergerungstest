import { expect, test } from "@playwright/test";

import { expectAccessible, openDashboard } from "./helpers.ts";

const QUESTIONS = 33;

test("runs a mock exam from start to result", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Start mock exam" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText("Frage 1 von 33")).toBeVisible();
  await expectAccessible(page);

  for (let index = 0; index < QUESTIONS; index += 1) {
    await page.keyboard.press(String((index % 4) + 1));
    if (index === 2) {
      await page.keyboard.press("f");
    }
    await page.keyboard.press("ArrowRight");
  }

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("33 of 33 questions answered, 1 flagged");
  await expectAccessible(page);
  await dialog.getByRole("button", { name: "Abgeben · Submit" }).click();

  await expect(
    page.getByRole("heading", { name: "Ergebnis · Result" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Bestanden · Passed|Nicht bestanden · Not passed/u),
  ).toBeVisible();
  await expectAccessible(page);
});

test("records the exam on the dashboard", async ({ page }) => {
  await openDashboard(page);
  await expect(
    page.getByRole("heading", { name: "Verlauf · Session history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Mock exam" }).first(),
  ).toBeVisible();
});
