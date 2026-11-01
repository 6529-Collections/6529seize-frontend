import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  TDH_UNKNOWN_PAGE_PATH,
  isUnknownTdhChapterPath,
  tdhUnknownTarget,
} from "@/lib/proxy/tdhChapterPaths";

/**
 * Every page of the TDH chapter is known to the proxy, and every other
 * address under /network/tdh is answered with the chapter's not-found view.
 */
const CHAPTER = path.resolve(__dirname, "../../../app/network/tdh");

function routes(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) {
      if ((entry === "page.tsx" || entry === "route.ts") && prefix !== "") {
        found.push(prefix);
      }
      continue;
    }
    if (entry.startsWith("_") || entry.startsWith("[")) continue;
    found.push(...routes(full, prefix ? `${prefix}/${entry}` : entry));
  }
  return found;
}

describe("the TDH chapter's addresses", () => {
  it("knows every page the app defines", () => {
    const pages = routes(CHAPTER);
    expect(pages.length).toBeGreaterThan(10);
    for (const page of pages) {
      expect([page, isUnknownTdhChapterPath(`/network/tdh/${page}`)]).toEqual([
        page,
        false,
      ]);
    }
    expect(isUnknownTdhChapterPath("/network/tdh")).toBe(false);
    expect(isUnknownTdhChapterPath("/network/tdh/verification/20758")).toBe(
      false
    );
    expect(isUnknownTdhChapterPath("/network/xtdh")).toBe(false);
  });

  it("answers any other address with the chapter's not-found view", () => {
    for (const unknown of [
      "/network/tdh/no-such-page",
      "/network/tdh/proofs/extra",
      "/network/tdh/verification/20758/more",
      "/network/tdh/overview",
    ]) {
      expect([unknown, isUnknownTdhChapterPath(unknown)]).toEqual([
        unknown,
        true,
      ]);
    }
    const target = tdhUnknownTarget(
      new URL("https://6529.io/network/tdh/nope?_rsc=1")
    );
    expect(target.pathname).toBe(TDH_UNKNOWN_PAGE_PATH);
    expect(target.searchParams.get("_rsc")).toBe("1");
  });
});
