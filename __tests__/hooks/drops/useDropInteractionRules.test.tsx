import { renderHook } from "@testing-library/react";
import React from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { AuthContext } from "@/components/auth/Auth";
import { ApiDropType } from "@/generated/models/ApiDropType";

const wrapper =
  (value: any) =>
  ({ children }: any) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );

jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 2000) },
}));

describe("useDropInteractionRules", () => {
  const baseDrop: any = {
    id: "d1",
    drop_type: ApiDropType.Participatory,
    author: { handle: "me" },
    context_profile_context: { max_rating: 1 },
    wave: {
      voting_period_start: 0,
      voting_period_end: 3000,
      authenticated_user_eligible_to_vote: true,
      authenticated_user_admin: false,
      admin_drop_deletion_enabled: false,
    },
  };

  it("requires login to vote", () => {
    const { result } = renderHook(() => useDropInteractionRules(baseDrop), {
      wrapper: wrapper({ connectedProfile: null, activeProfileProxy: null }),
    });
    expect(result.current.canVote).toBe(false);
    expect(result.current.voteState).toBe("NOT_LOGGED_IN");
  });

  it("handles winner drops", () => {
    const drop = {
      ...baseDrop,
      drop_type: ApiDropType.Winner,
      winning_context: { place: 1 },
    };
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.isWinner).toBe(true);
    expect(result.current.winningRank).toBe(1);
    expect(result.current.canVote).toBe(false);
  });

  it("detects voting ended", () => {
    const drop = {
      ...baseDrop,
      wave: { ...baseDrop.wave, voting_period_end: 1000 },
    };
    jest.spyOn(Date, "now").mockReturnValue(2000);
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.isVotingEnded).toBe(true);
  });

  it("allows wave admins to set the pinned drop", () => {
    const drop = {
      ...baseDrop,
      wave: { ...baseDrop.wave, authenticated_user_admin: true },
    };
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.canSetPinnedDrop).toBe(true);
  });

  it("does not allow non-admin authors to set the pinned drop", () => {
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    };
    const { result } = renderHook(() => useDropInteractionRules(baseDrop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.canSetPinnedDrop).toBe(false);
  });

  it("does not allow proxy users to set the pinned drop", () => {
    const drop = {
      ...baseDrop,
      wave: { ...baseDrop.wave, authenticated_user_admin: true },
    };
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: { id: "proxy-1" },
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.canSetPinnedDrop).toBe(false);
  });

  it("does not allow temporary drops to be set as pinned drop", () => {
    const drop = {
      ...baseDrop,
      id: "temp-123",
      wave: { ...baseDrop.wave, authenticated_user_admin: true },
    };
    const ctx = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper(ctx),
    });
    expect(result.current.canSetPinnedDrop).toBe(false);
  });

  it("does not allow logged-out users to set the pinned drop", () => {
    const drop = {
      ...baseDrop,
      wave: { ...baseDrop.wave, authenticated_user_admin: true },
    };
    const { result } = renderHook(() => useDropInteractionRules(drop), {
      wrapper: wrapper({ connectedProfile: null, activeProfileProxy: null }),
    });
    expect(result.current.canSetPinnedDrop).toBe(false);
  });
});
