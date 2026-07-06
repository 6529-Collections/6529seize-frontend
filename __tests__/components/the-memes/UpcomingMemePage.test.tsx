import UpcomingMemePage from "@/components/the-memes/UpcomingMemePage";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/meme-calendar/MemeCalendarOverview", () => ({
  MemeCalendarOverviewNextMint: ({ id }: { readonly id?: number }) => (
    <div data-testid="upcoming-mint-calendar" data-token-id={id} />
  ),
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintSubscribe", () => ({
  __esModule: true,
  default: ({ tokenId }: { readonly tokenId?: number }) => (
    <div data-testid="upcoming-subscription-widget" data-token-id={tokenId} />
  ),
}));

describe("UpcomingMemePage", () => {
  it("shows mint timing and subscription awareness for unresolved meme ids", () => {
    render(<UpcomingMemePage id="519" />);

    expect(screen.getByTestId("upcoming-mint-calendar")).toHaveAttribute(
      "data-token-id",
      "519"
    );
    expect(screen.getByTestId("upcoming-subscription-widget")).toHaveAttribute(
      "data-token-id",
      "519"
    );
  });
});
