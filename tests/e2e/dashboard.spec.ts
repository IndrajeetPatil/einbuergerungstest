import { expect, test } from "@playwright/test";

import { expectAccessible, openDashboard, setSettings } from "./helpers.ts";

test("asks for the Bundesland on first launch", async ({ page }) => {
  await setSettings(page, { state: null, examDate: null });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Wo wohnen Sie? · Where do you live?" }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel("Bundesland").selectOption("BE");
  await expect(
    page.getByRole("button", { name: "Start mock exam" }),
  ).toBeVisible();
});

test("shows start cards, progress and settings", async ({ page }) => {
  await openDashboard(page);
  await expect(
    page.getByRole("heading", { name: "Fortschritt · Progress" }),
  ).toBeVisible();
  await expect(page.getByText("days to go")).toBeVisible();
  await expectAccessible(page);
});

test("searches the catalogue in German or English", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("link", { name: "Fragenkatalog", exact: true }).click();
  await page.getByLabel("Search questions").fill("coat of arms");
  await expect(page.getByText(/\d+ shown/u)).not.toHaveText("310 shown");
  await expect(
    page.getByText("Welches Wappen gehört zum Bundesland Berlin?"),
  ).toBeVisible();
  await expectAccessible(page);
});

test("lists time-dependent answers with the last check", async ({ page }) => {
  await openDashboard(page);
  await page
    .getByRole("link", { name: "Aktuelles · Current affairs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aktuelles · Current affairs" }),
  ).toBeVisible();
  await expect(page.getByText("Zuletzt geprüft am")).toBeVisible();
  await expect(
    page.getByText(
      "Wie heißt die jetzige Bundeskanzlerin/der jetzige Bundeskanzler von Deutschland?",
    ),
  ).toBeVisible();
  await expect(page.getByText("Up to date")).toHaveCount(5);
  await expectAccessible(page);
});
