import {
  buildQuorumProposalMarkdown,
  EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
  hasQuorumProposalContent,
  type QuorumProposalFormValues,
} from "@/components/waves/quorum/quorumProposalMarkdown";

describe("quorumProposalMarkdown", () => {
  it("builds one proposal markdown document", () => {
    const values: QuorumProposalFormValues = {
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Roadmap lane",
      summary: "Coordinate implementation priorities.",
      problemStatement: "Priority signal is unclear.",
      proposedSolution: "Use QUORUM proposals.",
      coreFeatures: "- Proposal wizard\n- Markdown output",
      userFlow: "User fills the wizard and submits.",
      edgeCases: "Missing fields remain visible.",
      scopeBoundaries: "No roadmap automation.",
      implementationPath: "Build UI, wire submit, test.",
      whoBenefits: "Community and dev team.",
      whatImproves: "Proposal clarity.",
      urgency: "Medium",
      observableOutcome: "Comparable proposals.",
      measurableSignal: "More complete proposals.",
      risksTradeoffs: "More structure for submitters.",
    };

    expect(hasQuorumProposalContent(values)).toBe(true);
    expect(buildQuorumProposalMarkdown(values)).toContain("# Roadmap lane");
    expect(buildQuorumProposalMarkdown(values)).toContain(
      "## Working Spec (Required)"
    );
    expect(buildQuorumProposalMarkdown(values)).toContain("Medium");
    expect(buildQuorumProposalMarkdown(values)).toContain(
      "No roadmap automation."
    );
  });

  it("allows drafts but marks empty sections", () => {
    const values: QuorumProposalFormValues = {
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      summary: "Only a starting point.",
    };

    const markdown = buildQuorumProposalMarkdown(values);

    expect(hasQuorumProposalContent(values)).toBe(true);
    expect(markdown).toContain("# Untitled QUORUM Proposal");
    expect(markdown).toContain("Only a starting point.");
    expect(markdown).toContain("_Not provided_");
  });

  it("detects an empty proposal", () => {
    expect(hasQuorumProposalContent(EMPTY_QUORUM_PROPOSAL_FORM_VALUES)).toBe(
      false
    );
  });
});
