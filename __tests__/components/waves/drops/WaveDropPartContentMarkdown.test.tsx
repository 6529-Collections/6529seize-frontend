import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";
import {
  buildQuorumProposalMarkdown,
  EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
} from "@/components/waves/quorum/quorumProposalMarkdown";

let markdownProps: any;
let quoteProps: any;
let compactProps: any;

jest.mock(
  "@/components/drops/view/part/DropPartMarkdownWithPropLogger",
  () => (props: any) => {
    markdownProps = props;
    return <div data-testid="md">{props.partContent}</div>;
  }
);
jest.mock(
  "@/components/waves/drops/WaveDropQuoteWithDropId",
  () => (props: any) => {
    quoteProps = props;
    return (
      <div
        data-testid="quote"
        data-id={props.dropId}
        data-part={props.partId}
      />
    );
  }
);
jest.mock(
  "@/components/waves/quorum/QuorumProposalCompactContent",
  () => (props: any) => {
    compactProps = props;
    return <div data-testid="compact">{props.proposal.title}</div>;
  }
);

const basePart: any = { content: "hello", quoted_drop: null };
const wave: any = { id: "w" };

beforeEach(() => {
  markdownProps = undefined;
  quoteProps = undefined;
  compactProps = undefined;
});

it("renders markdown only", () => {
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      referencedNfts={[]}
      part={basePart}
      wave={wave}
      onQuoteClick={jest.fn()}
    />
  );
  expect(screen.getByTestId("md")).toHaveTextContent("hello");
  expect(screen.queryByTestId("quote")).toBeNull();
});

it("renders quoted drop", () => {
  const part = {
    content: "c",
    quoted_drop: { drop_id: "d", drop_part_id: 1, drop: null },
  } as any;
  const drop = { id: "root-drop", serial_no: 7 } as any;
  const onLinkCardActionsActiveChange = jest.fn();
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      referencedNfts={[]}
      part={part}
      wave={wave}
      drop={drop}
      onQuoteClick={jest.fn()}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );
  expect(screen.getByTestId("quote")).toHaveAttribute("data-id", "d");
  expect(markdownProps.quotePath).toEqual(["w:7"]);
  expect(quoteProps.embedPath).toEqual(["root-drop"]);
  expect(quoteProps.quotePath).toEqual(["w:7"]);
  expect(quoteProps.embedDepth).toBe(1);
  expect(quoteProps.onLinkCardActionsActiveChange).toBe(
    onLinkCardActionsActiveChange
  );
});

it("passes link preview toggle control for author drops with links", () => {
  const drop = {
    id: "drop-1",
    serial_no: 1,
    hide_link_preview: false,
    author: { handle: "alice" },
    wave: { id: "w" },
    parts: [{ content: "https://example.com" }],
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={drop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(markdownProps.linkPreviewToggleControl).toBeDefined();
  expect(markdownProps.linkPreviewToggleControl.label).toBe(
    "Hide link previews"
  );
});

it("keeps link preview toggle control stable across equivalent drop rerenders", () => {
  const drop = {
    id: "drop-1",
    serial_no: 1,
    hide_link_preview: false,
    author: { handle: "alice" },
    wave: { id: "w" },
    parts: [{ content: "https://example.com" }],
  } as any;

  const authContextValue = {
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  } as any;

  const { rerender } = render(
    <AuthContext.Provider value={authContextValue}>
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={drop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  const firstControl = markdownProps.linkPreviewToggleControl;
  expect(firstControl).toBeDefined();

  const equivalentDrop = {
    ...drop,
    author: { ...drop.author },
    wave: { ...drop.wave },
    parts: [...drop.parts],
  } as any;

  rerender(
    <AuthContext.Provider value={authContextValue}>
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={equivalentDrop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(markdownProps.linkPreviewToggleControl).toBe(firstControl);
});

it("renders the compact quorum proposal view when parsing succeeds", () => {
  const proposalPart = {
    content: buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Keep the feed readable.",
      problemStatement: "There are too many drops.",
    }),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("compact")).toHaveTextContent("Slow Mode");
  expect(compactProps.proposal.summaryMarkdown).toBe("Keep the feed readable.");
  expect(markdownProps).toBeUndefined();
});

it("renders compact quorum cards when intermediate sections are omitted", () => {
  const proposalPart = {
    content: [
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
    ].join("\n"),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("compact")).toHaveTextContent("Slow Mode");
  expect(
    compactProps.proposal.sections.map((section: any) => section.heading)
  ).toEqual(["Problem Statement", "Risks & Trade-offs"]);
  expect(markdownProps).toBeUndefined();
});

it("falls back to regular markdown for out-of-order quorum headings", () => {
  const proposalPart = {
    content: [
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
    ].join("\n"),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("md")).toHaveTextContent("## Risks & Trade-offs");
  expect(screen.queryByTestId("compact")).toBeNull();
});

it("falls back to regular markdown when quorum headings go out of order after a valid prefix", () => {
  const proposalPart = {
    content: [
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
    ].join("\n"),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("md")).toHaveTextContent("## Risks & Trade-offs");
  expect(screen.queryByTestId("compact")).toBeNull();
});

it("keeps repeated canonical headings inside the final compact quorum section", () => {
  const proposalPart = {
    content: [
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
    ].join("\n"),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("compact")).toHaveTextContent("Slow Mode");
  expect(
    compactProps.proposal.sections.map((section: any) => section.heading)
  ).toEqual(["Problem Statement"]);
  expect(compactProps.proposal.sections[0].markdown).toContain(
    "## Problem Statement"
  );
  expect(compactProps.proposal.sections[0].markdown).toContain(
    "This repeated heading is still part of the same section."
  );
  expect(markdownProps).toBeUndefined();
});

it("keeps embedded level-two headings inside the same compact quorum section", () => {
  const proposalPart = {
    content: buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Keep the feed readable.",
      problemStatement: "There are too many drops.",
      proposedSolution: "Add a cooldown setting.",
      coreFeatures:
        "- Toggle on/off\n\n## Rollout Notes\n\nStill part of the working spec.",
      userFlow: "Users see a countdown after dropping.",
      implementationPath: "Ship as an opt-in setting.",
    }),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("compact")).toHaveTextContent("Slow Mode");
  expect(
    compactProps.proposal.sections.map((section: any) => section.heading)
  ).toEqual([
    "Problem Statement",
    "Proposed Solution",
    "Working Spec (Required)",
    "Implementation Path",
    "Impact & Priority",
    "Success Criteria",
    "Risks & Trade-offs",
  ]);
  expect(compactProps.proposal.sections[2].markdown).toContain(
    "## Rollout Notes"
  );
  expect(compactProps.proposal.sections[2].markdown).toContain(
    "Still part of the working spec."
  );
  expect(markdownProps).toBeUndefined();
});

it("keeps canonical embedded headings inside the same compact quorum section", () => {
  const proposalPart = {
    content: buildQuorumProposalMarkdown({
      ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
      title: "Slow Mode",
      summary: "Keep the feed readable.",
      problemStatement: "There are too many drops.",
      proposedSolution: "Add a cooldown setting.",
      implementationPath:
        "1. Draft the rollout.\n\n## Risks & Trade-offs\n\nStill part of the implementation notes.",
      risksTradeoffs: "Actual trade-off goes here.",
    }),
    quoted_drop: null,
  } as any;

  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={proposalPart}
      wave={wave}
      drop={{ id: "drop-1", serial_no: 2 } as any}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("compact")).toHaveTextContent("Slow Mode");
  expect(compactProps.proposal.sections[3].heading).toBe("Implementation Path");
  expect(compactProps.proposal.sections[3].markdown).toContain(
    "## Risks & Trade-offs"
  );
  expect(compactProps.proposal.sections[3].markdown).toContain(
    "Still part of the implementation notes."
  );
  expect(compactProps.proposal.sections[6].heading).toBe("Risks & Trade-offs");
  expect(compactProps.proposal.sections[6].markdown).toBe(
    "Actual trade-off goes here."
  );
  expect(markdownProps).toBeUndefined();
});

it("falls back to regular markdown when compact quorum parsing fails", () => {
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={{ content: "# Not enough structure", quoted_drop: null } as any}
      wave={wave}
      onQuoteClick={jest.fn()}
      contentPresentation="quorumCompact"
    />
  );

  expect(screen.getByTestId("md")).toHaveTextContent("# Not enough structure");
  expect(screen.queryByTestId("compact")).toBeNull();
});
