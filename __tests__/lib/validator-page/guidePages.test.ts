/** @jest-environment node */
import {
  VALIDATOR_GUIDE_PAGES,
  VALIDATOR_GUIDE_PATHS,
} from "@/lib/validator-page/content/guidePages";

// The same rule as ValidatorMarkdown's heading ids.
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/['’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

const headingIds = (markdown: string) =>
  new Set(
    markdown
      .split("\n")
      .filter((line) => /^#{2,3} /.test(line))
      .map((line) => slugify(line.replace(/^#+ /, "")))
  );

const pageBySlug = new Map(
  VALIDATOR_GUIDE_PAGES.map((page) => [page.slug, page])
);

const links = (markdown: string) =>
  [...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]!);

describe("validator setup guide pages", () => {
  it("starts with the start page and has one entry per slug", () => {
    expect(VALIDATOR_GUIDE_PAGES[0]?.slug).toBe("");
    expect(pageBySlug.size).toBe(VALIDATOR_GUIDE_PAGES.length);
  });

  it.each(VALIDATOR_GUIDE_PAGES.map((page) => [page.navTitle, page]))(
    "%s: every link inside the guide reaches a page and a heading",
    (_title, page) => {
      for (const href of links(page.markdown)) {
        if (href.startsWith("#")) {
          expect(headingIds(page.markdown)).toContain(href.slice(1));
          continue;
        }
        if (!href.startsWith("/validator/guide")) {
          continue;
        }
        const [path = "", anchor] = href.split("#");
        const slug = path.replace(/^\/validator\/guide\/?/, "");
        const target = pageBySlug.get(slug);
        expect(target).toBeDefined();
        if (anchor && target) {
          expect(headingIds(target.markdown)).toContain(anchor);
        }
      }
    }
  );

  it.each(VALIDATOR_GUIDE_PAGES.map((page) => [page.navTitle, page.markdown]))(
    "%s: no draft marker, em dash or reference link is left",
    (_title, markdown) => {
      for (const marker of [
        "[check",
        "[measure",
        "[link",
        "[needs test",
        "{{",
        "](WAVE)",
        "][",
        "—",
      ]) {
        expect(markdown).not.toContain(marker);
      }
    }
  );

  it("links each path card to a page", () => {
    for (const path of VALIDATOR_GUIDE_PATHS) {
      expect(
        pageBySlug.get(path.href.replace("/validator/guide/", ""))
      ).toBeDefined();
    }
  });
});
