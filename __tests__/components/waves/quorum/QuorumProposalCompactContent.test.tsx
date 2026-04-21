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

    fireEvent.click(screen.getByText("Problem Statement"));

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.getByText("Too many drops.")).toBeInTheDocument();
    expect(screen.queryByText("Add a countdown.")).toBeNull();
  });
});
