import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US";
import { t } from "@/i18n/messages";

// getAppMetadata appends " | <hostname>" to every description, and search
// results cut descriptions at roughly 160 characters.
const MAX_DESCRIPTION_LENGTH = 150;
const MIN_DESCRIPTION_WORDS = 6;
const SECTION_LABEL_DESCRIPTION =
  /description:\s*"(?:Tools|Network|Open Data)"/;

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

const PAGE_DESCRIPTION_KEYS = Object.keys(EN_US_MESSAGES).filter(
  (key): key is keyof typeof EN_US_MESSAGES =>
    /^pageMetadata\..+\.description$/.test(key) ||
    /^emma\.(?:plans?\.)?metadata\.description$/.test(key)
);

describe("page meta descriptions", () => {
  it("covers every page-level description message", () => {
    expect(PAGE_DESCRIPTION_KEYS.length).toBeGreaterThanOrEqual(22);
  });

  it.each(PAGE_DESCRIPTION_KEYS)(
    "%s is a specific sentence that fits a search snippet",
    (key) => {
      const description = t(DEFAULT_LOCALE, key);

      expect(description.endsWith(".")).toBe(true);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      expect(description.split(/\s+/).length).toBeGreaterThanOrEqual(
        MIN_DESCRIPTION_WORDS
      );
    }
  );

  it("does not leave a bare section label as a route description", () => {
    const offenders = listSourceFiles(join(process.cwd(), "app"))
      .filter((file) =>
        SECTION_LABEL_DESCRIPTION.test(readFileSync(file, "utf8"))
      )
      .map((file) => relative(process.cwd(), file).split("\\").join("/"));

    expect(offenders).toEqual([]);
  });
});
