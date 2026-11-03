import { fireEvent, render, screen } from "@testing-library/react";
import { ActiveWaveVoteRow } from "@/components/waves/discovery/ActiveWaveVoteRow";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/WavePicture", () => () => null);

const vote = {
  wave: {
    id: "vote-wave",
    name: "Community acquisition",
    wave_score: {
      visibility_score: 83,
      quality_score: 78,
      hotness_score: 92,
      rep_sort_score: 41,
    },
  },
  voting_ends_at: null,
  next_decision_at: null,
} as ApiActiveWaveVote;

it.each([true, false])(
  "keeps score details separate from wave navigation (compact=%s)",
  async (compact) => {
    const onClick = jest.fn((event) => event.preventDefault());
    render(
      <ActiveWaveVoteRow vote={vote} compact={compact} onClick={onClick} />
    );
    const link = screen.getByRole("link", { name: /Community acquisition/ });
    const score = screen.getByRole("button", { name: /Wave score 83/ });
    expect(link).not.toContainElement(score);
    fireEvent.click(score);
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  }
);

it("keeps unscored waves navigable without inventing a zero score", () => {
  const { wave_score: _score, ...wave } = vote.wave;
  render(<ActiveWaveVoteRow vote={{ ...vote, wave }} compact />);
  expect(
    screen.getByRole("link", { name: /Community acquisition/ })
  ).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
