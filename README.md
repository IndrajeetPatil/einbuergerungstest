# Leben in Deutschland — Einbürgerungstest trainer

A personal study app for the German citizenship test (_Einbürgerungstest_ /
_Leben in Deutschland_). Every question is shown in German and English side by
side, so the exam language and your own build a direct correspondence. Your
results are saved locally, so you can watch your score climb towards exam day.

## What you can do

- **Take a mock exam** — the real format: 33 questions (30 general, 3 about
  your Bundesland), 60 minutes, 17 correct to pass.
- **Practise with explanations** — immediate feedback in both languages, an
  explanation of _why_ the answer is right, and missed questions coming back a
  few questions later.
- **Track your progress** — score chart up to exam day, catalogue coverage,
  weak spots and a daily streak.
- **Look things up** — a searchable read-through of all 310 questions that can
  come up for you.

## Quick start

```sh
make install   # once
make start     # builds, serves on http://localhost:5179 and opens the browser
```

Pick your Bundesland on first launch. Run `make` to see every other command.

## How it works

```mermaid
flowchart LR
  BAMF["Official BAMF<br/>question catalogue"] -- "make data" --> Catalogue[["Bilingual question<br/>catalogue"]]
  Catalogue --> App["Browser app<br/>(React)"]
  App <-- "answers, scores" --> Server["Local server<br/>(Node)"]
  Server <--> DB[("Your progress<br/>(SQLite file)")]
```

The questions are built once from the official catalogue, then everything runs
on your machine: the browser app asks the questions, and a small local server
checks each answer against the official key and stores it.

```mermaid
flowchart LR
  Practise["Practise or<br/>mock exam"] --> Feedback["Bilingual feedback<br/>and explanation"]
  Feedback --> Retry["Missed questions<br/>come back"]
  Retry --> Mastery["Two in a row<br/>= mastered"]
  Mastery --> Dashboard["Dashboard:<br/>score over time"]
  Dashboard --> Practise
```

## Tech stack

| Layer      | Tools                                                                   |
| ---------- | ----------------------------------------------------------------------- |
| App        | React 19, Tailwind CSS 4, TypeScript 7                                  |
| Server     | Node 26 with its built-in SQLite (`node:sqlite`)                        |
| Toolchain  | [Vite+](https://viteplus.dev): Vite 8 / Rolldown, Oxlint, Oxfmt, Vitest |
| Data build | Python 3.15 (uv, Ruff, ty), poppler                                     |

Most of the tooling is written in Rust (Rolldown, Oxc, Tailwind's engine, uv,
Ruff, ty, prek) for fast feedback.

## Documentation

| Read                                           | For                                                      |
| ---------------------------------------------- | -------------------------------------------------------- |
| [Quiz design](docs/quiz-design.md)             | Exam rules, questionnaire practices, smart mix, mastery  |
| [Architecture](docs/architecture.md)           | Components, request flow, API                            |
| [Progress database](docs/progress-database.md) | Schema, scoring, backups, and why `node:sqlite`          |
| [Question data](docs/question-data.md)         | Sources, cross-validation, pictures, new BAMF editions   |
| [Development](docs/development.md)             | Commands, checks, git hooks, CI, versions, agent tooling |
| [AGENTS.md](AGENTS.md)                         | Conventions for coding agents                            |

> [!NOTE]
> Questions and pictures come from the official BAMF catalogue (edition
> 07.05.2025); some pictures are third-party photos, so this repository stays
> private and is meant for personal study.
