import { render, screen } from "@testing-library/react";
import { ActiveWaveVoteCard } from "@/components/waves/discovery/ActiveWaveVoteCard";
import { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

let mockDisplayTimeZone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
jest.mock("@/hooks/useDisplayTimeZone", () => ({
  ...jest.requireActual("@/hooks/useDisplayTimeZone"),
  useDisplayTimeZone: () => mockDisplayTimeZone,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/drops/ContentDisplay", () => ({
  __esModule: true,
  default: () => <span>Vote description</span>,
}));

function vote(end: number | null, decision: number | null): ApiActiveWaveVote {
  return Object.assign(new ApiActiveWaveVote(), {
    voting_ends_at: end,
    next_decision_at: decision,
    wave: Object.assign(new ApiWaveOverview(), {
      id: "vote-card",
      name: "Community acquisition",
      pfp: "https://example.com/wave.png",
      creator: new ApiProfileMin(),
      created_at: 0,
      last_drop_time: 0,
      has_competition: true,
      is_dm_wave: false,
      description_drop: { contents: "Vote description", media: [] },
      total_drops_count: 2,
      is_private: false,
    }),
  });
}

it.each([
  [100000, 200000, /^Voting ends /],
  [200000, 100000, /^Next result /],
  [null, null, /^Voting open$/],
] as const)(
  "shows the appropriate deadline beneath the name",
  (end, decision, label) => {
    render(<ActiveWaveVoteCard vote={vote(end, decision)} />);
    const link = screen.getByRole("link", { name: /Community acquisition/ });
    expect(link).toHaveAttribute("href", "/waves/vote-card");
    expect(
      screen.getByRole("img", { name: /Community acquisition/ })
    ).toBeVisible();
    const deadline = screen.getByText(label);
    expect(link).toContainElement(deadline);
    expect(
      screen
        .getByText("Community acquisition")
        .compareDocumentPosition(deadline) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      deadline.compareDocumentPosition(screen.getByText("Vote description")) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  }
);

it("shows the next result time in the display time zone", () => {
  mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
  try {
    render(
      <ActiveWaveVoteCard vote={vote(null, Date.UTC(2026, 0, 1, 23, 59))} />
    );
    expect(
      screen.getByText(/^Next result Jan 1, 11:59\sPM UTC$/)
    ).toBeVisible();
  } finally {
    mockDisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
  }
});
