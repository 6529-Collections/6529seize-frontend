import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

import {
  getUnexpectedAxeViolations,
  summarizeAxeViolations,
  validateAxeAllowances,
  WCAG_22_AA_TAGS,
  type AxeViolationAllowance,
} from "./a11yAllowlist";

type AxeCleanOptions = {
  readonly allowlist?: readonly AxeViolationAllowance[];
  readonly disabledRules?: readonly string[];
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  readonly route?: string;
  readonly tags?: readonly string[];
};

export async function expectAxeClean(
  page: Page,
  options: AxeCleanOptions = {}
) {
  const route = options.route ?? getRouteFromPage(page);
  const allowanceErrors = validateAxeAllowances(options.allowlist ?? []);

  expect(allowanceErrors, allowanceErrors.join("\n")).toEqual([]);

  let builder = new AxeBuilder({ page }).withTags([
    ...(options.tags ?? WCAG_22_AA_TAGS),
  ]);

  for (const selector of options.include ?? ["main"]) {
    builder = builder.include(selector);
  }

  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  if (options.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules([...options.disabledRules]);
  }

  const results = await builder.analyze();
  const violations = results.violations.map((violation) => ({
    help: violation.help,
    helpUrl: violation.helpUrl,
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => ({
      failureSummary: node.failureSummary,
      target: node.target.map(String),
    })),
  }));
  const unexpected = getUnexpectedAxeViolations(violations, {
    allowlist: options.allowlist ?? [],
    route,
  });

  expect(unexpected, summarizeAxeViolations(unexpected)).toEqual([]);
}

function getRouteFromPage(page: Page) {
  try {
    const url = new URL(page.url());
    return `${url.pathname}${url.search}`;
  } catch {
    return page.url();
  }
}

export {
  getUnexpectedAxeViolations,
  summarizeAxeViolations,
  validateAxeAllowances,
  WCAG_22_AA_TAGS,
  type AxeViolationAllowance,
};
