import { fireEvent, render, screen } from "@testing-library/react";
import QuorumProposalCompactContent, {
  getQuorumProposalCompactSectionKey,
} from "@/components/waves/quorum/QuorumProposalCompactContent";

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

const openProblemStatementKey = getQuorumProposalCompactSectionKey(
  proposal.sections[0],
  0
);

function getSectionSummaryElement(heading: string): HTMLElement {
  const summary = screen.getByText(heading).closest("summary");
  if (!summary) {
    throw new Error(`Expected summary for section heading: ${heading}`);
  }
  return summary;
}

function getDetailsToggle(): HTMLElement {
  return screen.getByRole("button", { name: /show details/i });
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
    expect(
      screen.getByRole("button", { name: "Show details (2)" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Problem Statement")).toBeNull();
    expect(screen.queryByText("Proposed Solution")).toBeNull();
    expect(screen.queryByText("Too many drops.")).toBeNull();
  });

  it("reveals section headings without bubbling the click to the parent drop container", () => {
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

    fireEvent.click(getDetailsToggle());

    expect(onParentClick).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Hide details" })
    ).toBeInTheDocument();
    expect(screen.getByText("Problem Statement")).toBeInTheDocument();
    expect(screen.getByText("Proposed Solution")).toBeInTheDocument();
    expect(screen.queryByText("Too many drops.")).toBeNull();
    expect(screen.queryByText("Add a countdown.")).toBeNull();
  });

  it("allows section accordions to expand after details are revealed", () => {
    render(
      <QuorumProposalCompactContent
        proposal={proposal}
        areDetailsVisible={true}
        openSectionKeys={[openProblemStatementKey]}
        mentionedUsers={[]}
        mentionedGroups={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("Too many drops.")).toBeInTheDocument();
    expect(screen.queryByText("Add a countdown.")).toBeNull();
  });

  it("does not bubble toggle keyboard events to the parent drop container", () => {
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

    fireEvent.keyDown(getDetailsToggle(), {
      key: "Enter",
    });

    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it("hides the section list again when details are collapsed", () => {
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

    fireEvent.click(getDetailsToggle());
    fireEvent.click(screen.getByRole("button", { name: "Hide details" }));

    expect(
      screen.getByRole("button", { name: "Show details (2)" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Problem Statement")).toBeNull();
    expect(screen.queryByText("Proposed Solution")).toBeNull();
  });

  it("does not bubble clicks from expanded section content to the parent drop container", () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <QuorumProposalCompactContent
          proposal={proposal}
          areDetailsVisible={true}
          openSectionKeys={[openProblemStatementKey]}
          mentionedUsers={[]}
          mentionedGroups={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          onQuoteClick={jest.fn()}
        />
      </div>
    );

    fireEvent.click(screen.getByText("Too many drops."));

    expect(onParentClick).not.toHaveBeenCalled();
  });
});
