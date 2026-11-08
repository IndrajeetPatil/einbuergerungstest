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
 * Sets the settings through the API, so each test starts from a known state.
 * @param page - The page whose request context to use.
 * @param patch - Settings to change.
 */
async function setSettings(
  page: Page,
  patch: Record<string, unknown>,
): Promise<void> {
  const response = await page.request.put("/api/settings", { data: patch });
  expect(response.ok()).toBe(true);
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
 * Opens the dashboard with Berlin chosen and no session in progress.
 * @param page - The page.
 */
async function openDashboard(page: Page): Promise<void> {
  await setSettings(page, {
    state: "BE",
    examDate: "2030-11-11",
    showEnglish: true,
    shuffleOptions: true,
  });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start mock exam" }),
  ).toBeVisible();
}

export { expectAccessible, openDashboard, setSettings };
