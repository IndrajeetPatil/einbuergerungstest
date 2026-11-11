import { expect, test } from "@playwright/test";
import { z } from "zod";

import { expectAccessible } from "./helpers.ts";

// Search engines, AI assistants and social networks read the page without
// running the app, so these check the static HTML and files they fetch.

const CANONICAL = "https://www.indrapatil.com/einbuergerungstest/";

const App = z.object({
  "@type": z.literal("WebApplication"),
  url: z.literal(CANONICAL),
  image: z.string(),
});

const Crumb = z.object({ item: z.string() });
const Breadcrumbs = z.object({
  "@type": z.literal("BreadcrumbList"),
  itemListElement: z.array(Crumb),
});

const Icon = z.object({ src: z.string() });
const Manifest = z.object({
  start_url: z.literal("./"),
  icons: z.array(Icon),
});

test("describes the page for search engines and social cards", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const head = page.locator("head");
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    CANONICAL,
  );
  await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const image = await head
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(image).toBe(`${CANONICAL}og-image.png`);
  await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    image ?? "",
  );
  const card = await request.get("/og-image.png");
  expect(card.ok()).toBe(true);
  expect(card.headers()["content-type"]).toBe("image/png");

  const [app, crumbs] = await head
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(App.parse(JSON.parse(app ?? "")).image).toBe(image);
  expect(
    Breadcrumbs.parse(JSON.parse(crumbs ?? "")).itemListElement.at(-1)?.item,
  ).toBe(CANONICAL);
});

test("serves the web app manifest and its icons", async ({ request }) => {
  const manifest = await request.get("/site.webmanifest");
  expect(manifest.ok()).toBe(true);
  const { icons } = Manifest.parse(await manifest.json());
  for (const { src } of icons) {
    const icon = await request.get(`/${src}`);
    expect(icon.ok(), src).toBe(true);
  }
});

test("serves the sitemap and llms.txt", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain(`<loc>${CANONICAL}</loc>`);

  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBe(true);
  expect(await llms.text()).toMatch(/^# Leben in Deutschland/u);
});

test("ships a noindex 404 page that links back to the app", async ({
  page,
}) => {
  await page.goto("/404.html");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
  await expect(
    page.getByRole("link", { name: "Zur App · Open the app" }),
  ).toHaveAttribute("href", CANONICAL);
  await expectAccessible(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("summarises the app", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Leben in Deutschland – Einbürgerungstest trainer",
      }),
    ).toBeVisible();
    // Playwright's text selectors skip <noscript>, so match the landmark.
    await expect(page.getByRole("main")).toContainText(
      "Please enable JavaScript",
    );
  });
});
