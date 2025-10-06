import { render, screen } from "@testing-library/react";
import UserPageStatsCollected from "@/components/user/stats/UserPageStatsCollected";

const ownerBalance = {
  total_balance: 5,
  memes_balance: 2,
  nextgen_balance: 1,
  gradients_balance: 2,
  memelab_balance: 0,
  total_balance_rank: 1,
  memes_balance_rank: 2,
  nextgen_balance_rank: 3,
  gradients_balance_rank: 4,
  memelab_balance_rank: 5,
  boosted_tdh: 10,
  boosted_memes_tdh: 5,
  boosted_nextgen_tdh: 1,
  boosted_gradients_tdh: 2,
  boosted_tdh_rank: 1,
  boosted_memes_tdh_rank: 2,
  boosted_nextgen_tdh_rank: 3,
  boosted_gradients_tdh_rank: 4,
} as any;

const balanceMemes = [
  {
    season: 1,
    consolidation_key: "1",
    balance: 1,
    unique: 1,
    sets: 1,
    rank: 2,
    boosted_tdh: 1,
    tdh_rank: 1,
  },
];

const seasons = [{ id: 1, count: 2, start_index:1, end_index:2, name:"S1", display:"Season 1" }];

test("renders collected stats", () => {
  render(
    <UserPageStatsCollected ownerBalance={ownerBalance} balanceMemes={balanceMemes} seasons={seasons} />
  );
  expect(screen.getByText("Collected")).toBeInTheDocument();
  expect(
    screen.getByText((_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "1 / 2 (50%)")
  ).toBeInTheDocument();
  // check rank formatting
  expect(screen.getAllByText("#1").length).toBeGreaterThan(0);
});
