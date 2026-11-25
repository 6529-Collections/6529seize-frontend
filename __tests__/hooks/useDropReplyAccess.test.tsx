import { act, renderHook } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { DropClientDeliveryState } from "@/helpers/waves/drop.helpers";
import { useDropReplyAccess } from "@/hooks/drops/useDropReplyAccess";
import { useWaveReplyTarget } from "@/hooks/drops/useWaveReplyTarget";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

const mockUseAuth = jest.fn();
const mockUseWaveData = jest.fn();
const mockSessionMatches = jest.fn();
let mockConnection: Record<string, unknown>;
let mockModeration: {
  isLoading: boolean;
  isSuspended: boolean;
  isError: boolean;
};
let mockEligibility: Record<string, unknown> | null;
let mockWalletAddress: string | null;

jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockUseAuth() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/components/auth/auth-session-scope", () => ({
  isAuthSessionForProfile: (...args: unknown[]) => mockSessionMatches(...args),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockWalletAddress,
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: (...args: unknown[]) => mockUseWaveData(...args),
}));
jest.mock(
  "@/hooks/content-moderation/usePublicProfileModerationStatus",
  () => ({ usePublicProfileModerationStatus: () => mockModeration })
);
jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({ getEligibility: () => mockEligibility }),
}));

const profile = { id: "profile-1", handle: "alice" };
const ownAuth = {
  connectedProfile: profile,
  isAuthenticated: true,
  isDirectProfileSession: true,
  activeProfileProxy: null,
  fetchingProfile: false,
};
const createWave = (chat: Record<string, unknown> = {}): ApiWave =>
  ({
    id: "wave-1",
    chat: { enabled: true, authenticated_user_eligible: true, ...chat },
  }) as ApiWave;
const drop = { id: "drop-1", wave: { id: "wave-1" } } as ApiDrop;
const target = { action: ActiveDropAction.REPLY, drop, partId: 1 };

beforeEach(() => {
  jest.useRealTimers();
  mockUseAuth.mockReturnValue(ownAuth);
  mockConnection = {
    address: "0xabc",
    hasValidWalletAuth: true,
    connectionState: "connected",
  };
  mockWalletAddress = "0xabc";
  mockModeration = { isLoading: false, isSuspended: false, isError: false };
  mockEligibility = null;
  mockUseWaveData.mockReturnValue({
    data: createWave(),
    isError: false,
    refetch: jest.fn(),
  });
  mockSessionMatches.mockReturnValue(true);
});
afterEach(() => jest.useRealTimers());

describe("useDropReplyAccess", () => {
  it("permits a settled own profile and reuses the existing wave query", () => {
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(true);
    expect(result.current.canReplyToDrop(drop)).toBe(true);
    expect(mockUseWaveData).toHaveBeenCalledWith(
      expect.objectContaining({
        waveId: "wave-1",
        viewerKey: expect.any(String),
      })
    );
  });

  it("does not request Reply access for a context that intentionally suppresses Reply", () => {
    const { result } = renderHook(() =>
      useDropReplyAccess("wave-1", undefined, false)
    );
    expect(result.current.canReply).toBe(false);
    expect(mockUseWaveData).toHaveBeenLastCalledWith(
      expect.objectContaining({ waveId: null })
    );
  });

  it.each([
    ["signed out", { connectedProfile: null, isAuthenticated: false }],
    ["no handle", { connectedProfile: { id: "profile-1", handle: null } }],
    ["empty handle", { connectedProfile: { id: "profile-1", handle: " " } }],
    ["unauthenticated loaded profile", { isAuthenticated: false }],
    ["unresolved session role", { isDirectProfileSession: undefined }],
    ["orphan proxy-role session", { isDirectProfileSession: false }],
    ["active proxy", { activeProfileProxy: { id: "proxy-1" } }],
    ["profile resolving", { fetchingProfile: true }],
  ])("blocks %s without fetching wave access", (_name, overrides) => {
    mockUseAuth.mockReturnValue({ ...ownAuth, ...overrides });
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(false);
    expect(result.current.canReplyToDrop(drop)).toBe(false);
    expect(mockUseWaveData).toHaveBeenLastCalledWith(
      expect.objectContaining({ waveId: null })
    );
  });

  it.each(["initializing", "connecting"])(
    "blocks %s auth",
    (connectionState) => {
      mockConnection = { ...mockConnection, connectionState };
      const { result } = renderHook(() => useDropReplyAccess("wave-1"));
      expect(result.current.canReply).toBe(false);
    }
  );

  it.each([
    ["posting access loading", { isLoading: true, isSuspended: false }],
    ["suspended profile", { isLoading: false, isSuspended: true }],
  ])("blocks %s", (_name, moderation) => {
    mockModeration = { ...mockModeration, ...moderation };
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(false);
  });

  it("keeps backend authority when the public moderation lookup fails", () => {
    mockModeration.isError = true;
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(true);
  });

  it("blocks disabled chat even with open replies and an eligible profile", () => {
    mockUseWaveData.mockReturnValue({
      refetch: jest.fn(),
      data: createWave({
        enabled: false,
        replies: { authenticated_user_eligible: true },
      }),
    });
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(false);
  });

  it("allows open replies outside the chat group", () => {
    mockUseWaveData.mockReturnValue({
      refetch: jest.fn(),
      data: createWave({
        authenticated_user_eligible: false,
        replies: { authenticated_user_eligible: true },
      }),
    });
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReplyToDrop(drop)).toBe(true);
  });

  it("uses live central eligibility when cached wave data still grants chat", () => {
    const { result, rerender } = renderHook(() => useDropReplyAccess("wave-1"));
    const previousHandler = result.current.canReplyToDrop;
    mockEligibility = {
      authenticated_user_eligible_to_chat: false,
      authenticated_user_eligible_to_reply: false,
    };
    rerender();
    expect(result.current.canReply).toBe(false);
    expect(previousHandler(drop)).toBe(false);
  });

  it("permits slow-mode drafting and removes a stale grant when cooldown expires", () => {
    jest.useFakeTimers();
    mockUseWaveData.mockReturnValue({
      refetch: jest.fn(),
      data: createWave({
        authenticated_user_eligible: false,
        slow_mode_cooldown_ms: 1000,
        next_drop_allowed: Date.now() + 1000,
      }),
    });
    mockEligibility = {
      authenticated_user_eligible_to_chat: false,
      authenticated_user_eligible_to_reply: false,
      authenticated_user_chat_restriction: "SLOW_MODE",
    };
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReply).toBe(true);
    act(() => jest.advanceTimersByTime(1001));
    expect(result.current.canReply).toBe(false);
  });

  it("checks live token and wallet ownership at activation", () => {
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    const activate = result.current.canReplyToDrop;
    mockSessionMatches.mockReturnValue(false);
    expect(activate(drop)).toBe(false);
    mockSessionMatches.mockReturnValue(true);
    mockWalletAddress = "0xdef";
    expect(activate(drop)).toBe(false);
  });

  it("rejects stale callbacks after an identity change", () => {
    const { result, rerender } = renderHook(() => useDropReplyAccess("wave-1"));
    const activate = result.current.canReplyToDrop;
    mockUseAuth.mockReturnValue({
      ...ownAuth,
      connectedProfile: { id: "profile-2", handle: "bob" },
    });
    rerender();
    expect(activate(drop)).toBe(false);
    expect(result.current.canReplyToDrop(drop)).toBe(true);
  });

  it("rejects temporary, failed, and cross-wave targets", () => {
    const { result } = renderHook(() => useDropReplyAccess("wave-1"));
    expect(result.current.canReplyToDrop({ ...drop, id: "temp-1" })).toBe(
      false
    );
    expect(
      result.current.canReplyToDrop({
        ...drop,
        clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED,
      })
    ).toBe(false);
    expect(
      result.current.canReplyToDrop({
        ...drop,
        wave: { ...drop.wave, id: "other-wave" },
      })
    ).toBe(false);
  });
});

describe("useWaveReplyTarget", () => {
  it("clears an invalid selection and does not resurrect it when access returns", () => {
    const wave = createWave();
    const { result, rerender } = renderHook(() => useWaveReplyTarget(wave));
    act(() => result.current.setActiveDrop(target));
    expect(result.current.activeDrop).toEqual(target);
    mockEligibility = {
      authenticated_user_eligible_to_chat: false,
      authenticated_user_eligible_to_reply: false,
    };
    rerender();
    expect(result.current.activeDrop).toBeNull();
    mockEligibility = null;
    rerender();
    expect(result.current.activeDrop).toBeNull();
  });

  it("clears reply ownership when switching profiles and rejects the held callback", () => {
    const wave = createWave();
    const { result, rerender } = renderHook(() => useWaveReplyTarget(wave));
    const previousSetter = result.current.setActiveDrop;
    act(() => previousSetter(target));
    mockUseAuth.mockReturnValue({
      ...ownAuth,
      connectedProfile: { id: "profile-2", handle: "bob" },
    });
    rerender();
    expect(result.current.activeDrop).toBeNull();
    act(() => previousSetter(target));
    expect(result.current.activeDrop).toBeNull();
  });

  it("waits for posting access before selecting the single-drop default", () => {
    const wave = createWave();
    mockModeration.isLoading = true;
    const { result, rerender } = renderHook(() =>
      useWaveReplyTarget(wave, drop)
    );
    expect(result.current.activeDrop).toBeNull();
    mockModeration.isLoading = false;
    rerender();
    expect(result.current.activeDrop).toEqual(target);
    mockModeration.isSuspended = true;
    rerender();
    expect(result.current.activeDrop).toBeNull();
    mockModeration.isSuspended = false;
    rerender();
    expect(result.current.activeDrop).toBeNull();
  });

  it.each([
    ["temporary", { ...drop, id: "temp-1" }],
    ["another wave", { ...drop, wave: { ...drop.wave, id: "other-wave" } }],
    [
      "moderation rejected",
      {
        ...drop,
        clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED,
      },
    ],
  ] as const)("never selects an initial %s target", (_name, initialDrop) => {
    const { result } = renderHook(() =>
      useWaveReplyTarget(createWave(), initialDrop)
    );
    expect(result.current.activeDrop).toBeNull();
  });

  it("rejects selecting while proxy access is active", () => {
    mockUseAuth.mockReturnValue({
      ...ownAuth,
      isDirectProfileSession: false,
      activeProfileProxy: { id: "proxy-1" },
    });
    const { result } = renderHook(() => useWaveReplyTarget(createWave()));
    act(() => result.current.setActiveDrop(target));
    expect(result.current.activeDrop).toBeNull();
  });
});
