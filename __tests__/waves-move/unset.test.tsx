import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WavesMoveNotice from "@/components/waves-move/WavesMoveNotice";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropVoteState } from "@/hooks/drops/types";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import {
  useWavesMovePhase,
  useWavesPausedReason,
  useWavesWritesPaused,
} from "@/hooks/useWavesMovePhase";
import {
  getWavesMoveSchedule,
  isWavesWritePaused,
} from "@/lib/waves-move/schedule";
import { assertWavesWriteAllowed } from "@/lib/waves-move/writeGuard";
import {
  clearWavesFreeze,
  WAVES_FREEZE_MS,
  WAVES_SWITCH_ON_MS,
} from "@/__tests__/helpers/wavesFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
      };
    },
  };
});
jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 2000) },
}));

const HOUR = 60 * 60 * 1000;
const API = "https://api.example.test/api";

const entry = {
  id: "d1",
  drop_type: ApiDropType.Participatory,
  author: { handle: "author" },
  context_profile_context: { max_rating: 10 },
  wave: {
    id: "w1",
    voting_period_start: 0,
    voting_period_end: 3000,
    authenticated_user_eligible_to_vote: true,
    authenticated_user_eligible_to_chat: true,
    authenticated_user_admin: false,
    admin_drop_deletion_enabled: false,
  },
} as never;

const author = ({ children }: { children: ReactNode }) => (
  <AuthContext.Provider
    value={
      {
        connectedProfile: { id: "p1", handle: "author" },
        activeProfileProxy: null,
      } as never
    }
  >
    {children}
  </AuthContext.Provider>
);

/**
 * Part of the change ships before the two times are set in the build. Until
 * then the site must behave exactly as it does today, even after the planned
 * freeze and switch-on instants have passed.
 */
describe.each([
  ["before the planned freeze", WAVES_FREEZE_MS - HOUR],
  ["after the planned freeze", WAVES_FREEZE_MS + HOUR],
  ["after the planned switch-on", WAVES_SWITCH_ON_MS + 24 * HOUR],
])("with neither time set, %s", (_when, now) => {
  beforeEach(() => {
    clearWavesFreeze();
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("has no schedule and pauses nothing", () => {
    expect(getWavesMoveSchedule()).toBeNull();
    expect(isWavesWritePaused(now)).toBe(false);
  });

  it("shows no notice", () => {
    const { container } = render(<WavesMoveNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("leaves waves writes open, with no paused line", () => {
    const { result } = renderHook(() => ({
      phase: useWavesMovePhase(),
      paused: useWavesWritesPaused(),
      reason: useWavesPausedReason(),
    }));
    expect(result.current).toEqual({
      phase: "none",
      paused: false,
      reason: null,
    });
  });

  it("lets an entry be voted on and withdrawn as today", () => {
    const { result } = renderHook(() => useDropInteractionRules(entry), {
      wrapper: author,
    });
    expect(result.current.voteState).toBe(DropVoteState.CAN_VOTE);
    expect(result.current.canDelete).toBe(true);
  });

  it.each([
    [
      "a vote on a decision entry",
      "POST",
      "v3/waves/w1/competitions/c1/entries/e1/votes/me",
      "{}",
    ],
    [
      "a new entry",
      "POST",
      "drops",
      JSON.stringify({ drop_type: "PARTICIPATORY" }),
    ],
    ["a poll ballot", "POST", "v2/drops/d1/poll/vote", "{}"],
    ["wave REP", "POST", "waves/w1/rep/rating", "{}"],
    ["a wave's settings", "POST", "waves/w1", "{}"],
    ["a new decision", "POST", "v3/waves/w1/competitions", "{}"],
  ])("sends %s as today", (_name, method, path, body) => {
    expect(() =>
      assertWavesWriteAllowed({ url: `${API}/${path}`, method, body })
    ).not.toThrow();
  });
});
