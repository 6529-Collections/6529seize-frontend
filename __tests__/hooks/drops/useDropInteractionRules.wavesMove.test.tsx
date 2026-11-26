import { renderHook } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropVoteState } from "@/hooks/drops/types";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useWavesWritesPaused } from "@/hooks/useWavesMovePhase";

jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 2000) },
}));
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useWavesWritesPaused: jest.fn(() => false),
}));

const paused = useWavesWritesPaused as jest.Mock;

const wrapper =
  (value: any) =>
  ({ children }: any) => (
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        isDirectProfileSession: true,
        fetchingProfile: false,
        ...value,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

const me = wrapper({
  connectedProfile: { id: "p1", handle: "me" },
  activeProfileProxy: null,
});

const entry: any = {
  id: "d1",
  drop_type: ApiDropType.Participatory,
  author: { handle: "me" },
  context_profile_context: { max_rating: 10 },
  wave: {
    voting_period_start: 0,
    voting_period_end: 3000,
    authenticated_user_eligible_to_vote: true,
    authenticated_user_eligible_to_chat: true,
    authenticated_user_admin: false,
    admin_drop_deletion_enabled: false,
  },
};

const chat: any = { ...entry, id: "d2", drop_type: ApiDropType.Chat };

describe("useDropInteractionRules during the move to the 6529 Network", () => {
  afterEach(() => {
    paused.mockReturnValue(false);
  });

  it("votes as before when nothing is paused", () => {
    const { result } = renderHook(() => useDropInteractionRules(entry), {
      wrapper: me,
    });
    expect(result.current.voteState).toBe(DropVoteState.CAN_VOTE);
    expect(result.current.canDelete).toBe(true);
  });

  it("shows the vote but does not take it while paused", () => {
    paused.mockReturnValue(true);
    const { result } = renderHook(() => useDropInteractionRules(entry), {
      wrapper: me,
    });
    expect(result.current.voteState).toBe(DropVoteState.PAUSED);
    expect(result.current.canShowVote).toBe(true);
    expect(result.current.canVote).toBe(false);
  });

  it("keeps ratings of chat drops, which stay on this site", () => {
    paused.mockReturnValue(true);
    const { result } = renderHook(() => useDropInteractionRules(chat), {
      wrapper: me,
    });
    expect(result.current.voteState).toBe(DropVoteState.CAN_VOTE);
    expect(result.current.canVote).toBe(true);
  });

  it("keeps the reasons that hide the vote ahead of the pause", () => {
    paused.mockReturnValue(true);
    const { result } = renderHook(
      () =>
        useDropInteractionRules({
          ...entry,
          wave: { ...entry.wave, authenticated_user_eligible_to_vote: false },
        }),
      { wrapper: me }
    );
    expect(result.current.voteState).toBe(DropVoteState.CANT_VOTE);
    expect(result.current.canShowVote).toBe(false);
  });

  it("stops withdrawing entries but keeps chat deletion while paused", () => {
    paused.mockReturnValue(true);
    const entryRules = renderHook(() => useDropInteractionRules(entry), {
      wrapper: me,
    });
    const chatRules = renderHook(() => useDropInteractionRules(chat), {
      wrapper: me,
    });
    expect(entryRules.result.current.canDelete).toBe(false);
    expect(chatRules.result.current.canDelete).toBe(true);
  });

  describe("once entries move to the 6529 Network", () => {
    // Entries open there; deleting another's entry (moderation) does not.
    beforeEach(() => {
      paused.mockImplementation((kind?: string) => kind === undefined);
    });

    afterEach(() => {
      paused.mockImplementation(() => false);
    });

    const admin = wrapper({
      connectedProfile: { id: "p2", handle: "admin" },
      activeProfileProxy: null,
    });
    const adminWave = {
      ...entry.wave,
      authenticated_user_admin: true,
      admin_drop_deletion_enabled: true,
    };

    it("lets the author withdraw their own entry", () => {
      const { result } = renderHook(() => useDropInteractionRules(entry), {
        wrapper: me,
      });
      expect(paused).toHaveBeenCalledWith("entries");
      expect(result.current.canDelete).toBe(true);
    });

    it("keeps an admin's delete of someone else's entry closed", () => {
      const { result } = renderHook(
        () => useDropInteractionRules({ ...entry, wave: adminWave }),
        { wrapper: admin }
      );
      expect(result.current.canDelete).toBe(false);
    });

    it("keeps a winner where it is", () => {
      const { result } = renderHook(
        () =>
          useDropInteractionRules({
            ...entry,
            drop_type: ApiDropType.Winner,
          }),
        { wrapper: me }
      );
      expect(result.current.canDelete).toBe(false);
    });

    it("keeps an admin's delete of chat drops", () => {
      const { result } = renderHook(
        () =>
          useDropInteractionRules({
            ...chat,
            wave: adminWave,
          }),
        { wrapper: admin }
      );
      expect(result.current.canDelete).toBe(true);
    });
  });
});
