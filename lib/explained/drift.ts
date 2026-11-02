/**
 * The drift check (EXPLAINED.md §6.1, SCORECARD.md S4). Each page declares
 * the decisions it relies on (`dependsOn`) and the record head it was
 * checked through. A decision recorded after that head which cites one of
 * them touches the page: the check fails until the page names it in a
 * `DriftNote` (or is re-checked and its head moved).
 */

export interface DecisionRef {
  readonly id: string;
  /** The decisions its text cites. */
  readonly refs: readonly string[];
}

export interface DriftPage {
  readonly id: string;
  readonly dependsOn: readonly string[];
  /** The newest decision the page was checked against, e.g. "D141". */
  readonly checkedThrough: string;
}

export interface DriftFinding {
  readonly page: string;
  /** The newer decision. */
  readonly decision: string;
  /** Which of the page's decisions it cites. */
  readonly touches: readonly string[];
}

function decisionNumber(id: string): number {
  const match = /^D(\d{1,4})$/.exec(id);
  if (!match?.[1]) {
    throw new Error(`not a decision number: ${id}`);
  }
  return Number(match[1]);
}

/** The decisions a page's sources name in DriftNotes: `<DriftNote by={["D136", "D137"]}`. */
export function namedInDriftNotes(source: string): Set<string> {
  const named = new Set<string>();
  for (const match of source.matchAll(
    /<DriftNote\b[^>]*?\bby=\{\[([^\]]*)\]\}/g
  )) {
    for (const id of (match[1] ?? "").matchAll(/D\d{1,4}/g)) {
      named.add(id[0]);
    }
  }
  return named;
}

/** The newer decisions that touch a page and that it does not name. */
export function findDrift(
  page: DriftPage,
  decisions: readonly DecisionRef[],
  named: ReadonlySet<string>
): DriftFinding[] {
  const through = decisionNumber(page.checkedThrough);
  const relies = new Set(page.dependsOn);
  const findings: DriftFinding[] = [];
  for (const decision of decisions) {
    if (decisionNumber(decision.id) <= through || named.has(decision.id)) {
      continue;
    }
    const touches = decision.refs.filter((ref) => relies.has(ref));
    if (touches.length > 0) {
      findings.push({ page: page.id, decision: decision.id, touches });
    }
  }
  return findings;
}

/** Every dependsOn decision must exist, and the head a page names must too. */
export function unknownDecisions(
  page: DriftPage,
  decisions: readonly DecisionRef[]
): string[] {
  const known = new Set(decisions.map((decision) => decision.id));
  return [...page.dependsOn, page.checkedThrough].filter(
    (id) => !known.has(id)
  );
}
