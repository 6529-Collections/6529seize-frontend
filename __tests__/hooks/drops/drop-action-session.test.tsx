import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContext, type ReactNode } from "react";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useCanShowDropCurationsAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import { useSetWavePinnedDrop } from "@/hooks/waves/useSetWavePinnedDrop";
import * as api from "@/services/api/common-api";

let mockAuthenticated = true;
let mockDirect = true;
let mockFetching = false;
const mockOptimisticUpdate = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "viewer", handle: "viewer" },
    isAuthenticated: mockAuthenticated,
    isDirectProfileSession: mockDirect,
    fetchingProfile: mockFetching,
    activeProfileProxy: null,
    setToast: jest.fn(),
  }),
}));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/hooks/useProfileWave", () => ({
  useProfileWave: () => ({ data: null }),
}));
jest.mock("@/hooks/drops/useDropCurations", () => ({
  ...jest.requireActual("@/hooks/drops/useDropCurations"),
  useDropCurations: () => ({
    data: [
      {
        id: "curation",
        name: "Saved",
        authenticated_user_can_curate: true,
        drop_included: false,
      },
    ],
  }),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActionsOptional: () => ({
    applyOptimisticDropUpdate: mockOptimisticUpdate,
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
  commonApiDeleteWithBody: jest.fn(),
}));

const drop = {
  id: "drop",
  wave: { id: "wave" },
  context_profile_context: { boosted: false },
} as ExtendedDrop;
function Wrapper({ children }: { children: ReactNode }) {
  const queryContext = useContext(ReactQueryWrapperContext);
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <ReactQueryWrapperContext.Provider
        value={{ ...queryContext, invalidateDrops: jest.fn() }}
      >
        {children}
      </ReactQueryWrapperContext.Provider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockDirect = true;
  mockFetching = false;
});

it.each(["signed out", "proxy role", "loading profile"])(
  "blocks all boost, pin and curation entry points when %s",
  async (state) => {
    mockAuthenticated = state !== "signed out";
    mockDirect = state !== "proxy role";
    mockFetching = state === "loading profile";
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(
        new Error("Network writes are prohibited in this test.")
      );
    try {
      const { result } = renderHook(
        () => ({
          boost: useDropBoostMutation(),
          pin: useSetWavePinnedDrop("wave"),
          curation: useDropCurationMembershipMutation({
            dropId: "drop",
            waveId: "wave",
          }),
          availability: useCanShowDropCurationsAction({
            dropId: "drop",
            waveId: "wave",
            profileIdentity: "viewer",
            isTemporaryDrop: false,
            isWaveAdmin: true,
          }),
        }),
        { wrapper: Wrapper }
      );
      expect(result.current.availability).toEqual({
        showManageCurations: false,
        quickAddCuration: null,
        quickRemoveCuration: null,
      });
      act(() => {
        result.current.boost.boostDrop(drop);
        result.current.boost.unboostDrop(drop);
        result.current.boost.toggleBoost(drop);
        result.current.curation.updateMembership("curation", "add");
      });
      await act(async () => {
        await expect(
          result.current.pin.setPinnedDrop({ dropId: "drop" })
        ).rejects.toThrow("Sign in as your own profile");
        await expect(
          result.current.curation.updateMembershipAsync("curation", "add")
        ).rejects.toThrow("Sign in as your own profile");
        await expect(
          result.current.curation.updateMembershipAsync("curation", "remove")
        ).rejects.toThrow("Sign in as your own profile");
      });
      expect(mockOptimisticUpdate).not.toHaveBeenCalled();
      expect(api.commonApiPost).not.toHaveBeenCalled();
      expect(api.commonApiDelete).not.toHaveBeenCalled();
      expect(api.commonApiDeleteWithBody).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  }
);

it.each(["sign-out", "unmount"])(
  "blocks a previously captured pin callback after %s",
  async (transition) => {
    const { result, rerender, unmount } = renderHook(
      () => useSetWavePinnedDrop("wave"),
      { wrapper: Wrapper }
    );
    const pendingPin = result.current.setPinnedDrop;
    if (transition === "unmount") unmount();
    else {
      mockAuthenticated = false;
      rerender();
    }
    await expect(pendingPin({ dropId: "drop" })).rejects.toThrow(
      "Sign in as your own profile"
    );
    expect(api.commonApiPost).not.toHaveBeenCalled();
  }
);

it("retains existing curation permissions for a valid own-profile session", () => {
  const { result } = renderHook(
    () =>
      useCanShowDropCurationsAction({
        dropId: "drop",
        waveId: "wave",
        profileIdentity: "viewer",
        isTemporaryDrop: false,
        isWaveAdmin: false,
      }),
    { wrapper: Wrapper }
  );
  expect(result.current.showManageCurations).toBe(true);
  expect(result.current.quickAddCuration?.id).toBe("curation");
});

it("finishes an authorized curation removal after its optimistic UI unmounts", async () => {
  jest.mocked(api.commonApiDeleteWithBody).mockResolvedValue(undefined);
  const { result, unmount } = renderHook(
    () => useDropCurationMembershipMutation({ dropId: "drop", waveId: "wave" }),
    { wrapper: Wrapper }
  );
  let removal = Promise.resolve();
  act(() => {
    removal = result.current.updateMembershipAsync("curation", "remove");
  });
  unmount();
  await act(async () => {
    await removal;
  });
  expect(api.commonApiDeleteWithBody).toHaveBeenCalledWith({
    endpoint: "drops/drop/curations",
    body: { curation_id: "curation" },
  });
});
