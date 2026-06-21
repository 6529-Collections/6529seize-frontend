export const WCAG_22_AA_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

export type AxeViolationAllowance = {
  readonly route: string;
  readonly ruleId: string;
  readonly selector: string;
  readonly reason: string;
  readonly owner: string;
  readonly expires: string;
};

export type AxeNodeSummary = {
  readonly failureSummary?: string | undefined;
  readonly target: readonly string[];
};

export type AxeViolationSummary = {
  readonly help: string;
  readonly helpUrl: string;
  readonly id: string;
  readonly impact?: string | null | undefined;
  readonly nodes: readonly AxeNodeSummary[];
};

const BROAD_SELECTORS = new Set(["*", "html", "body", "main", "#__next"]);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateAxeAllowances(
  allowances: readonly AxeViolationAllowance[],
  now = new Date()
) {
  const errors: string[] = [];

  for (const allowance of allowances) {
    if (!allowance.route.startsWith("/")) {
      errors.push(`${allowance.ruleId}: route must start with /`);
    }

    const selector = allowance.selector.trim();
    if (!selector) {
      errors.push(`${allowance.ruleId}: selector is required`);
    } else if (BROAD_SELECTORS.has(selector)) {
      errors.push(`${allowance.ruleId}: selector is too broad`);
    }

    if (!allowance.reason.trim()) {
      errors.push(`${allowance.ruleId}: reason is required`);
    }

    if (!allowance.owner.trim()) {
      errors.push(`${allowance.ruleId}: owner is required`);
    }

    if (!ISO_DATE_PATTERN.test(allowance.expires)) {
      errors.push(`${allowance.ruleId}: expires must use YYYY-MM-DD`);
      continue;
    }

    const expiresAt = getStrictIsoDateEndTime(allowance.expires);
    if (expiresAt === null) {
      errors.push(`${allowance.ruleId}: expires is not a valid date`);
      continue;
    }

    if (expiresAt < now.getTime()) {
      errors.push(
        `${allowance.ruleId}: allowance expired on ${allowance.expires}`
      );
    }
  }

  return errors;
}

function getStrictIsoDateEndTime(date: string) {
  const [yearText, monthText, dayText] = date.split("-");
  if (!yearText || !monthText || !dayText) {
    return null;
  }

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const expiresAt = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  const expiresAtDate = new Date(expiresAt);
  if (
    expiresAtDate.getUTCFullYear() !== year ||
    expiresAtDate.getUTCMonth() !== month - 1 ||
    expiresAtDate.getUTCDate() !== day
  ) {
    return null;
  }

  return expiresAt;
}

export function getUnexpectedAxeViolations(
  violations: readonly AxeViolationSummary[],
  options: {
    readonly allowlist?: readonly AxeViolationAllowance[];
    readonly route: string;
  }
) {
  const allowlist = options.allowlist ?? [];

  return violations
    .map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter(
        (node) => !isNodeAllowed(violation.id, node, options.route, allowlist)
      ),
    }))
    .filter((violation) => violation.nodes.length > 0);
}

export function summarizeAxeViolations(
  violations: readonly AxeViolationSummary[]
) {
  if (violations.length === 0) {
    return "No unexpected axe violations.";
  }

  return violations
    .map((violation) => {
      const nodeTargets = violation.nodes
        .map((node) => `- ${node.target.join(" | ")}`)
        .join("\n");
      return [
        `${violation.id} (${violation.impact ?? "unknown impact"}): ${violation.help}`,
        violation.helpUrl,
        nodeTargets,
      ].join("\n");
    })
    .join("\n\n");
}

function isNodeAllowed(
  ruleId: string,
  node: AxeNodeSummary,
  route: string,
  allowlist: readonly AxeViolationAllowance[]
) {
  return allowlist.some(
    (allowance) =>
      allowance.ruleId === ruleId &&
      allowance.route === route &&
      node.target.some((target) => target === allowance.selector)
  );
}
