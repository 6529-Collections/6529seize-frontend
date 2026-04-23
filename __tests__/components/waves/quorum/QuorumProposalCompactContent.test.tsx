import { fireEvent, render, screen } from "@testing-library/react";
import QuorumProposalCompactContent from "@/components/waves/quorum/QuorumProposalCompactContent";

jest.mock(
  "@/components/drops/view/part/DropPartMarkdownWithPropLogger",
  () => (props: any) => (
    <div data-testid="markdown-block">{props.partContent}</div>
  )
);

const proposal = {
  title: "Slow Mode",
  summaryMarkdown: "Keep the feed readable.",
  sections: [
    { heading: "Problem Statement", markdown: "Too many drops." },
    { heading: "Proposed Solution", markdown: "Add a countdown." },
  ],
} as const;

function getSectionSummaryElement(heading: string): HTMLElement {
  const summary = screen.getByText(heading).closest("summary");
  if (!summary) {
    throw new Error(`Expected summary for section heading: ${heading}`);
  }
  return summary;
}

describe("QuorumProposalCompactContent", () => {
  it("shows the title and summary immediately", () => {
    render(
      <QuorumProposalCompactContent
        proposal={proposal}
        mentionedUsers={[]}
        mentionedGroups={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("Slow Mode")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Keep the feed readable.")).toBeInTheDocument();
    expect(screen.queryByText("Too many drops.")).toBeNull();
  });

  it("expands sections without bubbling the click to the parent drop container", () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <QuorumProposalCompactContent
          proposal={proposal}
          mentionedUsers={[]}
          mentionedGroups={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          onQuoteClick={jest.fn()}
        />
      </div>
    );

    fireEvent.click(getSectionSummaryElement("Problem Statement"));

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.getByText("Too many drops.")).toBeInTheDocument();
    expect(screen.queryByText("Add a countdown.")).toBeNull();
  });

  it("does not bubble summary keyboard events to the parent drop container", () => {
    const onParentKeyDown = jest.fn();

    render(
      <div onKeyDown={onParentKeyDown}>
        <QuorumProposalCompactContent
          proposal={proposal}
          mentionedUsers={[]}
          mentionedGroups={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          onQuoteClick={jest.fn()}
        />
      </div>
    );

    fireEvent.keyDown(getSectionSummaryElement("Problem Statement"), {
      key: "Enter",
    });

    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it("does not bubble clicks from expanded section content to the parent drop container", () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <QuorumProposalCompactContent
          proposal={proposal}
          mentionedUsers={[]}
          mentionedGroups={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          onQuoteClick={jest.fn()}
        />
      </div>
    );

    fireEvent.click(getSectionSummaryElement("Problem Statement"));
    fireEvent.click(screen.getByText("Too many drops."));

    expect(onParentClick).not.toHaveBeenCalled();
  });
});
