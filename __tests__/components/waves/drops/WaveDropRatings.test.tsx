import { fireEvent, render, screen } from "@testing-library/react";
import WaveDropRatings from "@/components/waves/drops/WaveDropRatings";
import type { ReactNode } from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (url: string) => `scaled:${url}`,
  ImageScale: { W_AUTO_H_50: "W_AUTO_H_50" },
}));
jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger",
  () => ({
    __esModule: true,
    default: ({ drop }: any) => (
      <button
        type="button"
        aria-label={`View voters and vote log for ${drop.raters_count} ${
          drop.raters_count === 1 ? "voter" : "voters"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {drop.raters_count} {drop.raters_count === 1 ? "voter" : "voters"}
      </button>
    ),
  })
);

const drop = {
  id: "drop-1",
  rating: 12,
  realtime_rating: 25,
  rating_prediction: 15,
  raters_count: 2,
  top_raters: [
    {
      rating: 3,
      profile: {
        id: "profile-1",
        handle: "alice",
        primary_address: "0xalice",
        pfp: "alice.png",
      },
    },
    {
      rating: 2,
      profile: {
        id: "profile-2",
        handle: "bob",
        primary_address: "0xbob",
        pfp: null,
      },
    },
  ],
  wave: { voting_credit_type: "REP" },
  context_profile_context: { rating: 5 },
} as any;

describe("WaveDropRatings", () => {
  it("renders vote details while keeping rater profile links separate", () => {
    render(<WaveDropRatings drop={drop} />);

    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "alice • 3 Rep" })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.getByRole("link", { name: "bob • 2 Rep" })).toHaveAttribute(
      "href",
      "/bob"
    );
  });

  it("does not bubble vote details clicks to the parent row", () => {
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <WaveDropRatings drop={drop} />
      </div>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    );

    expect(parentClick).not.toHaveBeenCalled();
  });

  it("uses realtime vote progress for approve winner totals", () => {
    render(<WaveDropRatings drop={drop} winningThreshold={42_000_000} />);

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Votes given now: 25")).toBeInTheDocument();
  });
});
