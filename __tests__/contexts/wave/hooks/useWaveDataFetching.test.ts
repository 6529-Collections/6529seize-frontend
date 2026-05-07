import { renderHook, act } from "@testing-library/react";
import { useWaveDataFetching } from "@/contexts/wave/hooks/useWaveDataFetching";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

const mockQueryClient = {
  getQueriesData: jest.fn(),
  setQueriesData: jest.fn(),
};

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

let mockConnectedProfile: {
  id?: string | null;
  primary_wallet?: string;
} | null = { id: "profile-1" };

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfile,
  }),
}));

const mockReconcileServerDropsForDisplay = jest.fn(
  ({ serverDrops }: { serverDrops: any[] }) => serverDrops
);

jest.mock(
  "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops",
  () => ({
    reconcileServerDropsForDisplay: (params: any) =>
      mockReconcileServerDropsForDisplay(params),
  })
);

const getLoadingState = jest.fn(() => ({
  state: { isLoading: false, promise: null },
  shouldContinue: true,
}));
const setLoadingState = jest.fn();
const setPromise = jest.fn();
const clearLoadingState = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveLoadingState", () => ({
  useWaveLoadingState: () => ({
    getLoadingState,
    setLoadingState,
    setPromise,
    clearLoadingState,
  }),
}));

const cancelFetch = jest.fn();
const createController = jest.fn(() => ({ signal: {} }) as AbortController);
const cleanupController = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveAbortController", () => ({
  useWaveAbortController: () => ({
    cancelFetch,
    createController,
    cleanupController,
  }),
}));

export const fetchWaveMessages = jest.fn();
export const formatWaveMessages = jest.fn();
export const createEmptyWaveMessages = jest.fn();
export const fetchNewestWaveMessages = jest.fn();

jest.mock("@/contexts/wave/utils/wave-messages-utils", () => ({
  fetchWaveMessages: (...args: any[]) => fetchWaveMessages(...args),
  formatWaveMessages: (...args: any[]) => formatWaveMessages(...args),
  createEmptyWaveMessages: (...args: any[]) => createEmptyWaveMessages(...args),
  fetchNewestWaveMessages: (...args: any[]) => fetchNewestWaveMessages(...args),
}));

describe("useWaveDataFetching", () => {
  beforeEach(() => {
    mockConnectedProfile = { id: "profile-1" };
    mockReconcileServerDropsForDisplay.mockImplementation(
      ({ serverDrops }: { serverDrops: any[] }) => serverDrops
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setup(initial: Record<string, any>) {
    const store = { ...initial };
    const updateData = jest.fn((u: any) => {
      store[u.key] = { ...store[u.key], ...u };
    });
    const getData = jest.fn((key: string) => store[key]);
    const { result } = renderHook(() =>
      useWaveDataFetching({ updateData, getData })
    );
    return { result, updateData, getData, store };
  }

  it("fetches wave data and updates store", async () => {
    fetchWaveMessages.mockResolvedValue([{ id: "d1", serial_no: 1 }]);
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [{ id: "d1" }] });
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(setLoadingState).toHaveBeenCalledWith("wave1", true);
    expect(createController).toHaveBeenCalledWith("wave1");
    expect(fetchWaveMessages).toHaveBeenCalledWith(
      "wave1",
      null,
      expect.any(Object),
      expect.any(Function)
    );
    expect(updateData).toHaveBeenNthCalledWith(1, { key: "wave1", drops: [] });
    expect(updateData).toHaveBeenLastCalledWith({
      key: "wave1",
      drops: [{ id: "d1" }],
    });
  });

  it("reconciles initial fetches before formatting wave messages", async () => {
    mockConnectedProfile = { id: null, primary_wallet: "wallet-1" };
    const serverDrop = {
      id: "d1",
      serial_no: 1,
      context_profile_context: { reaction: ":wave:" },
      reactions: [],
    };
    const displayDrop = {
      ...serverDrop,
      context_profile_context: { reaction: ":joy:" },
    };
    fetchWaveMessages.mockResolvedValue([serverDrop]);
    mockReconcileServerDropsForDisplay.mockReturnValueOnce([displayDrop]);
    formatWaveMessages.mockImplementation((waveId: string, drops: any[]) => ({
      key: waveId,
      drops,
    }));
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(mockReconcileServerDropsForDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        requestProfileId: "wallet-1",
        currentProfileId: "wallet-1",
        queryClient: mockQueryClient,
        serverDrops: [serverDrop],
        websocketStatus: WebSocketStatus.CONNECTED,
      })
    );
    expect(formatWaveMessages).toHaveBeenLastCalledWith(
      "wave1",
      [displayDrop],
      {
        isLoading: false,
      }
    );
    expect(updateData).toHaveBeenLastCalledWith({
      key: "wave1",
      drops: [displayDrop],
    });
  });

  it("ignores abort errors", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    fetchWaveMessages.mockRejectedValue(abortError);
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(updateData).toHaveBeenCalledTimes(1); // only initial empty state
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("syncNewestMessages updates data and returns result", async () => {
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [{ id: "d", serial_no: 11 }],
      highestSerialNo: 11,
    });
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [{ id: "d" }] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );
    expect(fetchNewestWaveMessages).toHaveBeenCalledWith(
      "wave1",
      10,
      50,
      expect.any(Object),
      expect.any(Function)
    );
    expect(updateData).toHaveBeenCalledWith({
      key: "wave1",
      drops: [{ id: "d" }],
    });
    expect(res).toEqual({
      drops: [{ id: "d", serial_no: 11 }],
      highestSerialNo: 11,
    });
  });

  it("syncNewestMessages reconciles before updating when no callback is passed", async () => {
    mockConnectedProfile = { id: null, primary_wallet: "wallet-1" };
    const latestWaveDrop = {
      id: "d",
      serial_no: 10,
      type: "FULL",
      stableKey: "d",
      stableHash: "d",
      context_profile_context: { reaction: ":joy:" },
      reactions: [{ reaction: ":joy:", profiles: [{ id: "wallet-1" }] }],
    };
    const serverDrop = {
      id: "d",
      serial_no: 11,
      context_profile_context: { reaction: ":wave:" },
      reactions: [],
    };
    const displayDrop = {
      ...serverDrop,
      context_profile_context: { reaction: ":joy:" },
    };
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [serverDrop],
      highestSerialNo: 11,
    });
    mockReconcileServerDropsForDisplay.mockReturnValueOnce([displayDrop]);
    formatWaveMessages.mockImplementation((waveId: string, drops: any[]) => ({
      key: waveId,
      drops,
    }));
    const { result, updateData } = setup({
      wave1: { drops: [latestWaveDrop] },
    });

    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );

    expect(mockReconcileServerDropsForDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        requestProfileId: "wallet-1",
        currentProfileId: "wallet-1",
        queryClient: mockQueryClient,
        serverDrops: [serverDrop],
        latestWaveDrops: [latestWaveDrop],
        websocketStatus: WebSocketStatus.CONNECTED,
      })
    );
    expect(formatWaveMessages).toHaveBeenCalledWith("wave1", [displayDrop]);
    expect(updateData).toHaveBeenCalledWith({
      key: "wave1",
      drops: [displayDrop],
    });
    expect(res).toEqual({ drops: [displayDrop], highestSerialNo: 11 });
  });

  it("syncNewestMessages reconciles drops before updating data", async () => {
    const serverDrop = {
      id: "d",
      serial_no: 11,
      context_profile_context: { reaction: ":wave:" },
      reactions: [],
    };
    const displayDrop = {
      ...serverDrop,
      context_profile_context: { reaction: ":joy:" },
    };
    const reconcileDrops = jest.fn(() => [displayDrop]);
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [serverDrop],
      highestSerialNo: 11,
    });
    formatWaveMessages.mockImplementation((waveId: string, drops: any[]) => ({
      key: waveId,
      drops,
    }));
    const { result, updateData } = setup({ wave1: { drops: [] } });

    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal,
      reconcileDrops
    );

    expect(reconcileDrops).toHaveBeenCalledWith([serverDrop]);
    expect(mockReconcileServerDropsForDisplay).not.toHaveBeenCalled();
    expect(formatWaveMessages).toHaveBeenCalledWith("wave1", [displayDrop]);
    expect(updateData).toHaveBeenCalledWith({
      key: "wave1",
      drops: [displayDrop],
    });
    expect(res).toEqual({ drops: [displayDrop], highestSerialNo: 11 });
  });

  it("syncNewestMessages handles error", async () => {
    fetchNewestWaveMessages.mockResolvedValue({
      drops: null,
      highestSerialNo: null,
    });
    const { result, updateData } = setup({ wave1: { drops: [] } });
    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );
    expect(updateData).not.toHaveBeenCalled();
    expect(res).toEqual({ drops: null, highestSerialNo: null });
  });
});
