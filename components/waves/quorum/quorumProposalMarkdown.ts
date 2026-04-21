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

type QuorumProposalTopLevelHeading =
  (typeof QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS)[number];

const QUORUM_PROPOSAL_TOP_LEVEL_HEADING_SET =
  new Set<QuorumProposalTopLevelHeading>(QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS);

const QUORUM_PROPOSAL_TOP_LEVEL_HEADING_INDEX = new Map<
  QuorumProposalTopLevelHeading,
  number
>(
  QUORUM_PROPOSAL_TOP_LEVEL_HEADINGS.map(
    (heading, index) => [heading, index] as const
  )
);

const parseTopLevelHeading = (line: string): string | null => {
  const headingMatch = /^##\s+(.+?)\s*$/.exec(line);
  const heading = headingMatch?.[1]?.trim();
  return heading && heading.length > 0 ? heading : null;
};

const parseCanonicalTopLevelHeading = (
  line: string
): QuorumProposalTopLevelHeading | null => {
  const heading = parseTopLevelHeading(line);

  if (
    !heading ||
    !QUORUM_PROPOSAL_TOP_LEVEL_HEADING_SET.has(
      heading as QuorumProposalTopLevelHeading
    )
  ) {
    return null;
  }

  return heading as QuorumProposalTopLevelHeading;
};

const formatTopLevelHeading = (
  heading: QuorumProposalTopLevelHeading
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

interface MarkdownFenceState {
  marker: "`" | "~";
  markerLength: number;
}

interface QuorumProposalSectionBoundaryCandidate {
  heading: QuorumProposalTopLevelHeading;
  headingIndex: number;
  lineIndex: number;
}

const parseFenceState = (line: string): MarkdownFenceState | null => {
  const fenceMatch = /^\s*([`~]{3,})/.exec(line);
  const marker = fenceMatch?.[1];
  if (!marker) {
    return null;
  }

  const fenceCharacter = marker[0];
  if (
    (fenceCharacter !== "`" && fenceCharacter !== "~") ||
    !marker.split("").every((character) => character === fenceCharacter)
  ) {
    return null;
  }

  return {
    marker: fenceCharacter,
    markerLength: marker.length,
  };
};

const getNextFenceState = (
  currentFenceState: MarkdownFenceState | null,
  line: string
): MarkdownFenceState | null => {
  const parsedFenceState = parseFenceState(line);
  if (!parsedFenceState) {
    return currentFenceState;
  }

  if (!currentFenceState) {
    return parsedFenceState;
  }

  return currentFenceState.marker === parsedFenceState.marker &&
    parsedFenceState.markerLength >= currentFenceState.markerLength
    ? null
    : currentFenceState;
};

const linesAreBlank = (
  lines: readonly string[],
  startIndex: number,
  endIndex: number
): boolean => {
  for (let lineIndex = startIndex; lineIndex < endIndex; lineIndex++) {
    if ((lines[lineIndex] ?? "").trim().length > 0) {
      return false;
    }
  }

  return true;
};

const collectSectionBoundaryCandidates = (
  lines: readonly string[],
  startIndex: number
): QuorumProposalSectionBoundaryCandidate[] => {
  const candidates: QuorumProposalSectionBoundaryCandidate[] = [];
  let fenceState: MarkdownFenceState | null = null;

  for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? "";

    if (!fenceState) {
      const heading = parseCanonicalTopLevelHeading(line);
      const headingIndex = heading
        ? QUORUM_PROPOSAL_TOP_LEVEL_HEADING_INDEX.get(heading)
        : undefined;

      if (heading && headingIndex !== undefined) {
        candidates.push({
          heading,
          headingIndex,
          lineIndex,
        });
      }
    }

    fenceState = getNextFenceState(fenceState, line);
  }

  return candidates;
};

const compareCandidatePaths = (
  left: readonly QuorumProposalSectionBoundaryCandidate[],
  right: readonly QuorumProposalSectionBoundaryCandidate[]
): number => {
  if (left.length !== right.length) {
    return left.length - right.length;
  }

  for (let index = 0; index < left.length; index++) {
    const lineDifference =
      (left[index]?.lineIndex ?? -1) - (right[index]?.lineIndex ?? -1);

    if (lineDifference !== 0) {
      return lineDifference;
    }
  }

  return 0;
};

const buildBestCandidatePath = (
  candidates: readonly QuorumProposalSectionBoundaryCandidate[],
  startCandidateIndex: number,
  minimumHeadingIndex: number,
  memoizedPaths: Map<
    string,
    readonly QuorumProposalSectionBoundaryCandidate[] | null
  >
): readonly QuorumProposalSectionBoundaryCandidate[] | null => {
  const memoizationKey = `${startCandidateIndex}:${minimumHeadingIndex}`;
  const memoizedPath = memoizedPaths.get(memoizationKey);
  if (memoizedPath !== undefined) {
    return memoizedPath;
  }

  let bestPath: readonly QuorumProposalSectionBoundaryCandidate[] | null = null;

  for (
    let candidateIndex = startCandidateIndex;
    candidateIndex < candidates.length;
    candidateIndex++
  ) {
    const candidate = candidates[candidateIndex];
    if (!candidate || candidate.headingIndex < minimumHeadingIndex) {
      continue;
    }

    const tailPath = buildBestCandidatePath(
      candidates,
      candidateIndex + 1,
      candidate.headingIndex + 1,
      memoizedPaths
    );
    const candidatePath = tailPath ? [candidate, ...tailPath] : [candidate];

    if (!bestPath || compareCandidatePaths(candidatePath, bestPath) > 0) {
      bestPath = candidatePath;
    }
  }

  memoizedPaths.set(memoizationKey, bestPath);
  return bestPath;
};

const selectSectionBoundaryCandidates = (
  lines: readonly string[],
  startIndex: number,
  candidates: readonly QuorumProposalSectionBoundaryCandidate[]
): readonly QuorumProposalSectionBoundaryCandidate[] | null => {
  const memoizedPaths = new Map<
    string,
    readonly QuorumProposalSectionBoundaryCandidate[] | null
  >();
  let bestPath: readonly QuorumProposalSectionBoundaryCandidate[] | null = null;

  for (
    let candidateIndex = 0;
    candidateIndex < candidates.length;
    candidateIndex++
  ) {
    const candidate = candidates[candidateIndex];
    if (
      candidate?.heading !== "Summary" ||
      !linesAreBlank(lines, startIndex, candidate.lineIndex)
    ) {
      continue;
    }

    const tailPath = buildBestCandidatePath(
      candidates,
      candidateIndex + 1,
      candidate.headingIndex + 1,
      memoizedPaths
    );
    const candidatePath = tailPath ? [candidate, ...tailPath] : [candidate];

    if (
      candidatePath.length >= 2 &&
      (!bestPath || compareCandidatePaths(candidatePath, bestPath) > 0)
    ) {
      bestPath = candidatePath;
    }
  }

  return bestPath;
};

const buildParsedSectionsFromCandidates = (
  lines: readonly string[],
  startIndex: number,
  candidates: readonly QuorumProposalSectionBoundaryCandidate[]
): ParsedQuorumProposalSection[] | null => {
  if (
    candidates.length === 0 ||
    !linesAreBlank(lines, startIndex, candidates[0]?.lineIndex ?? startIndex)
  ) {
    return null;
  }

  const parsedSections: ParsedQuorumProposalSection[] = [];

  for (
    let candidateIndex = 0;
    candidateIndex < candidates.length;
    candidateIndex++
  ) {
    const candidate = candidates[candidateIndex];
    if (!candidate) {
      continue;
    }

    const nextLineIndex =
      candidates[candidateIndex + 1]?.lineIndex ?? lines.length;
    pushParsedSection(
      parsedSections,
      candidate.heading,
      lines.slice(candidate.lineIndex + 1, nextLineIndex)
    );
  }

  return parsedSections;
};

const parseQuorumProposalSections = (
  lines: readonly string[],
  startIndex: number
): ParsedQuorumProposalSection[] | null => {
  const candidates = collectSectionBoundaryCandidates(lines, startIndex);
  const selectedCandidates = selectSectionBoundaryCandidates(
    lines,
    startIndex,
    candidates
  );

  if (!selectedCandidates) {
    return null;
  }

  return buildParsedSectionsFromCandidates(
    lines,
    startIndex,
    selectedCandidates
  );
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
