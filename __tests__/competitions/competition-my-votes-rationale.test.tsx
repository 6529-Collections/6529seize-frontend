import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompetitionMyVotes from "@/components/competitions/CompetitionMyVotes";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";

let mockParts: { part_id: number }[] = [{ part_id: 1 }];
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: "competition",
      wave_id: "wave",
      type: "RANK",
      voting: { credit_scope: "WAVE" },
      permissions: { vote: true },
    },
    wave: { id: "wave" },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: () => ({ data: { remaining: 10 } }),
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: () => jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer",
  useCompetitionResource: () => ({
    refetch: jest.fn(),
    data: {
      pages: [
        {
          data: [
            {
              entry_id: "entry",
              drop_id: "drop",
              entry_status: "ACTIVE",
              value: 7,
            },
            {
              entry_id: "winner",
              drop_id: "winner-drop",
              entry_status: "WINNER",
            },
          ],
        },
      ],
    },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: jest.fn(() => [
    {
      data: {
        entry: { status: "ACTIVE" },
        drop: { id: "drop", parts: mockParts },
      },
    },
  ]),
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVotesReset",
  () => () => null
);
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVote",
  () =>
    ({ voteInput }: { voteInput: ReactNode }) =>
      voteInput
);
jest.mock("@/components/competitions/CompetitionVote", () => ({
  CompetitionVoteForm: ({
    onExplainVote,
  }: {
    onExplainVote?: (total: number, change: number) => void;
  }) =>
    onExplainVote ? (
      <button onClick={() => onExplainVote(4, 1)}>Explain vote</button>
    ) : null,
}));
jest.mock("@/hooks/useInView", () => ({
  useInView: () => [{ current: null }, true],
}));
jest.mock("@/components/waves/PrivilegedDropCreator", () => ({
  __esModule: true,
  DropMode: { CHAT: "CHAT" },
  default: ({
    onCancelReplyQuote,
    onDropAddedToQueue,
    focusOnInitialActiveDrop,
  }: {
    onCancelReplyQuote: () => void;
    onDropAddedToQueue: () => void;
    focusOnInitialActiveDrop: boolean;
  }) => (
    <div>
      <input aria-label="Rationale" autoFocus={focusOnInitialActiveDrop} />
      <button onClick={onCancelReplyQuote}>Cancel rationale</button>
      <button onClick={onDropAddedToQueue}>Send rationale</button>
    </div>
  ),
}));

beforeEach(() => {
  mockParts = [{ part_id: 1 }];
});

it.each(["Cancel rationale", "Send rationale"])(
  "returns focus to the native vote action after %s",
  async (action) => {
    const user = userEvent.setup();
    render(<CompetitionMyVotes />);
    const trigger = screen.getByRole("button", { name: "Explain vote" });
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Rationale" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: action }));
    expect(screen.queryByRole("textbox", { name: "Rationale" })).toBeNull();
    expect(trigger).toHaveFocus();
  }
);

it("omits the reply action when a malformed entry has no replyable part", () => {
  mockParts = [];
  render(<CompetitionMyVotes />);
  expect(screen.queryByRole("button", { name: "Explain vote" })).toBeNull();
});

it("excludes past winners before loading active My Votes cards", () => {
  render(<CompetitionMyVotes />);
  expect(useCompetitionEntryDrops).toHaveBeenLastCalledWith(
    [{ entryId: "entry", dropId: "drop" }],
    expect.objectContaining({ contexts: [] })
  );
});

it("retains the personal vote and a retry when its card is omitted", async () => {
  const retry = jest.fn();
  jest
    .mocked(useCompetitionEntryDrops)
    .mockReturnValueOnce([{ data: null, refetch: retry }] as never);
  render(<CompetitionMyVotes />);
  expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
  expect(screen.getByText("Your vote: 7")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it("offers recovery instead of a perpetual loader for a pending row with no fetch", () => {
  jest.mocked(useCompetitionEntryDrops).mockReturnValueOnce([
    {
      data: undefined,
      isPending: true,
      isFetching: false,
      refetch: jest.fn(),
    },
  ] as never);
  render(<CompetitionMyVotes />);
  expect(screen.getByText("Your vote: 7")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  expect(screen.queryByText("Loading competition…")).toBeNull();
});
