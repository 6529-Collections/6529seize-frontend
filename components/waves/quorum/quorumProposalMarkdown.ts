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

export interface ParsedQuorumProposalSection {
  readonly heading: string;
  readonly markdown: string;
}

export interface ParsedQuorumProposalMarkdown {
  readonly title: string;
  readonly summaryMarkdown: string;
  readonly sections: readonly ParsedQuorumProposalSection[];
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

const normalizeSectionHeading = (heading: string): string =>
  heading.trim().toLowerCase();

const QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS = [
  "Summary",
  "Problem Statement",
  "Proposed Solution",
  "Working Spec (Required)",
  "Implementation Path",
  "Impact & Priority",
  "Success Criteria",
  "Risks & Trade-offs",
] as const;

const QUORUM_PROPOSAL_TOP_LEVEL_HEADING_SET = new Set<string>(
  QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS
);

const parseTopLevelHeading = (line: string): string | null => {
  const headingMatch = /^##\s+(.+?)\s*$/.exec(line);
  const heading = headingMatch?.[1]?.trim();
  return heading && heading.length > 0 ? heading : null;
};

const formatTopLevelHeading = (
  heading: (typeof QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS)[number]
): string => `## ${heading}`;

const normalizeMarkdownBlock = (lines: readonly string[]): string =>
  normalizeMarkdownValue(lines.join("\n"));

const skipLeadingEmptyLines = (lines: readonly string[]): number => {
  let lineIndex = 0;
  while (lineIndex < lines.length && lines[lineIndex]?.trim() === "") {
    lineIndex++;
  }
  return lineIndex;
};

const pushParsedSection = (
  parsedSections: ParsedQuorumProposalSection[],
  heading: string,
  lines: readonly string[]
): void => {
  parsedSections.push({
    heading,
    markdown: normalizeMarkdownBlock(lines),
  });
};

interface QuorumProposalSectionParseState {
  currentHeading: string | null;
  currentLines: string[];
  nextHeadingIndex: number;
}

const startNextParsedSection = (
  parsedSections: ParsedQuorumProposalSection[],
  parseState: QuorumProposalSectionParseState,
  parsedHeading: string | null
): boolean | null => {
  if (!parsedHeading) {
    return false;
  }

  const expectedHeading =
    QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[parseState.nextHeadingIndex] ?? null;

  if (expectedHeading && parsedHeading === expectedHeading) {
    if (parseState.currentHeading) {
      pushParsedSection(
        parsedSections,
        parseState.currentHeading,
        parseState.currentLines
      );
    }

    parseState.currentHeading = expectedHeading;
    parseState.currentLines = [];
    parseState.nextHeadingIndex++;
    return true;
  }

  return QUORUM_PROPOSAL_TOP_LEVEL_HEADING_SET.has(parsedHeading)
    ? null
    : false;
};

const appendSectionLine = (
  parseState: QuorumProposalSectionParseState,
  line: string
): boolean => {
  if (!parseState.currentHeading) {
    return line.trim().length === 0;
  }

  parseState.currentLines.push(line);
  return true;
};

const parseQuorumProposalSections = (
  lines: readonly string[],
  startIndex: number
): ParsedQuorumProposalSection[] | null => {
  const parsedSections: ParsedQuorumProposalSection[] = [];
  const parseState: QuorumProposalSectionParseState = {
    currentHeading: null,
    currentLines: [],
    nextHeadingIndex: 0,
  };

  for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? "";
    const parsedHeading = parseTopLevelHeading(line);
    const sectionStarted = startNextParsedSection(
      parsedSections,
      parseState,
      parsedHeading
    );

    if (sectionStarted === null) {
      return null;
    }

    if (sectionStarted) {
      continue;
    }

    if (!appendSectionLine(parseState, line)) {
      return null;
    }
  }

  if (!parseState.currentHeading) {
    return null;
  }

  pushParsedSection(
    parsedSections,
    parseState.currentHeading,
    parseState.currentLines
  );
  return parsedSections;
};

const splitSummarySection = (
  parsedSections: readonly ParsedQuorumProposalSection[]
): Omit<ParsedQuorumProposalMarkdown, "title"> | null => {
  const summarySection = parsedSections.find(
    (section) => normalizeSectionHeading(section.heading) === "summary"
  );

  if (!summarySection) {
    return null;
  }

  const sections = parsedSections.filter(
    (section) => normalizeSectionHeading(section.heading) !== "summary"
  );

  if (sections.length === 0) {
    return null;
  }

  return {
    summaryMarkdown: summarySection.markdown,
    sections,
  };
};

export const hasQuorumProposalContent = (
  values: QuorumProposalFormValues
): boolean =>
  QUORUM_PROPOSAL_FORM_FIELDS.some((field) => {
    return values[field].trim().length > 0;
  });

export const parseQuorumProposalMarkdown = (
  markdown: string | null | undefined
): ParsedQuorumProposalMarkdown | null => {
  if (!markdown?.trim()) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n?/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  const lineIndex = skipLeadingEmptyLines(lines);

  const titleMatch = /^#\s+(.+?)\s*$/.exec(lines[lineIndex]?.trim() ?? "");
  if (!titleMatch) {
    return null;
  }

  const title = titleMatch[1];
  if (!title) {
    return null;
  }

  const parsedSections = parseQuorumProposalSections(lines, lineIndex + 1);
  if (!parsedSections) {
    return null;
  }

  const contentSections = splitSummarySection(parsedSections);
  if (!contentSections) {
    return null;
  }

  return {
    title: normalizeTitle(title),
    ...contentSections,
  };
};

export const buildQuorumProposalMarkdown = (
  values: QuorumProposalFormValues
): string => {
  const urgency = values.urgency || EMPTY_MARKDOWN_VALUE;

  return [
    `# ${normalizeTitle(values.title)}`,
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[0]),
    "",
    normalizeMarkdownValue(values.summary),
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[1]),
    "",
    normalizeMarkdownValue(values.problemStatement),
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[2]),
    "",
    normalizeMarkdownValue(values.proposedSolution),
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[3]),
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
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[4]),
    "",
    normalizeMarkdownValue(values.implementationPath),
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[5]),
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
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[6]),
    "",
    "### Observable outcome",
    "",
    normalizeMarkdownValue(values.observableOutcome),
    "",
    "### Measurable signal",
    "",
    normalizeMarkdownValue(values.measurableSignal),
    "",
    formatTopLevelHeading(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS[7]),
    "",
    normalizeMarkdownValue(values.risksTradeoffs),
  ].join("\n");
};
