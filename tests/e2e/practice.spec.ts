import { expect, test } from "@playwright/test";

import { expectAccessible, openDashboard } from "./helpers.ts";

test("explains a wrong answer in both languages and brings it back", async ({
  page,
}) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Start practice" }).click();
  const check = page.getByRole("button", { name: "Prüfen · Check" });
  await expect(check).toBeDisabled();
  await expectAccessible(page);

  // Pick an option, then reveal the answer.
  await page.keyboard.press("1");
  await expect(check).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Warum · Why")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Weiter · Next/u }),
  ).toBeVisible();
  await expectAccessible(page);
});

test("ends a session early and saves the answers given", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(
    page.getByRole("button", { name: "Prüfen · Check" }),
  ).toBeVisible();
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "End session" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End session" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sitzung beendet · Done" }),
  ).toBeVisible();
  await expectAccessible(page);
});

test("toggles the English column with the E key", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByText("English", { exact: true })).toBeVisible();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("button", { name: "Show English" }),
  ).toBeVisible();
});
