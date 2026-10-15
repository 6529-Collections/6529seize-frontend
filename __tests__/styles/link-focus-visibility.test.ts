import fs from "node:fs";
import path from "node:path";

type CssRule = {
  readonly selectors: readonly string[];
  readonly body: string;
};

const globalStyles = fs
  .readFileSync(path.join(process.cwd(), "styles", "globals.css"), "utf8")
  .replaceAll(/\/\*[\s\S]*?\*\//gu, "");

// Innermost `selector { declarations }` blocks, including rules nested in
// @layer and @media blocks.
const rules: readonly CssRule[] = Array.from(
  globalStyles.matchAll(/([^{}]+)\{([^{}]*)\}/gu),
  ([, selectorList = "", body = ""]) => ({
    selectors: selectorList.split(",").map((selector) => selector.trim()),
    body,
  })
);

const targetsLink = (selector: string) => /^a(?![\w-])/u.test(selector);
const setsOutline = (body: string) => /(?:^|[;\s])outline\s*:/u.test(body);

describe("global link focus styles", () => {
  it("never cancels the outline of a keyboard-focused link", () => {
    const linkOutlineRules = rules.filter(
      ({ selectors, body }) => selectors.some(targetsLink) && setsOutline(body)
    );

    expect(linkOutlineRules.length).toBeGreaterThan(0);
    for (const { selectors } of linkOutlineRules) {
      for (const selector of selectors.filter(targetsLink)) {
        // `a { outline: 0 !important }` outranks every
        // focus-visible:tw-outline-* utility and hides keyboard focus
        // (WCAG 2.4.7). Link resets must exclude :focus-visible.
        expect(selector).toContain(":not(:focus-visible)");
      }
    }
  });

  it("keeps cancelling the outline for pointer-only focus", () => {
    const pointerReset = rules.find(({ selectors }) =>
      selectors.includes("a:where(:not(:focus-visible))")
    );

    expect(pointerReset?.body).toMatch(/outline:\s*0\s*!important/u);
  });
});
