import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useMemesSubmissionIdentity } from "@/components/waves/memes/submission/hooks/useMemesSubmissionIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/components/auth/Auth");
jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/hooks/useWave");
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockConnect = useSeizeConnectContext as jest.MockedFunction<
  typeof useSeizeConnectContext
>;
const mockUseWave = useWave as jest.MockedFunction<typeof useWave>;
const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const eligibleWave = {
  id: "wave-1",
  participation: {
    authenticated_user_eligible: true,
    no_of_applications_allowed_per_participant: 2,
    period: { min: null, max: null },
  },
  metrics: { your_participation_drops_count: 0 },
} as ApiWave;

const ineligibleWave = {
  ...eligibleWave,
  participation: {
    ...eligibleWave.participation,
    authenticated_user_eligible: false,
  },
} as ApiWave;

const alice = {
  id: "profile-a",
  handle: "alice",
  consolidation_key: "alice-key",
} as any;
const bob = {
  id: "profile-b",
  handle: "bob",
  consolidation_key: "bob-key",
} as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useMemesSubmissionIdentity", () => {
  let authState: any;
  let connectState: any;

  beforeEach(() => {
    authState = {
      connectedProfile: alice,
      fetchingProfile: false,
      isAuthenticated: true,
      requestAuth: jest.fn(async () => ({ success: true })),
      setToast: jest.fn(),
    };
    connectState = {
      address: "0xaaa",
      walletName: "MetaMask",
      canSignActiveWallet: true,
      seizeConnectFresh: jest.fn(async () => undefined),
      seizeConnectOpen: false,
      connectionState: "connected",
    };
    mockAuth.mockImplementation(() => authState);
    mockConnect.mockImplementation(() => connectState);
    mockUseWave.mockImplementation(
      (wave) =>
        ({
          participation: {
            isEligible:
              wave?.participation.authenticated_user_eligible ?? false,
            hasReachedLimit: false,
            status: SubmissionStatus.ACTIVE,
            canSubmitNow:
              wave?.participation.authenticated_user_eligible ?? false,
          },
        }) as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requires an explicit wallet connection without starting submission", async () => {
    connectState = {
      ...connectState,
      address: undefined,
      canSignActiveWallet: false,
      connectionState: "disconnected",
    };
    const { result } = renderHook(
      () => useMemesSubmissionIdentity(eligibleWave),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe("disconnected");
    expect(result.current.profile).toBe(alice);
    expect(result.current.profileStatus).toBe("eligible");
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      await result.current.connectWallet();
    });
    expect(connectState.seizeConnectFresh).toHaveBeenCalledTimes(1);
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });

  it("uses the current eligible profile immediately when it has not changed", () => {
    const { result } = renderHook(
      () => useMemesSubmissionIdentity(eligibleWave),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe("eligible");
    expect(result.current.profile?.handle).toBe("alice");
    expect(result.current.address).toBe("0xaaa");
    expect(result.current.canSubmit).toBe(true);
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });

  it("keeps the active authenticated profile when another wallet cannot sign for it", () => {
    connectState = { ...connectState, canSignActiveWallet: false };
    const { result } = renderHook(
      () => useMemesSubmissionIdentity(eligibleWave),
      { wrapper: createWrapper() }
    );

    expect(result.current.profile).toBe(alice);
    expect(result.current.profileStatus).toBe("eligible");
    expect(result.current.address).toBeNull();
    expect(result.current.status).toBe("disconnected");
    expect(result.current.canSubmit).toBe(false);
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });

  it("rechecks eligibility and blocks an ineligible replacement profile", async () => {
    let resolveEligibility: ((wave: ApiWave) => void) | undefined;
    mockCommonApiFetch.mockImplementation(
      async () =>
        await new Promise<ApiWave>((resolve) => {
          resolveEligibility = resolve;
        })
    );
    const { result, rerender } = renderHook(
      () => useMemesSubmissionIdentity(eligibleWave),
      { wrapper: createWrapper() }
    );
    expect(result.current.status).toBe("eligible");

    authState = { ...authState, connectedProfile: bob };
    connectState = { ...connectState, address: "0xbbb" };
    rerender();

    await waitFor(() => {
      expect(result.current.status).toBe("checking-eligibility");
    });
    expect(result.current.profile?.handle).toBe("bob");
    expect(result.current.profileStatus).toBe("checking-eligibility");
    expect(result.current.canSubmit).toBe(false);
    expect(mockUseWave).not.toHaveBeenCalledWith(undefined);

    await act(async () => {
      resolveEligibility?.(ineligibleWave);
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ineligible");
    });
    expect(result.current.canSubmit).toBe(false);
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "waves/wave-1",
    });
  });

  it("allows a replacement profile only after its fresh eligibility succeeds", async () => {
    mockCommonApiFetch.mockResolvedValue(eligibleWave);
    const { result, rerender } = renderHook(
      () => useMemesSubmissionIdentity(eligibleWave),
      { wrapper: createWrapper() }
    );

    authState = { ...authState, connectedProfile: bob };
    connectState = { ...connectState, address: "0xbbb" };
    rerender();

    await waitFor(() => {
      expect(result.current.status).toBe("eligible");
    });
    expect(result.current.profile?.handle).toBe("bob");
    expect(result.current.canSubmit).toBe(true);
    expect(mockCommonApiFetch).toHaveBeenCalledTimes(1);
  });
});
