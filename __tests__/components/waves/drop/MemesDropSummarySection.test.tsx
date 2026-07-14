import { MemesDropSummarySection } from "@/components/waves/drop/MemesDropSummarySection";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/waves/drop/WaveDropMetaRow", () => ({
  WaveDropMetaRow: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  it("shows a prominent mapped Meme card pill with the minted outcome", () => {
    renderSummary({
      submission_context: { meme_card_id: 521 },
    } as ExtendedDrop);

    expect(screen.getByText("Minted on The Memes")).toBeInTheDocument();
    const memeCardLink = screen.getByRole("link", {
      name: "The Memes #521",
    });

    expect(memeCardLink).toHaveAttribute("href", "/the-memes/521");
    expect(memeCardLink).toHaveClass("tw-min-h-9", "tw-px-4", "tw-text-base");
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
