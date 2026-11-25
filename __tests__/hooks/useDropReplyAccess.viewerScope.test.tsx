import { act, renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useDropReplyAccess } from "@/hooks/drops/useDropReplyAccess";
import { getWaveQueryKey } from "@/services/api/wave-query";

const mockFetch = jest.fn();
let mockProfileId = "profile-a";
let mockAddress = "0xaaa";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockProfileId, handle: mockProfileId },
    isAuthenticated: true,
    isDirectProfileSession: true,
    activeProfileProxy: null,
    fetchingProfile: false,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
    hasValidWalletAuth: true,
    connectionState: "connected",
  }),
}));
jest.mock("@/components/auth/auth-session-scope", () => ({
  isAuthSessionForProfile: () => true,
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockAddress,
}));
jest.mock(
  "@/hooks/content-moderation/usePublicProfileModerationStatus",
  () => ({
    usePublicProfileModerationStatus: () => ({
      isLoading: false,
      isSuspended: false,
    }),
  })
);
jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  // Deliberately leave A's central grants present while B's response is delayed.
  useWaveEligibility: () => ({
    getEligibility: () => ({
      authenticated_user_eligible_to_chat: true,
      authenticated_user_eligible_to_reply: true,
    }),
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockFetch(...args),
  getStructuredApiErrorStatus: () => undefined,
}));

const wave = (eligible: boolean): ApiWave =>
  ({
    id: "wave-1",
    chat: {
      enabled: true,
      authenticated_user_eligible: eligible,
      replies: { authenticated_user_eligible: eligible },
    },
  }) as ApiWave;
const drop = { id: "drop-1", wave: { id: "wave-1" } } as ApiDrop;

beforeEach(() => {
  mockProfileId = "profile-a";
  mockAddress = "0xaaa";
  mockFetch.mockReset();
});

it("waits for B's permission response instead of reusing A's shared or supplied wave", async () => {
  let finishProfileB: ((value: ApiWave) => void) | undefined;
  mockFetch.mockImplementation(() =>
    mockProfileId === "profile-a"
      ? Promise.resolve(wave(true))
      : new Promise<ApiWave>((resolve) => {
          finishProfileB = resolve;
        })
  );

  const suppliedWave = wave(true);
  const { result, rerender } = renderHook(() => {
    const queryClient = useQueryClient();
    return { ...useDropReplyAccess("wave-1", suppliedWave), queryClient };
  });
  await waitFor(() => expect(result.current.canReply).toBe(true));
  const activateForA = result.current.canReplyToDrop;
  act(() => {
    result.current.queryClient.setQueryData(
      getWaveQueryKey("wave-1"),
      suppliedWave
    );
    mockProfileId = "profile-b";
    mockAddress = "0xbbb";
  });
  rerender();
  expect(result.current.canReply).toBe(false);
  expect(activateForA(drop)).toBe(false);
  expect(result.current.canReplyToDrop(drop)).toBe(false);
  await waitFor(() => expect(finishProfileB).toBeDefined());
  await act(async () => finishProfileB?.(wave(false)));
  await waitFor(() => expect(result.current.canReply).toBe(false));
  expect(result.current.canReplyToDrop(drop)).toBe(false);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
