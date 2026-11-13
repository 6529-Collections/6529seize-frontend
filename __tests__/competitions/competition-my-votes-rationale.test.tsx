import { isAuthSessionForProfile } from "@/components/auth/auth-session-scope";
import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompetitionMyVotes from "@/components/competitions/CompetitionMyVotes";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";

let mockCanChat = true;
let mockViewer = "viewer";
let mockCompetitionId = "competition";
let mockPending = false;
const mockResource = jest.fn();
const mockRequestAuth = jest.fn();
const mockSetVote = jest.fn();
const mockResetControls = jest.fn();
const mockVoteData = {
  pages: [
    {
      data: [
        {
          entry_id: "entry",
          drop_id: "drop",
          entry_status: "ACTIVE",
          value: 7,
        },
        { entry_id: "winner", drop_id: "winner-drop", entry_status: "WINNER" },
      ],
    },
  ],
};
let mockParts: { part_id: number }[] = [{ part_id: 1 }];
jest.mock("@/components/auth/auth-session-scope", () => ({
  isAuthSessionForProfile: jest.fn(() => true),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: mockCompetitionId,
      wave_id: "wave",
      type: "RANK",
      voting: { credit_scope: "WAVE" },
      permissions: { vote: true },
    },
    wave: { id: "wave" },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  setCompetitionVote: (...args: unknown[]) => mockSetVote(...args),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: () => ({ data: { remaining: 10 } }),
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: () => jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
  useCompetitionResource: (...args: unknown[]) => {
    mockResource(...args);
    return {
      isPending: mockPending,
      refetch: jest.fn(),
      data: mockVoteData,
    };
  },
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: jest.fn(() => [
    {
      data: {
        entry: { status: "ACTIVE" },
        drop: {
          id: "drop",
          parts: mockParts,
          wave: { authenticated_user_eligible_to_chat: mockCanChat },
        },
      },
    },
  ]),
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVotesReset",
  () => (props: { toolbarContent?: ReactNode }) => {
    mockResetControls(props);
    return props.toolbarContent;
  }
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
  jest.mocked(isAuthSessionForProfile).mockReturnValue(true);
  localStorage.clear();
  mockResource.mockClear();
  mockRequestAuth.mockReset().mockResolvedValue({ success: true });
  mockSetVote.mockReset();
  mockResetControls.mockClear();
  mockViewer = "viewer";
  mockCompetitionId = "competition";
  mockPending = false;
  mockParts = [{ part_id: 1 }];
  mockCanChat = true;
});
it("stops an old reset before submitting when its profile changes during authentication", async () => {
  let finishAuth!: (result: { success: boolean }) => void;
  mockRequestAuth.mockReturnValue(
    new Promise((resolve) => {
      finishAuth = resolve;
    })
  );
  const { rerender } = render(<CompetitionMyVotes />);
  const { resetVote } = mockResetControls.mock.lastCall![0] as {
    resetVote: (id: string) => Promise<void>;
  };
  const pending = resetVote("drop");
  const rejection = expect(pending).rejects.toThrow("Voting session changed");
  mockViewer = "another-viewer";
  rerender(<CompetitionMyVotes />);
  await act(async () => finishAuth({ success: true }));
  await rejection;
  expect(mockSetVote).not.toHaveBeenCalled();
  await expect(resetVote("drop")).rejects.toThrow("Voting session changed");
});

it("blocks a reset when the token actor changes before React updates", async () => {
  let finishAuth!: (result: { success: boolean }) => void;
  mockRequestAuth.mockReturnValue(
    new Promise((resolve) => {
      finishAuth = resolve;
    })
  );
  render(<CompetitionMyVotes />);
  const { resetVote } = mockResetControls.mock.lastCall![0] as {
    resetVote: (id: string) => Promise<void>;
  };
  const pending = resetVote("drop");
  const rejection = expect(pending).rejects.toThrow("Voting session changed");
  jest.mocked(isAuthSessionForProfile).mockReturnValue(false);
  await act(async () => finishAuth({ success: true }));
  await rejection;
  expect(mockSetVote).not.toHaveBeenCalled();
});

it.each(["Cancel rationale", "Send rationale"])(
  "returns focus to the native vote action after %s",
  async (action) => {
    const user = userEvent.setup();
    render(<CompetitionMyVotes />);
    const trigger = screen.getByRole("button", { name: "Explain vote" });
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Rationale" })).toHaveFocus();
    expect(
      screen.getByText("Post a public reply in the wave about your saved vote.")
    ).toBeInTheDocument();
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
  expect(screen.queryByText("Loading decision…")).toBeNull();
});

it("omits the reply action when the voter cannot chat", () => {
  mockCanChat = false;
  render(<CompetitionMyVotes />);
  expect(screen.queryByRole("button", { name: "Explain vote" })).toBeNull();
});

it("keeps the order while explaining a vote, and restores it on remount", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<CompetitionMyVotes />);
  const sort = screen.getByRole("button", { name: /^Sort by:/ });
  expect(sort).toHaveAccessibleName("Sort by: Your vote amount");
  await user.click(sort);
  await user.click(
    screen.getByRole("menuitem", { name: "Leaderboard position" })
  );
  expect(mockResource).toHaveBeenLastCalledWith(
    { waveId: "wave", competitionId: "competition" },
    "votes/me",
    { include: "cards", sort: "leaderboard" },
    true
  );
  await user.click(screen.getByRole("button", { name: "Explain vote" }));
  expect(sort).toHaveAccessibleName("Sort by: Leaderboard position");
  await user.click(screen.getByRole("button", { name: "Cancel rationale" }));
  expect(sort).toHaveAccessibleName("Sort by: Leaderboard position");
  unmount();
  render(<CompetitionMyVotes />);
  expect(
    screen.getByRole("button", { name: /^Sort by:/ })
  ).toHaveAccessibleName("Sort by: Leaderboard position");
});

it("keeps the control available during a new order's loading state", async () => {
  mockPending = true;
  render(<CompetitionMyVotes />);
  await userEvent.click(screen.getByRole("button", { name: /^Sort by:/ }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Last voted" }));
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /^Sort by:/ })
  ).toHaveAccessibleName("Sort by: Last voted");
});

it("isolates preferences and interaction state when profile or competition changes", async () => {
  const { rerender } = render(<CompetitionMyVotes />);
  await userEvent.click(screen.getByRole("button", { name: /^Sort by:/ }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Last voted" }));
  await userEvent.click(screen.getByRole("button", { name: "Explain vote" }));
  mockViewer = "another-viewer";
  rerender(<CompetitionMyVotes />);
  expect(screen.queryByRole("textbox", { name: "Rationale" })).toBeNull();
  expect(
    screen.getByRole("button", { name: /^Sort by:/ })
  ).toHaveAccessibleName("Sort by: Your vote amount");
  mockViewer = "viewer";
  rerender(<CompetitionMyVotes />);
  expect(
    screen.getByRole("button", { name: /^Sort by:/ })
  ).toHaveAccessibleName("Sort by: Last voted");
  mockCompetitionId = "another-competition";
  rerender(<CompetitionMyVotes />);
  expect(
    screen.getByRole("button", { name: /^Sort by:/ })
  ).toHaveAccessibleName("Sort by: Your vote amount");
});

it("does not rerender the list when opening the menu or reselecting its current order", async () => {
  render(<CompetitionMyVotes />);
  const calls = mockResource.mock.calls.length;
  await userEvent.click(screen.getByRole("button", { name: /^Sort by:/ }));
  expect(mockResource).toHaveBeenCalledTimes(calls);
  await userEvent.click(
    screen.getByRole("menuitem", { name: "Your vote amount" })
  );
  expect(mockResource).toHaveBeenCalledTimes(calls);
});

it("reuses card references while interacting with the current list", async () => {
  render(<CompetitionMyVotes />);
  const references = jest
    .mocked(useCompetitionEntryDrops)
    .mock.calls.at(-1)?.[0];
  await userEvent.click(screen.getByRole("button", { name: "Explain vote" }));
  expect(jest.mocked(useCompetitionEntryDrops).mock.calls.at(-1)?.[0]).toBe(
    references
  );
});
