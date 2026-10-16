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

const targetsFormControl = (selector: string) =>
  /^(?:textarea|select|input|button|video|svg)(?![\w-])/u.test(selector);
const setsRingShadow = (body: string) =>
  /(?:^|[;\s])box-shadow\s*:/u.test(body);

describe("global form-control focus styles", () => {
  const resetRules = rules.filter(
    ({ selectors, body }) =>
      selectors.some(targetsFormControl) &&
      (setsOutline(body) || setsRingShadow(body))
  );

  it("never cancels the outline or ring of a keyboard-focused control", () => {
    expect(resetRules.length).toBeGreaterThan(0);
    for (const { selectors } of resetRules) {
      for (const selector of selectors.filter(targetsFormControl)) {
        // Outside .tailwind-scope this reset is !important, so it outranks
        // every focus-visible:tw-ring-* and tw-outline-* utility. It has to
        // exclude :focus-visible to keep keyboard focus visible (WCAG 2.4.7).
        expect(selector).toContain(":not(:focus-visible)");
      }
    }
  });

  it("keeps cancelling the outline and ring for pointer-only focus", () => {
    const pointerReset = resetRules.find(({ selectors }) =>
      selectors.includes(
        "button:not(.tailwind-scope button):not(:focus-visible)"
      )
    );

    expect(pointerReset?.body).toMatch(/outline:\s*0\s*!important/u);
    expect(pointerReset?.body).toMatch(/box-shadow:\s*none\s*!important/u);
  });

  it("does not bundle the font-size rule with the focus reset", () => {
    const fontSize = rules.find(
      ({ selectors, body }) =>
        selectors.includes("button:not(.tailwind-scope button)") &&
        /font-size:\s*16px/u.test(body)
    );

    expect(fontSize).toBeDefined();
    expect(setsOutline(fontSize?.body ?? "")).toBe(false);
    expect(setsRingShadow(fontSize?.body ?? "")).toBe(false);
  });
});
