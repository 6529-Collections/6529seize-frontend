import { renderHook } from "@testing-library/react";
import type { ContextType, ReactNode } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { AuthContext } from "@/components/auth/Auth";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useDropEditWindow } from "@/hooks/useDropEditWindow";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
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

const HOUR = 60 * 60 * 1000;

const pollPost = {
  id: "d1",
  drop_type: ApiDropType.Chat,
  author: { handle: "me", is_anonymous: false },
  created_at: WAVES_FREEZE_MS + HOUR,
  updated_at: null,
  poll: {},
  context_profile_context: { max_rating: 10 },
  wave: {
    id: "w1",
    description_drop_id: "description",
    authenticated_user_eligible_to_vote: true,
    authenticated_user_eligible_to_chat: true,
    authenticated_user_admin: true,
    admin_drop_deletion_enabled: false,
  },
} as unknown as ApiDrop;

/** The real hooks, the real clock and a real scope, as a page has them. */
const inWave =
  (staysOnSite: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider
      value={
        {
          connectedProfile: { id: "p1", handle: "me" },
          activeProfileProxy: null,
        } as unknown as ContextType<typeof AuthContext>
      }
    >
      <WavesMoveScope
        wave={{ id: "w1", stays_on_site: staysOnSite }}
        waveId="w1"
      >
        {children}
      </WavesMoveScope>
    </AuthContext.Provider>
  );

describe("a post with a poll from the freeze, with real scopes", () => {
  beforeEach(() => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + HOUR + 1000 });
  });
  afterEach(() => {
    jest.useRealTimers();
    clearWavesFreeze();
  });

  it("can't be edited, deleted or pinned in a wave that moves", () => {
    const rules = renderHook(() => useDropInteractionRules(pollPost), {
      wrapper: inWave(false),
    }).result.current;
    expect(rules.canDelete).toBe(false);
    expect(rules.canSetPinnedDrop).toBe(false);
    expect(
      renderHook(() => useDropEditWindow(pollPost, true), {
        wrapper: inWave(false),
      }).result.current
    ).toBe(false);
  });

  it("keeps everything in a wave that stays", () => {
    const rules = renderHook(() => useDropInteractionRules(pollPost), {
      wrapper: inWave(true),
    }).result.current;
    expect(rules.canDelete).toBe(true);
    expect(rules.canSetPinnedDrop).toBe(true);
    expect(
      renderHook(() => useDropEditWindow(pollPost, true), {
        wrapper: inWave(true),
      }).result.current
    ).toBe(true);
  });
});
