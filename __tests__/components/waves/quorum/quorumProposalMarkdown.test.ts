import {
  buildQuorumProposalMarkdown,
  EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
  hasQuorumProposalContent,
  parseQuorumProposalMarkdown,
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

  it("parses generated quorum markdown into a compact proposal model", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement: "Waves can become noisy.",
      proposedSolution: "Allow creators to enable slow mode.",
      coreFeatures: "- Toggle on/off\n- One drop per 24h",
      userFlow: "Users see a countdown after dropping.",
      edgeCases: "",
      scopeBoundaries: "Users cannot disable it.",
      implementationPath: "Ship as an opt-in setting.",
      whoBenefits: "Busy art-sharing waves.",
      whatImproves: "Visibility.",
      urgency: "Low",
      observableOutcome: "Fewer duplicate drops.",
      measurableSignal: "More space between drops.",
      risksTradeoffs: "",
    });

    expect(parseQuorumProposalMarkdown(markdown)).toEqual({
      title: "Slow Mode",
      summaryMarkdown: "Restrict users to one drop every 24 hours.",
      sections: [
        {
          heading: "Problem Statement",
          markdown: "Waves can become noisy.",
        },
        {
          heading: "Proposed Solution",
          markdown: "Allow creators to enable slow mode.",
        },
        {
          heading: "Working Spec (Required)",
          markdown:
            "### Core features\n\n- Toggle on/off\n- One drop per 24h\n\n### User flow\n\nUsers see a countdown after dropping.\n\n### Edge cases (what if...)\n\n_Not provided_\n\n### What is NOT included (scope boundaries)\n\nUsers cannot disable it.",
        },
        {
          heading: "Implementation Path",
          markdown: "Ship as an opt-in setting.",
        },
        {
          heading: "Impact & Priority",
          markdown:
            "### Who benefits\n\nBusy art-sharing waves.\n\n### What improves\n\nVisibility.\n\n### Urgency level\n\nLow",
        },
        {
          heading: "Success Criteria",
          markdown:
            "### Observable outcome\n\nFewer duplicate drops.\n\n### Measurable signal\n\nMore space between drops.",
        },
        {
          heading: "Risks & Trade-offs",
          markdown: "_Not provided_",
        },
      ],
    });
  });

  it("keeps non-canonical level-two headings inside the current section body", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement: "Waves can become noisy.",
      proposedSolution: "Allow creators to enable slow mode.",
      coreFeatures:
        "- Toggle on/off\n\n## Rollout Notes\n\nStill part of the working spec.",
      userFlow: "Users see a countdown after dropping.",
      scopeBoundaries: "Users cannot disable it.",
      implementationPath: "Ship as an opt-in setting.",
      whoBenefits: "Busy art-sharing waves.",
      whatImproves: "Visibility.",
      urgency: "Low",
      observableOutcome: "Fewer duplicate drops.",
      measurableSignal: "More space between drops.",
    });

    const parsed = parseQuorumProposalMarkdown(markdown);

    expect(parsed).not.toBeNull();
    if (!parsed) {
      throw new Error("Expected quorum markdown to parse");
    }

    expect(parsed.sections.map((section) => section.heading)).toEqual([
      "Problem Statement",
      "Proposed Solution",
      "Working Spec (Required)",
      "Implementation Path",
      "Impact & Priority",
      "Success Criteria",
      "Risks & Trade-offs",
    ]);
    expect(parsed.sections[2]?.markdown).toContain("## Rollout Notes");
    expect(parsed.sections[2]?.markdown).toContain(
      "Still part of the working spec."
    );
  });

  it("keeps indented level-two headings inside the current section body", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement: "Waves can become noisy.",
      proposedSolution: "Allow creators to enable slow mode.",
      implementationPath:
        "1. Add the setting.\n\n    ## Example config\n\n2. Ship it.",
    });

    const parsed = parseQuorumProposalMarkdown(markdown);

    expect(parsed).not.toBeNull();
    if (!parsed) {
      throw new Error("Expected quorum markdown to parse");
    }

    expect(parsed.sections[3]?.heading).toBe("Implementation Path");
    expect(parsed.sections[3]?.markdown).toContain("    ## Example config");
    expect(parsed.sections[3]?.markdown).toContain("2. Ship it.");
  });

  it("parses sparse proposals when intermediate sections are omitted", () => {
    const markdown = [
      "# Slow Mode",
      "",
      "## Summary",
      "",
      "Keep the feed readable.",
      "",
      "## Problem Statement",
      "",
      "There are too many drops.",
      "",
      "## Risks & Trade-offs",
      "",
      "More structure for submitters.",
    ].join("\n");

    expect(parseQuorumProposalMarkdown(markdown)).toEqual({
      title: "Slow Mode",
      summaryMarkdown: "Keep the feed readable.",
      sections: [
        {
          heading: "Problem Statement",
          markdown: "There are too many drops.",
        },
        {
          heading: "Risks & Trade-offs",
          markdown: "More structure for submitters.",
        },
      ],
    });
  });

  it("returns null for out-of-order canonical headings", () => {
    const markdown = [
      "# Slow Mode",
      "",
      "## Summary",
      "",
      "Keep the feed readable.",
      "",
      "## Risks & Trade-offs",
      "",
      "More structure for submitters.",
      "",
      "## Problem Statement",
      "",
      "There are too many drops.",
    ].join("\n");

    expect(parseQuorumProposalMarkdown(markdown)).toBeNull();
  });

  it("returns null when canonical headings go out of order after a valid prefix", () => {
    const markdown = [
      "# Slow Mode",
      "",
      "## Summary",
      "",
      "Keep the feed readable.",
      "",
      "## Problem Statement",
      "",
      "There are too many drops.",
      "",
      "## Risks & Trade-offs",
      "",
      "More structure for submitters.",
      "",
      "## Proposed Solution",
      "",
      "Add a cooldown setting.",
    ].join("\n");

    expect(parseQuorumProposalMarkdown(markdown)).toBeNull();
  });

  it("keeps repeated canonical headings inside the final parsed section body", () => {
    const markdown = [
      "# Slow Mode",
      "",
      "## Summary",
      "",
      "Keep the feed readable.",
      "",
      "## Problem Statement",
      "",
      "There are too many drops.",
      "",
      "## Problem Statement",
      "",
      "This repeated heading is still part of the same section.",
    ].join("\n");

    expect(parseQuorumProposalMarkdown(markdown)).toEqual({
      title: "Slow Mode",
      summaryMarkdown: [
        "Keep the feed readable.",
        "",
        "## Problem Statement",
        "",
        "There are too many drops.",
      ].join("\n"),
      sections: [
        {
          heading: "Problem Statement",
          markdown: "This repeated heading is still part of the same section.",
        },
      ],
    });
  });

  it("keeps canonical level-two headings inside the current section body when a later section matches", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement: "Waves can become noisy.",
      proposedSolution: "Allow creators to enable slow mode.",
      implementationPath:
        "1. Draft the rollout.\n\n## Risks & Trade-offs\n\nStill part of the implementation notes.",
      whoBenefits: "Busy art-sharing waves.",
      whatImproves: "Visibility.",
      urgency: "Low",
      observableOutcome: "Fewer duplicate drops.",
      measurableSignal: "More space between drops.",
      risksTradeoffs: "Actual trade-off goes here.",
    });

    const parsed = parseQuorumProposalMarkdown(markdown);

    expect(parsed).not.toBeNull();
    if (!parsed) {
      throw new Error("Expected quorum markdown to parse");
    }

    expect(parsed.sections.map((section) => section.heading)).toEqual([
      "Problem Statement",
      "Proposed Solution",
      "Working Spec (Required)",
      "Implementation Path",
      "Impact & Priority",
      "Success Criteria",
      "Risks & Trade-offs",
    ]);
    expect(parsed.sections[3]?.markdown).toContain("## Risks & Trade-offs");
    expect(parsed.sections[3]?.markdown).toContain(
      "Still part of the implementation notes."
    );
    expect(parsed.sections[6]?.markdown).toBe("Actual trade-off goes here.");
  });

  it("keeps canonical headings inside fenced code blocks", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement:
        "```md\n## Impact & Priority\n```\n\nStill describing the problem.",
      proposedSolution: "Allow creators to enable slow mode.",
      risksTradeoffs: "More structure for submitters.",
    });

    const parsed = parseQuorumProposalMarkdown(markdown);

    expect(parsed).not.toBeNull();
    if (!parsed) {
      throw new Error("Expected quorum markdown to parse");
    }

    expect(parsed.sections[0]?.heading).toBe("Problem Statement");
    expect(parsed.sections[0]?.markdown).toContain("## Impact & Priority");
    expect(parsed.sections[0]?.markdown).toContain(
      "Still describing the problem."
    );
    expect(parsed.sections[1]?.heading).toBe("Proposed Solution");
  });

  it("keeps fenced code blocks open when matching fence lines have trailing text", () => {
    const markdown = buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Restrict users to one drop every 24 hours.",
      problemStatement:
        "````md\n## Impact & Priority\n````ts\n## Risks & Trade-offs\n````\n\nStill describing the problem.",
      proposedSolution: "Allow creators to enable slow mode.",
      risksTradeoffs: "More structure for submitters.",
    });

    const parsed = parseQuorumProposalMarkdown(markdown);

    expect(parsed).not.toBeNull();
    if (!parsed) {
      throw new Error("Expected quorum markdown to parse");
    }

    expect(parsed.sections[0]?.heading).toBe("Problem Statement");
    expect(parsed.sections[0]?.markdown).toContain("## Impact & Priority");
    expect(parsed.sections[0]?.markdown).toContain("````ts");
    expect(parsed.sections[0]?.markdown).toContain("## Risks & Trade-offs");
    expect(parsed.sections[0]?.markdown).toContain(
      "Still describing the problem."
    );
    expect(parsed.sections[1]?.heading).toBe("Proposed Solution");
    expect(parsed.sections[6]?.heading).toBe("Risks & Trade-offs");
    expect(parsed.sections[6]?.markdown).toBe("More structure for submitters.");
  });

  it("returns null for markdown that does not match the quorum proposal shape", () => {
    expect(
      parseQuorumProposalMarkdown("## Summary\n\nMissing title")
    ).toBeNull();
    expect(parseQuorumProposalMarkdown("# Title only")).toBeNull();
  });

  it("allows leading blank lines before the title", () => {
    expect(
      parseQuorumProposalMarkdown(
        "\n\n# Slow Mode\n\n## Summary\n\nKeep the feed readable.\n\n## Problem Statement\n\nThere are too many drops."
      )
    ).toEqual({
      title: "Slow Mode",
      summaryMarkdown: "Keep the feed readable.",
      sections: [
        {
          heading: "Problem Statement",
          markdown: "There are too many drops.",
        },
      ],
    });
  });

  it("returns null for stray content before the first section", () => {
    expect(
      parseQuorumProposalMarkdown(
        "# Slow Mode\n\nThis line should not appear before a section.\n\n## Summary\n\nKeep the feed readable.\n\n## Problem Statement\n\nThere are too many drops."
      )
    ).toBeNull();
  });
});
