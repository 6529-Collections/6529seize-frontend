import {
  getUnexpectedAxeViolations,
  summarizeAxeViolations,
  validateAxeAllowances,
  type AxeViolationAllowance,
} from "../../tests/support/a11yAllowlist";

const activeAllowance: AxeViolationAllowance = {
  expires: "2026-12-31",
  owner: "frontend-accessibility",
  reason: "Known debt while route migration is in progress.",
  route: "/the-memes?locale=de-DE",
  ruleId: "color-contrast",
  selector: ".known-contrast-debt",
};

describe("Playwright axe assertions", () => {
  it("rejects expired and broad axe allowlist entries", () => {
    const errors = validateAxeAllowances(
      [
        {
          ...activeAllowance,
          expires: "2026-01-01",
          selector: "main",
        },
      ],
      new Date("2026-06-20T00:00:00.000Z")
    );

    expect(errors).toEqual([
      "color-contrast: selector is too broad",
      "color-contrast: allowance expired on 2026-01-01",
    ]);
  });

  it("rejects empty selectors and non-real expiry dates", () => {
    const errors = validateAxeAllowances(
      [
        {
          ...activeAllowance,
          expires: "2026-02-31",
          selector: "   ",
        },
      ],
      new Date("2026-01-01T00:00:00.000Z")
    );

    expect(errors).toEqual([
      "color-contrast: selector is required",
      "color-contrast: expires is not a valid date",
    ]);
  });

  it("filters only exact route, rule, and selector matches", () => {
    const result = getUnexpectedAxeViolations(
      [
        {
          help: "Elements must meet minimum color contrast ratio thresholds",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.11/color-contrast",
          id: "color-contrast",
          impact: "serious",
          nodes: [
            { target: [".known-contrast-debt"] },
            { target: [".unexpected-contrast-debt"] },
          ],
        },
      ],
      {
        allowlist: [activeAllowance],
        route: "/the-memes?locale=de-DE",
      }
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "color-contrast",
        nodes: [{ target: [".unexpected-contrast-debt"] }],
      }),
    ]);
  });

  it("summarizes violations with rule and target evidence", () => {
    expect(
      summarizeAxeViolations([
        {
          help: "Buttons must have discernible text",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.11/button-name",
          id: "button-name",
          impact: "critical",
          nodes: [{ target: ["button.icon-only"] }],
        },
      ])
    ).toContain("button-name (critical): Buttons must have discernible text");
  });
});
