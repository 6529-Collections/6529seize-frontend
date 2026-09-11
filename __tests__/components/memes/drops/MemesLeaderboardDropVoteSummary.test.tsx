import { render, screen } from "@testing-library/react";
import React from "react";
import MemesLeaderboardDropVoteSummary from "@/components/memes/drops/MemesLeaderboardDropVoteSummary";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));
jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: () => <div data-testid="progress" />,
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

describe("MemesLeaderboardDropVoteSummary", () => {
  const voter = {
    profile: { id: "profile-bob", handle: "bob", primary_address: "0x123", pfp: "" },
    rating: 2,
  } as any;
  it("shows positive current value and voter count text", () => {
    const drop = {
      id: "drop-1",
      rating: 5,
      rating_prediction: 6,
      raters_count: 1,
      top_raters: [voter],
      wave: { voting_credit_type: "pts" },
      context_profile_context: null,
    } as any;

    render(<MemesLeaderboardDropVoteSummary drop={drop} />);
    expect(screen.getByText("5")).toHaveClass(
      "tw-text-iron-100",
      "tw-font-semibold"
    );
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 1 voter",
      })
    ).toBeInTheDocument();
  });

  it("shows user vote", () => {
    const drop = {
      id: "drop-1",
      rating: -1,
      rating_prediction: 0,
      raters_count: 2,
      top_raters: [],
      wave: { voting_credit_type: "pts" },
      context_profile_context: { rating: -3 },
    } as any;

    render(<MemesLeaderboardDropVoteSummary drop={drop} />);
    expect(screen.getByText("Your vote:")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it.each([
    { handle: " bob/name ", address: "0x123", identity: "bob/name" },
    { handle: " ", address: "0x123", identity: "0x123" },
    { handle: null, address: "UNKNOWN", identity: "profile-bob" },
    { handle: "", address: "", identity: "profile-bob" },
  ])(
    "links to the usable voter identity $identity",
    ({ handle, address, identity }) => {
      const drop = {
        id: "drop-1",
        rating: 5,
        rating_prediction: 6,
        raters_count: 1,
        top_raters: [
          {
            profile: {
              id: "profile-bob",
              handle,
              primary_address: address,
              pfp: "",
            },
            rating: 2,
          },
        ],
        wave: { voting_credit_type: "pts" },
        context_profile_context: null,
      } as React.ComponentProps<typeof MemesLeaderboardDropVoteSummary>["drop"];

      render(<MemesLeaderboardDropVoteSummary drop={drop} />);
      const link = screen.getByRole("link", { name: `Voter ${identity}` });
      expect(link).toHaveAttribute("href", `/${encodeURIComponent(identity)}`);
      expect(link).toHaveAttribute(
        "data-tooltip-id",
        "voter-drop-1-profile-bob"
      );
    }
  );
});
