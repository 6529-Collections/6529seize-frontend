import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";
import {
  blockProfile,
  fetchBlockedProfiles,
  unblockProfile,
} from "@/services/api/content-moderation-api";
import {
  resetContentModerationStateForTests,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSetToast = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    activeProfileProxy: null,
    connectedProfile: { id: "viewer-1" },
    setToast: mockSetToast,
  }),
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  blockProfile: jest.fn(),
  fetchBlockedProfiles: jest.fn(),
  unblockProfile: jest.fn(),
}));

const blockedProfile = {
  profile_id: "author-1",
  handle: "alice",
  pfp: null,
  blocked_at: 1,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useProfileBlockState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetContentModerationStateForTests();
    jest.mocked(fetchBlockedProfiles).mockResolvedValue([blockedProfile]);
    jest.mocked(blockProfile).mockResolvedValue(undefined);
    jest.mocked(unblockProfile).mockResolvedValue(undefined);
  });

  it("loads the viewer's block state and unblocks optimistically", async () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    const { result } = renderHook(
      () =>
        useProfileBlockState({
          profileId: "author-1",
          profileHandle: "alice",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isBlocked).toBe(true));

    await act(async () => {
      await result.current.unblock();
    });

    await waitFor(() => expect(result.current.isBlocked).toBe(false));
    expect(unblockProfile).toHaveBeenCalledWith("author-1");
  });

  it("blocks optimistically and exposes the profile in the shared state", async () => {
    jest.mocked(fetchBlockedProfiles).mockResolvedValue([]);
    const { result } = renderHook(
      () =>
        useProfileBlockState({
          profileId: "author-1",
          profileHandle: "alice",
          profilePfp: "ipfs://alice",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isBlocked).toBe(false));

    await act(async () => {
      await result.current.block();
    });

    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    expect(blockProfile).toHaveBeenCalledWith("author-1");
  });
});
