import { AxeBuilder } from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

/**
 * Stores settings straight in the app's IndexedDB, then reloads, so each test
 * starts from a known state without clicking through the settings.
 * @param page - A page that has loaded the app.
 * @param patch - Settings to change.
 */
async function setSettings(
  page: Page,
  patch: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(async (settings) => {
    const request = indexedDB.open("einbuergerungstest");
    const opened = Promise.withResolvers<IDBDatabase>();
    request.addEventListener("success", () => {
      opened.resolve(request.result);
    });
    request.addEventListener("error", () => {
      opened.reject(request.error ?? new Error("could not open IndexedDB"));
    });
    const db = await opened.promise;
    const transaction = db.transaction("progress", "readwrite");
    transaction
      .objectStore("progress")
      .put({ version: 1, settings, sessions: [], answers: [] }, "progress");
    const written = Promise.withResolvers<undefined>();
    transaction.addEventListener("complete", () => {
      written.resolve(undefined);
    });
    transaction.addEventListener("abort", () => {
      written.reject(
        transaction.error ?? new Error("could not write settings"),
      );
    });
    await written.promise;
    db.close();
  }, patch);
  await page.reload();
}

/**
 * Switches the page to light or dark colours without storing a choice.
 * @param page - The page.
 * @param dark - Whether to show dark mode.
 */
async function showDark(page: Page, dark: boolean): Promise<void> {
  await page.evaluate((on) => {
    document.documentElement.classList.toggle("dark", on);
  }, dark);
}

/**
 * Audits the page in one colour theme.
 * @param page - The page to audit.
 * @param dark - Whether to audit dark mode.
 * @returns The violations, each prefixed with its theme.
 */
async function violationsIn(page: Page, dark: boolean): Promise<string[]> {
  await showDark(page, dark);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const theme = dark ? "dark" : "light";
  return results.violations.map(
    (violation) =>
      `${theme} ${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`,
  );
}

/**
 * Fails on any WCAG 2.2 AA or best-practice violation on the page, in light
 * and dark mode alike.
 * @param page - The page to audit.
 */
async function expectAccessible(page: Page): Promise<void> {
  // Instant colour transitions, so neither audit samples a half-faded state.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const wasDark = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  const found = [
    ...(await violationsIn(page, false)),
    ...(await violationsIn(page, true)),
  ];
  await showDark(page, wasDark);
  expect(found).toStrictEqual([]);
}

/**
 * Opens the dashboard with Berlin chosen.
 * @param page - The page.
 * @param patch - Settings to use instead of the defaults.
 */
async function openDashboard(
  page: Page,
  patch: Record<string, unknown> = {},
): Promise<void> {
  await page.goto("/");
  await expect(page.getByLabel("Bundesland")).toBeVisible();
  await setSettings(page, {
    state: "BE",
    examDate: "2030-11-11",
    showEnglish: true,
    shuffleOptions: true,
    ...patch,
  });
  await expect(
    page.getByRole("button", { name: "Start mock exam" }),
  ).toBeVisible();
}

export { expectAccessible, openDashboard };
