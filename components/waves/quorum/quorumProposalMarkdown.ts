export type QuorumProposalUrgency = "" | "Low" | "Medium" | "High";

export interface QuorumProposalFormValues {
  readonly title: string;
  readonly summary: string;
  readonly problemStatement: string;
  readonly proposedSolution: string;
  readonly coreFeatures: string;
  readonly userFlow: string;
  readonly edgeCases: string;
  readonly scopeBoundaries: string;
  readonly implementationPath: string;
  readonly whoBenefits: string;
  readonly whatImproves: string;
  readonly urgency: QuorumProposalUrgency;
  readonly observableOutcome: string;
  readonly measurableSignal: string;
  readonly risksTradeoffs: string;
}

export const EMPTY_QUORUM_PROPOSAL_FORM_VALUES: QuorumProposalFormValues = {
  title: "",
  summary: "",
  problemStatement: "",
  proposedSolution: "",
  coreFeatures: "",
  userFlow: "",
  edgeCases: "",
  scopeBoundaries: "",
  implementationPath: "",
  whoBenefits: "",
  whatImproves: "",
  urgency: "",
  observableOutcome: "",
  measurableSignal: "",
  risksTradeoffs: "",
};

const EMPTY_MARKDOWN_VALUE = "_Not provided_";

const QUORUM_PROPOSAL_FORM_FIELDS = [
  "title",
  "summary",
  "problemStatement",
  "proposedSolution",
  "coreFeatures",
  "userFlow",
  "edgeCases",
  "scopeBoundaries",
  "implementationPath",
  "whoBenefits",
  "whatImproves",
  "urgency",
  "observableOutcome",
  "measurableSignal",
  "risksTradeoffs",
] as const satisfies readonly (keyof QuorumProposalFormValues)[];

const normalizeMarkdownValue = (value: string): string => {
  const normalizedValue = value.trim();
  return normalizedValue.length ? normalizedValue : EMPTY_MARKDOWN_VALUE;
};

const normalizeTitle = (title: string): string => {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");
  return normalizedTitle.length ? normalizedTitle : "Untitled QUORUM Proposal";
};

export const hasQuorumProposalContent = (
  values: QuorumProposalFormValues
): boolean =>
  QUORUM_PROPOSAL_FORM_FIELDS.some((field) => {
    return values[field].trim().length > 0;
  });

export const buildQuorumProposalMarkdown = (
  values: QuorumProposalFormValues
): string => {
  const urgency = values.urgency || EMPTY_MARKDOWN_VALUE;

  return [
    `# ${normalizeTitle(values.title)}`,
    "",
    "## Summary",
    "",
    normalizeMarkdownValue(values.summary),
    "",
    "## Problem Statement",
    "",
    normalizeMarkdownValue(values.problemStatement),
    "",
    "## Proposed Solution",
    "",
    normalizeMarkdownValue(values.proposedSolution),
    "",
    "## Working Spec (Required)",
    "",
    "### Core features",
    "",
    normalizeMarkdownValue(values.coreFeatures),
    "",
    "### User flow",
    "",
    normalizeMarkdownValue(values.userFlow),
    "",
    "### Edge cases (what if...)",
    "",
    normalizeMarkdownValue(values.edgeCases),
    "",
    "### What is NOT included (scope boundaries)",
    "",
    normalizeMarkdownValue(values.scopeBoundaries),
    "",
    "## Implementation Path",
    "",
    normalizeMarkdownValue(values.implementationPath),
    "",
    "## Impact & Priority",
    "",
    "### Who benefits",
    "",
    normalizeMarkdownValue(values.whoBenefits),
    "",
    "### What improves",
    "",
    normalizeMarkdownValue(values.whatImproves),
    "",
    "### Urgency level",
    "",
    urgency,
    "",
    "## Success Criteria",
    "",
    "### Observable outcome",
    "",
    normalizeMarkdownValue(values.observableOutcome),
    "",
    "### Measurable signal",
    "",
    normalizeMarkdownValue(values.measurableSignal),
    "",
    "## Risks & Trade-offs",
    "",
    normalizeMarkdownValue(values.risksTradeoffs),
  ].join("\n");
};
