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

function pages(): string[] {
  return readdirSync(HUB).filter((entry) => {
    const full = path.join(HUB, entry);
    if (!statSync(full).isDirectory()) return false;
    if (entry.startsWith("_") || entry.startsWith("[")) return false;
    return readdirSync(full).includes("page.tsx");
  });
}

describe("6529 Explained's addresses", () => {
  it("knows every page the app defines", () => {
    const found = pages();
    expect(found).toEqual(expect.arrayContaining(["kit", "not-found-view"]));
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
