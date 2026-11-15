import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import {
  DARK_QUERY,
  otherTheme,
  preferredTheme,
  saveTheme,
  storedTheme,
  systemTheme,
} from "./theme.ts";

const store = new Map<string, string>();

/**
 * Stubs the system colour preference.
 * @param dark - Whether the system prefers dark colours.
 */
function prefersDark(dark: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark && query === DARK_QUERY,
  }));
}

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  prefersDark(false);
});

describe(preferredTheme, () => {
  test("follows the system until the reader chooses", () => {
    expect(preferredTheme()).toBe("light");
    prefersDark(true);
    expect([systemTheme(), preferredTheme()]).toStrictEqual(["dark", "dark"]);
    saveTheme("light");
    expect([storedTheme(), preferredTheme()]).toStrictEqual(["light", "light"]);
  });

  test("ignores a malformed stored value", () => {
    store.set("lid.theme", "sepia");
    prefersDark(true);
    expect([storedTheme(), preferredTheme()]).toStrictEqual([null, "dark"]);
  });
});

describe(saveTheme, () => {
  test("stores a choice that differs from the system", () => {
    saveTheme("dark");
    expect(storedTheme()).toBe("dark");
  });

  test("keeps the choice when the system later matches it", () => {
    saveTheme("dark");
    prefersDark(true);
    expect(storedTheme()).toBe("dark");
  });

  test("returns to the system when the choice matches it", () => {
    saveTheme("dark");
    saveTheme("light");
    expect(storedTheme()).toBeNull();
    prefersDark(true);
    expect(preferredTheme()).toBe("dark");
  });
});

describe(otherTheme, () => {
  test("flips between light and dark", () => {
    expect([otherTheme("light"), otherTheme("dark")]).toStrictEqual([
      "dark",
      "light",
    ]);
  });
});
