import { render, screen } from "@testing-library/react";
import UserPageStatsBoostBreakdown from "../../components/user/stats/UserPageStatsBoostBreakdown";

function makeTDH() {
  return {
    boost: 1.5,
    boost_breakdown: {
      memes_card_sets: { available: 2, available_info: ["info"], acquired: 1, acquired_info: [] },
      gradients: { available: 1, available_info: [], acquired: 0.5, acquired_info: [] },
      memes_szn1: undefined,
      memes_szn2: undefined,
      memes_szn3: undefined,
      memes_szn4: undefined,
      memes_szn5: undefined,
      memes_szn6: undefined,
      memes_szn7: undefined,
      memes_szn8: undefined,
      memes_szn9: undefined,
      memes_szn10: undefined,
      memes_genesis: undefined,
      memes_nakamoto: undefined,
    },
  } as any;
}

describe("UserPageStatsBoostBreakdown", () => {
  it("renders nothing without boost data", () => {
    const { container } = render(<UserPageStatsBoostBreakdown tdh={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows boost rows when data present", () => {
    render(<UserPageStatsBoostBreakdown tdh={makeTDH()} />);
    expect(screen.getByText("Boost Breakdown")).toBeInTheDocument();
    expect(screen.getByText("TOTAL BOOST")).toBeInTheDocument();
  });
});
