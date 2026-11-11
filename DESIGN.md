---
version: alpha
name: Leben in Deutschland
description: >-
  A study app in the indrapatil.com identity — warm paper, ink, Fraunces
  headings, one teal accent, flat hairline surfaces, and a warm
  ink-and-ember dark mode — set like a well-made bilingual exam paper.
colors:
  primary: "{colors.accent}"
  bg: "#faf8f4"
  bg-alt: "#f2efe8"
  surface: "#fdfcf9"
  ink: "#201d18"
  muted: "#5d574c"
  accent: "#14584d"
  accent-light: "#0e7466"
  line: "#e3ded2"
  rust: "#9a3d2e"
  ochre: "#7a5410"
  moss: "#4d6220"
  slate: "#3f5b7d"
  plum: "#7d3f68"
  bg-dark: "#171410"
  bg-alt-dark: "#1d1a15"
  surface-dark: "#211d17"
  ink-dark: "#ede8de"
  muted-dark: "#a9a294"
  accent-dark: "#5eead4"
  accent-light-dark: "#99f6e4"
  line-dark: "#3a352c"
  rust-dark: "#e8a290"
  ochre-dark: "#dcb877"
  moss-dark: "#b4c98a"
  slate-dark: "#a3bedd"
  plum-dark: "#dda7cd"
typography:
  title:
    fontFamily: Fraunces Variable
    fontSize: 3.75rem
    fontWeight: 600
    lineHeight: 1.05
  heading:
    fontFamily: Fraunces Variable
    fontSize: 1.9rem
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: Hanken Grotesk Variable
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  label-chip:
    fontFamily: Hanken Grotesk Variable
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0.05em
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
components:
  page:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
  chip-neutral:
    textColor: "{colors.muted}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.sm}"
  chip-accent:
    textColor: "{colors.accent}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.sm}"
  chip-rust:
    textColor: "{colors.rust}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.sm}"
  chip-slate:
    textColor: "{colors.slate}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
---

# DESIGN.md

The visual design of the Einbürgerungstest trainer. It extends the
[indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md)
(the base), last reconciled with
[indrajeetpatil.github.io#386](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/pull/386).
Everything the base says applies here unless this file records a choice or an
addition below.

The tokens above mirror `src/index.css` (`@theme` for light mode, `.dark` for
the `-dark` counterparts), which is normative; when either changes, update the
other in the same commit. Both sets are the base values unchanged. When the base changes,
bring this app in line and move the reconciled reference forward.

## Overview

The app should feel like a calm, well-set exam paper: German and English side
by side, generous rows, quiet controls, and feedback that is clear without
being loud. It is a tool used daily for weeks before an exam, so density and
speed of reading matter more than editorial flourish. There is no homepage
portrait, career route, or ambient motion.

## Choices

| Base parameter | Choice here | Why |
| --- | --- | --- |
| Accent | Teal-green, the base default | Nothing about the subject calls for another accent. |
| Paper and ink | The base values, unchanged, in both modes | — |
| Chip hues | Accent, rust, and slate for states; ochre for the review flag | Moss and plum are defined but unused. |
| Dark mode | Supported: the base's warm ink-and-ember `.dark` set, class-based, following the system setting until the reader picks one | Study sessions often run late in the evening. |
| Type scale | No `display`; `title` and `heading` keep the base maxima with smaller minima | A narrow app column needs no display size. |
| Width | `max-w-5xl`, with `max-w-prose` for explanations | One working column on every screen. |
| Density | Masthead buttons and choice chips at 36px | Secondary, non-destructive controls; primary actions keep 44px. |

## State hues

| Meaning | Hue | Where |
| --- | --- | --- |
| Correct, passed, mastered | Accent | Verdict line, option key and row tint, pass chip, mastery bar and chip, exam series in the score chart |
| Correct once | Slate | Mastery bar and chip |
| Practice session | Slate | Session chip, practice series in the score chart |
| Wrong, not passed, missed | Rust | Verdict line, option key and row tint, pass chip, mastery bar and chip |
| Running out of time, errors | Rust | Timer under five minutes, error banner |
| Flagged for review | Ochre | Flag icon in the exam controls and overview |
| New | Neutral | Mastery chip; `line` in the mastery bar |

Every state carries text or an icon as well (a check or cross, "Richtig ·
Correct", a screen-reader note on the option row), never colour alone. Each
hue takes its `-dark` counterpart in dark mode, so the mapping is identical in
both.

## Dark mode

- **Switching:** a `.dark` class on `<html>`, with `color-scheme: dark`. The
  reader's choice is stored in `localStorage` (`lid.theme`); without one, the
  app follows `prefers-color-scheme` and keeps following it live. An inline
  script in `index.html` applies the same rule before first paint, so there
  is no flash of the other mode, and `theme-color` follows the page paper.
- **Accent fills:** the accent flips from dark teal to bright teal, so text on
  an accent or rust fill (primary buttons, option keys, choice chips) is set
  in `surface`, which is light paper in light mode and dark ink in dark mode.
- **Contrast:** every end-to-end accessibility audit runs in light and dark
  mode alike.

## Components

- **Masthead:** the app name in the serif at `text-lg` on the left, quiet
  navigation on the right (active link in semibold accent with
  `aria-current`), above a hairline. No sticky or blurred header. The theme
  toggle closes the row on every screen, including sessions: a quiet,
  icon-only 36px square button with a moon icon, the accessible name
  "Dunkler Modus · Dark mode" and `aria-pressed`, in the accent while dark
  mode is on.
- **Dashboard opening:** an asymmetric `1.4fr / 1fr` spread — field mark,
  `text-title` heading, and muted standfirst on the left; the exam date and
  countdown in a right-aligned folio column.
- **Start cards:** the mock exam and practice cards are the app's only cards
  (`surface`, hairline, 6px radius), each with a serif heading, a folio
  subtitle, and a full-width primary button pinned to the bottom.
- **Question:** the German question in semibold ink, the English beside it in
  muted ink behind a hairline divider (`md:border-l`, 2.5rem gutter), stacking
  on mobile. The English toggle hides the right-hand column.
- **Answer options:** radio rows with a 28px keyed square (`A`–`D`, or a check
  or cross once judged). Chosen and correct rows take an accent tint of 7–8%
  and a 3px accent leading bar; a wrong choice takes the same in rust. The key
  square fills with the state hue and carries the focus ring for the hidden
  radio.
- **Feedback:** a 2px leading rule in the verdict hue, the verdict line with
  its icon, and an explanation under a "Warum · Why" folio mark. In the
  results review of wrong answers, the correct and the chosen answer always
  show their English, even with the English column hidden.
- **Official pictures:** question images sit on a white mat (`bg-white`,
  hairline, 6px radius, inner padding). This is the one pure-white surface, in
  both modes, because the official BAMF pictures are drawn on white and look
  grubby on paper. The picture credit sits below the mat, on the page colours,
  so its muted ink holds contrast in dark mode.
- **Progress:** the native `<progress>` as a 4px accent bar on a `line`
  track, with a tabular caption below.
- **Mastery bar:** an 8px segmented bar (accent, slate, rust, `line`) with 2px
  gaps and a legend of tabular counts and bilingual labels.
- **Score chart:** a hand-drawn SVG. Hairline `line` gridlines, 11px muted
  tabular axis labels, a 2px accent line for mock exams with 4.5px points
  and slate 4px points for practice, all ringed in `surface`. Reference lines
  for the pass mark (muted) and exam day (accent, the goal) carry 11px
  uppercase labels. The hover tooltip is a `surface` card with a hairline.
- **Result score:** the score as a 4rem semibold figure with `/ 33` in muted
  ink, beside the pass chip.
- **Stat tiles:** a muted label above a `text-3xl` semibold figure in a
  definition list.
- **Lists:** weak spots, the catalogue, and the review list are open rows
  between hairlines, with a folio question id, never cards.
- **Dialogues and banners:** as in the base recipes: native `<dialog>` with an
  ink backdrop at 25% (in dark mode, where ink is light, the backdrop is `bg`
  at 70% instead, so it dims rather than glows); resume banner outlined in the
  accent at 40%, error banner in rust at 40%.
- **Dropdowns:** the base select recipe, including the picker shadow where
  `appearance: base-select` is supported. The chevron is an inline SVG drawn
  in `muted`, with a second copy in `muted-dark` for dark mode.
- **Sources footer:** small muted text with accent links above a top
  hairline.

## Copy

- Every visible German string has an English counterpart, joined as
  `Deutsch · English`. Headings that are proper names of the exam
  (*Prüfungssimulation*, *Üben*) may stand alone with the English in a folio
  subtitle.
- English copy uses British spelling; question text keeps the official
  wording.
- Information never lives in a native `title` tooltip; it is shown visibly.

## Drift

Differences from the base that are not deliberate choices. Fix them when the
area is next touched, or propose them as shared rules in the base.

| Here | Base |
| --- | --- |
| Tokens named `ink`, `muted`, `line`, and unprefixed hue names | `text`, `text-muted`, `border`, `chip-*` |
| `.field-mark` and `.folio-mark` tracked at 0.08em | 0.18em and 0.16em |
| `.rule-ticks` 9px tall with ticks every 24px | 7px tall with ticks every 14px |
| Chip variants written as CSS classes (`.chip-*`) | Recipes exported from one constants module |
