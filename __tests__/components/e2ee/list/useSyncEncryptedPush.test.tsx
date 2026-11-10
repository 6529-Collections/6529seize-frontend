import { act, renderHook, waitFor } from "@testing-library/react";
import { useSyncEncryptedPush } from "@/components/e2ee/list/useSyncEncryptedPush";
import type { E2eeConversation } from "@/lib/e2ee/types";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
let mockSearch = "wake=1";
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

let mockConversations: E2eeConversation[] = [];
const mockSync = jest.fn(async () => undefined);
let mockStatus = "ready";
const mockEngine = {
  sync: mockSync,
  getConversations: () => mockConversations,
};
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => ({
    status: mockStatus,
    engine: mockEngine,
  }),
}));

const chat = (g: string, unread: number): E2eeConversation =>
  ({ g, unread, status: "active" }) as E2eeConversation;

describe("refreshing the encrypted list after a push", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = "wake=1";
    mockStatus = "ready";
    mockConversations = [];
    globalThis.history.replaceState(null, "", "/messages/encrypted?wake=1");
  });

  it("stays on the list even when only one chat is unread", async () => {
    mockConversations = [chat("g1", 0), chat("g2", 1)];
    renderHook(() => useSyncEncryptedPush());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted")
    );
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("clears the wake marker when several chats are unread", async () => {
    mockConversations = [chat("g1", 1), chat("g2", 1)];
    renderHook(() => useSyncEncryptedPush());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted")
    );
  });

  it("handles another push after clearing the first wake query", async () => {
    mockConversations = [chat("g1", 1), chat("g2", 1)];
    const { rerender } = renderHook(() => useSyncEncryptedPush());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted")
    );

    mockSearch = "";
    rerender();
    mockSearch = "wake=1";
    mockConversations = [chat("g1", 0), chat("g2", 1)];
    rerender();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
    expect(mockReplace).toHaveBeenLastCalledWith("/messages/encrypted");
    expect(mockSync).toHaveBeenCalledTimes(2);
  });

  it("does nothing for an ordinary visit or before the device is ready", async () => {
    mockSearch = "";
    const { rerender } = renderHook(() => useSyncEncryptedPush());
    mockSearch = "wake=1";
    mockStatus = "needs-enrollment";
    rerender();
    await Promise.resolve();
    expect(mockSync).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("leaves a user who already moved on alone", async () => {
    mockConversations = [chat("g2", 1)];
    let finishSync: () => void = () => undefined;
    mockSync.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          finishSync = () => resolve(undefined);
        })
    );
    renderHook(() => useSyncEncryptedPush());
    globalThis.history.replaceState(null, "", "/waves");
    finishSync();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it.each(["clearing the wake query", "unmounting"])(
    "cancels pending navigation after %s",
    async (action) => {
      mockConversations = [chat("g2", 1)];
      let finishSync: () => void = () => undefined;
      mockSync.mockImplementationOnce(
        () =>
          new Promise<undefined>((resolve) => {
            finishSync = () => resolve(undefined);
          })
      );
      const { rerender, unmount } = renderHook(() => useSyncEncryptedPush());
      if (action === "unmounting") {
        unmount();
      } else {
        mockSearch = "";
        rerender();
      }
      await act(async () => finishSync());
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  it("clears the wake marker and stays on the list when syncing fails", async () => {
    mockConversations = [chat("g2", 1)];
    mockSync.mockRejectedValueOnce(new Error("offline"));
    renderHook(() => useSyncEncryptedPush());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted")
    );
  });
});
