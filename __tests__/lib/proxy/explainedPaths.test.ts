import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  EXPLAINED_UNKNOWN_PAGE_PATH,
  explainedUnknownTarget,
  isUnknownExplainedPath,
} from "@/lib/proxy/explainedPaths";

/**
 * Every page under /explained is known to the proxy, and every other
 * address there is answered with 6529 Explained's not-found view.
 */
const HUB = path.resolve(__dirname, "../../../app/explained");

/** Every folder under app/explained that holds a page, at any depth. */
function pages(dir = HUB, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("_") || entry.startsWith("[")) continue;
    const route = `${prefix}${entry}`;
    if (readdirSync(full).includes("page.tsx")) found.push(route);
    found.push(...pages(full, `${route}/`));
  }
  return found;
}

describe("6529 Explained's addresses", () => {
  it("knows every page the app defines", () => {
    const found = pages();
    expect(found).toEqual(
      expect.arrayContaining(["kit", "not-found-view", "validators/hardware"])
    );
    for (const page of found) {
      expect([page, isUnknownExplainedPath(`/explained/${page}`)]).toEqual([
        page,
        false,
      ]);
    }
    expect(isUnknownExplainedPath("/explained")).toBe(false);
    expect(isUnknownExplainedPath("/explainedx")).toBe(false);
  });

  it("answers any other address with the not-found view", () => {
    for (const unknown of [
      "/explained/no-such-page",
      "/explained/validators",
      "/explained/validators/hardware/more",
      "/explained/kit/more",
    ]) {
      expect(isUnknownExplainedPath(unknown)).toBe(true);
    }
    const target = explainedUnknownTarget(
      new URL("https://6529.io/explained/nope?locale=de-DE")
    );
    expect(target.pathname).toBe(EXPLAINED_UNKNOWN_PAGE_PATH);
    expect(target.searchParams.get("locale")).toBe("de-DE");
  });
});
