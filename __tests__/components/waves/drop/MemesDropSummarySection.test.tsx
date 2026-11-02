import { MemesDropSummarySection } from "@/components/waves/drop/MemesDropSummarySection";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/waves/drop/WaveDropMetaRow", () => ({
  WaveDropMetaRow: ({
    children,
    drop,
  }: {
    children: React.ReactNode;
    drop: ExtendedDrop;
  }) => {
    const { MemeCollaboratorCredits } = jest.requireActual(
      "@/components/waves/memes/collaborations/MemeCollaboratorCredits"
    );
    return (
      <div>
        <MemeCollaboratorCredits collaborators={drop.collaborators} />
        {children}
      </div>
    );
  },
}));

jest.mock("@/components/waves/drop/WaveDropVoteSummary", () => ({
  WaveDropVoteSummary: () => null,
}));

const renderSummary = (drop: ExtendedDrop) =>
  render(
    <MemesDropSummarySection
      drop={drop}
      title="Artwork"
      description="Description"
      isWinner={true}
      isVotingEnded={true}
      canShowVote={false}
      manualOutcomes={["Minted on The Memes"]}
      nicTotal={0}
      repTotal={0}
      onVoteClick={jest.fn()}
    />
  );

describe("MemesDropSummarySection", () => {
  it("preserves authored line breaks, blank lines, and spaces in the description", () => {
    const description = "First line\nSecond line\n\nA  spaced paragraph";
    render(
      <MemesDropSummarySection
        drop={{ submission_context: {} } as ExtendedDrop}
        title="Photographic artwork"
        description={description}
        isWinner={false}
        isVotingEnded={false}
        canShowVote={false}
        manualOutcomes={[]}
        nicTotal={0}
        repTotal={0}
        onVoteClick={jest.fn()}
      />
    );
    const paragraph = screen.getByText(/First line/);
    expect(paragraph.textContent).toBe(description);
    expect(paragraph).toHaveClass("tw-whitespace-pre-wrap", "tw-break-words");
  });

  it("shows a compact mapped Meme card pill with the minted outcome", () => {
    renderSummary({
      submission_context: { meme_card_id: 521 },
    } as ExtendedDrop);

    expect(screen.getByText("Minted on The Memes")).toBeInTheDocument();
    const memeCardLink = screen.getByRole("link", {
      name: "The Memes #521",
    });

    expect(memeCardLink).toHaveAttribute("href", "/the-memes/521");
    expect(memeCardLink).toHaveClass("tw-px-2.5", "tw-py-0.5", "tw-text-xs");
    expect(memeCardLink.parentElement).toHaveTextContent(
      "Minted on The MemesThe Memes #521"
    );
  });

  it("does not infer a Meme card pill when the mapping is absent", () => {
    renderSummary({ submission_context: {} } as ExtendedDrop);

    expect(
      screen.queryByRole("link", { name: /The Memes #/ })
    ).not.toBeInTheDocument();
  });
});

it("renders accepted collaborator attribution once through the author metadata row", () => {
  renderSummary({
    submission_context: {},
    collaborators: [
      { id: "B", handle: "artistB", display: "artistB", pfp: null },
    ],
  } as ExtendedDrop);
  expect(screen.getAllByRole("link", { name: "artistB" })).toHaveLength(1);
});

// Profile fetching and badge rendering have dedicated collaborator identity coverage.
jest.mock(
  "@/components/waves/memes/collaborations/MemeCollaboratorIdentity",
  () => ({
    MemeCollaboratorIdentity: ({
      collaborator,
    }: {
      collaborator: { handle: string };
    }) => <a href={`/${collaborator.handle}`}>{collaborator.handle}</a>,
  })
);
