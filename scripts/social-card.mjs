#!/usr/bin/env node
/**
 * Renders the social sharing card (Open Graph and Twitter image) and the app
 * icons (Apple touch icon and web app manifest icons) into public/ with
 * Playwright's Chromium.
 *
 * The card follows DESIGN.md: warm paper, Fraunces headings, Hanken Grotesk
 * text, the teal accent, hairline rules and no shadows. Run `make social-card`
 * after changing the copy or the design tokens, and commit the images.
 */

import { readFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

// Open Graph's recommended 1.91:1 size.
const CARD = { width: 1200, height: 630 };

// Maskable icons keep the mark inside the central 80% safe zone, since
// launchers crop them to circles or rounded squares.
const MASKABLE_SCALE = "80%";
const ICONS = [
  { path: "public/apple-touch-icon.png", size: 180, scale: "100%" },
  { path: "public/icon-192.png", size: 192, scale: "100%" },
  { path: "public/icon-512.png", size: 512, scale: "100%" },
  { path: "public/icon-maskable-512.png", size: 512, scale: MASKABLE_SCALE },
];

const FONTS = "node_modules/@fontsource-variable";

/**
 * Inlines a font file as a data URL, so the page needs no file access.
 * @param path - Font file under node_modules.
 * @returns A `data:` URL for an `@font-face` rule.
 */
async function fontUrl(path) {
  const font = await readFile(`${FONTS}/${path}`);
  return `data:font/woff2;base64,${font.toString("base64")}`;
}

const fraunces = await fontUrl(
  "fraunces/files/fraunces-latin-opsz-normal.woff2",
);
const hanken = await fontUrl(
  "hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
);
const favicon = await readFile("public/favicon.svg", "utf8");

const STYLE = `
  @font-face { font-family: Fraunces; src: url(${fraunces}) format("woff2"); font-weight: 100 900; }
  @font-face { font-family: Hanken; src: url(${hanken}) format("woff2"); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body {
    background: #faf8f4; color: #201d18;
    font-family: Hanken, sans-serif;
    padding: 64px 72px; display: flex; flex-direction: column;
  }
  .top { display: flex; align-items: center; gap: 20px; }
  .top svg { width: 56px; height: 56px; }
  .mark {
    color: #14584d; font-weight: 600; font-size: 22px;
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  h1 {
    font-family: Fraunces, serif; font-weight: 600;
    font-size: 92px; line-height: 1.05; letter-spacing: -0.01em;
    margin-top: 28px;
  }
  .lede { color: #5d574c; font-size: 30px; line-height: 1.4; margin-top: 16px; }
  .pair {
    display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
    border-top: 1px solid #e3ded2; border-bottom: 1px solid #e3ded2;
    padding: 24px 0; margin-top: 36px;
  }
  .pair p { font-size: 24px; line-height: 1.4; }
  .pair .lang {
    color: #5d574c; font-size: 16px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;
  }
  .pair .answer { color: #14584d; font-weight: 600; margin-top: 6px; }
  .foot {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-top: auto; font-size: 24px; color: #5d574c;
  }
  .foot strong { color: #201d18; font-weight: 600; }
`;

const CARD_HTML = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>${STYLE}</style></head>
<body>
  <div class="top">${favicon}<p class="mark">Einbürgerungstest · Citizenship test</p></div>
  <h1>Leben in Deutschland</h1>
  <p class="lede">Deutsch und Englisch nebeneinander · German and English side by side</p>
  <div class="pair">
    <div>
      <p class="lang">Deutsch</p>
      <p>In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …</p>
      <p class="answer">hier Meinungsfreiheit gilt.</p>
    </div>
    <div>
      <p class="lang">English</p>
      <p>In Germany, people may openly say things against the government because …</p>
      <p class="answer">freedom of expression applies here.</p>
    </div>
  </div>
  <p class="foot">
    <span><strong>Probetest · Mock exam</strong> — kostenlos · free</span>
    <span>indrapatil.com/einbuergerungstest</span>
  </p>
</body></html>`;

/**
 * A page that draws the favicon on a full-bleed paper background.
 * @param scale - Size of the mark relative to the icon.
 * @returns The icon page.
 */
function iconHtml(scale) {
  return `<!doctype html>
<html><head><style>
  * { margin: 0; }
  body {
    background: #faf8f4; width: 100vw; height: 100vh;
    display: grid; place-items: center;
  }
  svg { display: block; width: ${scale}; height: ${scale}; }
</style></head><body>${favicon}</body></html>`;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: CARD });
  await page.setContent(CARD_HTML);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.screenshot({ path: "public/og-image.png" });

  for (const { path, size, scale } of ICONS) {
    // Each icon reuses the page, so they render one after another.
    // oxlint-disable-next-line no-await-in-loop
    await page.setViewportSize({ width: size, height: size });
    // oxlint-disable-next-line no-await-in-loop
    await page.setContent(iconHtml(scale));
    // oxlint-disable-next-line no-await-in-loop
    await page.screenshot({ path });
  }
} finally {
  await browser.close();
}
console.log("Wrote the social card and app icons to public/");
