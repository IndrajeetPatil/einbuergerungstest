import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// This file configures Vite+ as a whole: the dev and build servers, the
// formatter (Oxfmt), the linter (Oxlint), the unit tests (Vitest) and the
// task runner. The lint policy mirrors indrajeetpatil.github.io: every Oxlint
// category is an error, with narrow, explained exceptions only.

const isCI = Boolean(process.env["CI"]);

// Generated output and personal data never get formatted or linted.
const GENERATED = [
  "coverage/**",
  "dist/**",
  "data/**",
  ".cache/**",
  ".fallow/**",
  "playwright-report/**",
  "test-results/**",
];

const LINT_PLUGINS = [
  "eslint",
  "typescript",
  "unicorn",
  "oxc",
  "import",
  "jsdoc",
  "promise",
  "node",
  "vitest",
  "react",
  "react-perf",
  "jsx-a11y",
] as const;

const TEST_FILES = ["**/*.test.ts"];
const NODE_FILES = ["scripts/**", "tests/e2e/**", "*.config.ts"];

export default defineConfig({
  // GitHub Pages serves the site from /<repository>/; local runs use the root.
  base: process.env["BASE_PATH"] ?? "/",
  server: { port: 5178, strictPort: true, host: "127.0.0.1" },
  preview: { port: 5179, strictPort: true, host: "127.0.0.1" },
  build: {
    target: "es2024",
    rolldownOptions: {
      output: {
        // Keep the question catalogue apart from app code so each caches on
        // its own.
        codeSplitting: {
          groups: [
            { name: "catalogue", test: /catalogue\.json/u },
            {
              name: "react",
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/u,
            },
          ],
        },
      },
    },
  },
  // Make targets and CI call these tasks. Caching stays off: checks must always
  // run against the current tree.
  run: {
    tasks: {
      check: { command: "vp check --deny-warnings", cache: false },
      "test:unit": { command: "vp test --run --coverage", cache: false },
      fallow: {
        command: "fallow --fail-on-issues --coverage coverage",
        dependsOn: ["test:unit"],
        cache: false,
      },
      "test:e2e": {
        command: "playwright test",
        dependsOn: ["build"],
        cache: false,
      },
      build: { command: "vp build", cache: false },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    reporters: isCI ? ["dot", "github-actions"] : ["default"],
    // Undo `vi.spyOn` and module mocks before each test so they cannot leak.
    restoreMocks: true,
    unstubGlobals: true,
    // Shuffle files and tests on every run so order dependencies surface.
    sequence: { shuffle: true },
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      // `json` writes coverage-final.json for fallow's CRAP scores.
      reporter: ["text", "html", "json"],
      include: ["src/lib/**/*.ts"],
      exclude: [
        "**/*.test.*",
        "src/lib/testing.ts",
        // React hooks and the IndexedDB layer run in the browser; the E2E
        // suite exercises them end to end.
        "src/lib/use*.ts",
        "src/lib/api.ts",
        "src/lib/progressDb.ts",
      ],
      // Floors sit just under current coverage, so it can only ratchet up.
      thresholds: {
        statements: 97,
        branches: 92,
        functions: 98,
        lines: 97,
      },
    },
  },
  fmt: {
    // One entry per line with a trailing comma, so additions and removals
    // touch a single line.
    printWidth: 80,
    trailingComma: "all",
    objectWrap: "preserve",
    singleAttributePerLine: true,
    sortImports: {},
    ignorePatterns: [
      ...GENERATED,
      // Markdown belongs to rumdl; the catalogue is generated.
      "**/*.md",
      "src/data/catalogue.json",
      "pnpm-lock.yaml",
      "skills-lock.json",
    ],
  },
  lint: {
    plugins: [...LINT_PLUGINS],
    categories: {
      correctness: "error",
      suspicious: "error",
      pedantic: "error",
      perf: "error",
      style: "error",
      restriction: "error",
    },
    env: {
      browser: true,
      node: true,
      builtin: true,
    },
    ignorePatterns: GENERATED,
    options: {
      typeAware: true,
      typeCheck: true,
      reportUnusedDisableDirectives: "error",
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",

      // Security: block code injection through string-evaluating escape hatches.
      "import/no-dynamic-require": ["error", { esmodule: true }],
      "no-eval": "error",
      "no-new-func": "error",
      "typescript/no-implied-eval": "error",

      // Cyclomatic complexity matches the Fallow health gate.
      complexity: ["error", { max: 5 }],
      // Object keys follow the APIs they are passed to.
      "id-length": ["error", { properties: "never" }],
      // Zero, one, and "last" are not magic.
      "no-magic-numbers": ["error", { ignore: [-1, 0, 1] }],
      // Components compose layout from a few nested elements; deeper trees are
      // split into components.
      "react/jsx-max-depth": ["error", { max: 5 }],

      // Match the conventions the codebase already follows.
      "capitalized-comments": [
        "error",
        "always",
        { ignoreConsecutiveComments: true, ignorePattern: "[cv]8|istanbul" },
      ],
      "one-var": ["error", "never"],
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      // Promise-returning functions are `async` (promise-function-async);
      // the type-aware variant accepts those that return a promise directly.
      "require-await": "off",
      "typescript/require-await": "error",
      "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
      // `void promise` marks a deliberately unawaited promise.
      "no-void": ["error", { allowAsStatement: true }],
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      // Labelled sections that scroll sideways take focus so keyboard users
      // can scroll them (axe: scrollable-region-focusable).
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        { tags: ["section"], roles: ["tabpanel"] },
      ],

      // Contradictory pairs: each module picks the export style that suits it,
      // the DOM and React use `null` for "nothing", and TypeScript uses
      // `undefined` for "absent".
      "import/no-default-export": "off",
      "import/no-named-export": "off",
      "import/prefer-default-export": "off",
      "import/group-exports": "off",
      "unicorn/no-null": "off",
      "no-undefined": "off",
      // Non-null assertions are banned (no-non-null-assertion), so `as` must not
      // be rewritten to one.
      "typescript/non-nullable-type-assertion-style": "off",
      // A const object and its union type share a name by design.
      "no-redeclare": "off",

      // Obsolete here: the ES2024 target has native async/await, optional
      // chaining, and object spread.
      "oxc/no-async-await": "off",
      "oxc/no-optional-chaining": "off",
      "oxc/no-rest-spread-properties": "off",

      // Owned by stricter or dedicated tools: Oxfmt sorts imports, ls-lint
      // enforces file names, and the complexity rule plus Fallow's health
      // gate bound function size better than line and statement counts.
      "sort-imports": "off",
      "unicorn/filename-case": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      // Oxfmt prints hexadecimal digits in lowercase.
      "unicorn/number-literal-case": "off",
      // TypeScript checks default imports against each package's own types.
      "import/default": "off",

      // Rules that forbid core language or React idioms outright: sorted keys
      // would reorder meaningful sequences, ternaries are how JSX renders
      // conditionally, inferred return types are already checked by
      // `typeCheck`, user-facing copy is the content of this app rather than
      // something to extract, and inline event handlers are idiomatic React.
      "sort-keys": "off",
      "no-ternary": "off",
      "typescript/explicit-function-return-type": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-literals": "off",
      "react-perf/jsx-no-new-function-as-prop": "off",
      // TypeScript owns parameter and return types; JSDoc must not repeat them.
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      // DOM and React types are mutable by design.
      "typescript/prefer-readonly-parameter-types": "off",
      // The vitest plugin's rules apply to every file; this one only makes
      // sense in test files, where the override re-enables it.
      "vitest/require-hook": "off",
    },
    overrides: [
      {
        files: TEST_FILES,
        rules: {
          "vitest/consistent-test-it": ["error", { fn: "test" }],
          "vitest/require-hook": "error",
          // Contradicts vitest/prefer-called-once for single calls.
          "vitest/prefer-called-times": "off",
          // Contradict vitest/prefer-strict-boolean-matchers.
          "vitest/prefer-to-be-truthy": "off",
          "vitest/prefer-to-be-falsy": "off",
          "vitest/valid-title": ["error", { allowArguments: true }],
          // Tests import `test` and `expect` explicitly.
          "vitest/no-importing-vitest-globals": "off",
          // Setup hooks and flat files of focused tests are intended.
          "vitest/no-hooks": "off",
          "vitest/require-top-level-describe": "off",
          // The global test timeout applies; async assertions are awaited and
          // checked by `typescript/no-floating-promises` instead.
          "vitest/require-test-timeout": "off",
          "vitest/prefer-expect-assertions": "off",
          // Fixture sizes and expected counts are clearer inline.
          "no-magic-numbers": "off",
        },
      },
      {
        files: ["tests/e2e/**"],
        rules: {
          // Playwright Test, not Vitest.
          "vitest/prefer-importing-vitest-globals": "off",
          "vitest/consistent-test-filename": "off",
          "vitest/prefer-each": "off",
          "vitest/require-hook": "off",
          "vitest/no-standalone-expect": "off",
          "vitest/expect-expect": "off",
          "vitest/no-conditional-in-test": "off",
          // Playwright steps must run sequentially within a page.
          "no-await-in-loop": "off",
          "no-magic-numbers": "off",
        },
      },
      {
        // Node-run code reads the environment, prints results, and uses
        // node:fs, whose APIs are synchronous by design.
        files: NODE_FILES,
        rules: {
          "node/no-top-level-await": "off",
          "node/no-process-env": "off",
          "node/no-sync": "off",
          "import/no-nodejs-modules": "off",
          "no-console": "off",
        },
      },
      {
        // Plain JavaScript has no type annotations, so every value is `any`
        // to the type-aware rules.
        files: ["**/*.{js,mjs,cjs}"],
        rules: {
          "typescript/strict-boolean-expressions": "off",
          "typescript/no-unsafe-argument": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-call": "off",
          "typescript/no-unsafe-member-access": "off",
          "typescript/no-unsafe-return": "off",
        },
      },
      {
        // The lint policy is one declarative list; splitting it across modules
        // would hide which rules are on.
        files: ["vite.config.ts"],
        rules: {
          "max-lines": "off",
        },
      },
    ],
  },
  plugins: [react(), tailwindcss()],
});
