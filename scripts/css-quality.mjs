#!/usr/bin/env node
/**
 * CSS code quality checker using @projectwallace/css-code-quality.
 *
 * Scores each CSS source file across three dimensions and fails if
 * maintainability or complexity drop below the configured thresholds.
 * Performance is reported but not enforced: the @import statements
 * required by Tailwind CSS v4 and the font packages inflate the
 * penalty at analysis time even though they are resolved at build time.
 */

import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";

import { calculate } from "@projectwallace/css-code-quality";

const THRESHOLDS = {
  maintainability: 98,
  complexity: 100,
};

const files = await Array.fromAsync(glob("src/**/*.css"));

if (files.length === 0) {
  console.log("No CSS files found.");
  process.exit(0);
}

// Column width that aligns the dimension names in the report.
const DIMENSION_LABEL_WIDTH = 14;

let failed = false;

for (const file of files.toSorted((left, right) =>
  left.localeCompare(right, "en"),
)) {
  // Files are reported in order, one at a time.
  // oxlint-disable-next-line no-await-in-loop
  const css = await readFile(file, "utf8");
  const result = calculate(css);
  const { performance, maintainability, complexity } = result;

  const label = path.relative(process.cwd(), file);
  console.log(`\n${label} (scores out of 100)`);

  const rows = [
    {
      dimension: "performance",
      data: performance,
      note: " [not enforced: @imports are resolved at build time]",
    },
    { dimension: "maintainability", data: maintainability, note: "" },
    { dimension: "complexity", data: complexity, note: "" },
  ];
  for (const { dimension, data, note } of rows) {
    const threshold = THRESHOLDS[dimension];
    const below = threshold !== undefined && data.score < threshold;
    let marker = styleText("blue", "ℹ");
    if (threshold !== undefined) {
      marker = styleText(below ? "red" : "green", below ? "✗" : "✓");
    }
    const thresh = threshold === undefined ? "" : ` (min: ${threshold})`;
    console.log(
      `  ${marker} ${dimension.padEnd(DIMENSION_LABEL_WIDTH)}  ${data.score}/100${thresh}${note}`,
    );
    if (below) {
      for (const violation of data.violations) {
        console.log(
          `      ↳ ${violation.id}: −${violation.score} pts (value: ${violation.value})`,
        );
      }
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    `\nCSS quality check failed. Minimum thresholds: maintainability >= ${THRESHOLDS.maintainability}, complexity >= ${THRESHOLDS.complexity}.`,
  );
  process.exit(1);
} else {
  console.log(styleText("green", "\nCSS quality check passed."));
}
