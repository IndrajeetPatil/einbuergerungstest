import { expect, test } from "@playwright/test";
import { z } from "zod";

// Search engines, AI assistants and social networks read the page without
// running the app, so these check the static HTML and files they fetch.

const CANONICAL = "https://www.indrapatil.com/einbuergerungstest/";

const StructuredData = z.object({
  "@type": z.literal("WebApplication"),
  url: z.literal(CANONICAL),
  image: z.string(),
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

  const json = await head
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = StructuredData.parse(JSON.parse(json ?? ""));
  expect(data.image).toBe(image);
});

test("serves the sitemap and llms.txt", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain(`<loc>${CANONICAL}</loc>`);

  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBe(true);
  expect(await llms.text()).toMatch(/^# Leben in Deutschland/u);
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
