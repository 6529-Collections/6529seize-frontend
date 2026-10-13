import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ContextType, ReactNode } from "react";
import { AuthContext, type AuthContextType } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import { useWaveJoin } from "@/hooks/waves/useWaveJoin";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDeleteWithBody: jest.fn(),
}));

const mockedPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;
const mockedDelete = commonApiDeleteWithBody as jest.MockedFunction<
  typeof commonApiDeleteWithBody
>;

const requestAuth = jest.fn();
const setToast = jest.fn();
const onWaveFollowChange = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const auth = { requestAuth, setToast } as unknown as AuthContextType;
  const reactQuery = { onWaveFollowChange } as unknown as ContextType<
    typeof ReactQueryWrapperContext
  >;

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <ReactQueryWrapperContext.Provider value={reactQuery}>
            {children}
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
};

const notJoinedWave = { id: "wave-1", subscribed_actions: [] };
const joinedWave = {
  id: "wave-1",
  subscribed_actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
};

describe("useWaveJoin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requestAuth.mockResolvedValue({ success: true });
    mockedPost.mockResolvedValue({
      actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
    });
    mockedDelete.mockResolvedValue({ actions: [] });
  });

  it("joins through the shared subscription endpoint and cache helper", async () => {
    const { result } = renderHook(() => useWaveJoin(notJoinedWave), {
      wrapper: createWrapper(),
    });
    expect(result.current.isJoined).toBe(false);

    let joined = false;
    await act(async () => {
      joined = await result.current.join();
    });

    expect(joined).toBe(true);
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith({
      endpoint: "waves/wave-1/subscriptions",
      body: { actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS },
    });
    expect(onWaveFollowChange).toHaveBeenCalledWith({
      waveId: "wave-1",
      following: true,
    });
    expect(result.current.isPending).toBe(false);
  });

  it("also subscribes to every drop when requested", async () => {
    const { result } = renderHook(
      () => useWaveJoin(notJoinedWave, { subscribeToAllDrops: true }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.join();
    });

    expect(mockedPost).toHaveBeenLastCalledWith({
      endpoint: "notifications/wave-subscription/wave-1",
      body: {},
    });
  });

  it("keeps the join when the all-messages subscription fails", async () => {
    mockedPost
      .mockResolvedValueOnce({ actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS })
      .mockRejectedValueOnce(new Error("notifications down"));
    const { result } = renderHook(
      () => useWaveJoin(notJoinedWave, { subscribeToAllDrops: true }),
      { wrapper: createWrapper() }
    );

    let joined = false;
    await act(async () => {
      joined = await result.current.join();
    });

    expect(joined).toBe(true);
    expect(onWaveFollowChange).toHaveBeenCalledWith({
      waveId: "wave-1",
      following: true,
    });
    expect(setToast).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title:
          "Joined, but notifications for every message couldn't be turned on.",
        description:
          "Turn them on from the bell menu in the wave's About panel.",
      })
    );
  });

  it("leaves with the same actions and reports the change", async () => {
    const { result } = renderHook(() => useWaveJoin(joinedWave), {
      wrapper: createWrapper(),
    });
    expect(result.current.isJoined).toBe(true);

    let left = false;
    await act(async () => {
      left = await result.current.toggle();
    });

    expect(left).toBe(true);
    expect(mockedDelete).toHaveBeenCalledWith({
      endpoint: "waves/wave-1/subscriptions",
      body: { actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS },
    });
    expect(onWaveFollowChange).toHaveBeenCalledWith({
      waveId: "wave-1",
      following: false,
    });
  });

  it("does nothing when the session check is cancelled", async () => {
    requestAuth.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useWaveJoin(notJoinedWave), {
      wrapper: createWrapper(),
    });

    let joined = true;
    await act(async () => {
      joined = await result.current.join();
    });

    expect(joined).toBe(false);
    expect(mockedPost).not.toHaveBeenCalled();
    expect(onWaveFollowChange).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  it("explains a failed join and keeps the previous state", async () => {
    mockedPost.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useWaveJoin(notJoinedWave), {
      wrapper: createWrapper(),
    });

    let joined = true;
    await act(async () => {
      joined = await result.current.join();
    });

    expect(joined).toBe(false);
    expect(onWaveFollowChange).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't join this wave.",
        description: "Please try again.",
      })
    );
    expect(result.current.isPending).toBe(false);
  });

  it("explains a failed leave", async () => {
    mockedDelete.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useWaveJoin(joinedWave), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.leave();
    });

    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Couldn't leave this wave." })
    );
  });

  it("ignores a second request while one is in flight", async () => {
    let resolveAuth: (value: { success: boolean }) => void = () => {};
    requestAuth.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        resolveAuth = resolve;
      })
    );
    const { result } = renderHook(() => useWaveJoin(notJoinedWave), {
      wrapper: createWrapper(),
    });

    let first: Promise<boolean> = Promise.resolve(false);
    let second = true;
    await act(async () => {
      first = result.current.join();
      second = await result.current.join();
    });
    expect(second).toBe(false);
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveAuth({ success: true });
      await first;
    });

    expect(await first).toBe(true);
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });
});
