import { renderHook, waitFor } from "@testing-library/react";
import {
  pickWakeChat,
  useOpenWakeChat,
} from "@/components/e2ee/list/useOpenWakeChat";
import type { E2eeConversation } from "@/lib/e2ee/types";

const mockReplace = jest.fn();
let mockSearch = "wake=1";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

let mockConversations: E2eeConversation[] = [];
const mockSync = jest.fn(async () => undefined);
let mockStatus = "ready";
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => ({
    status: mockStatus,
    profileId: "profile-1",
    engine: {
      sync: mockSync,
      getConversations: () => mockConversations,
    },
  }),
}));

let mockMuted: ReadonlySet<string> = new Set();
jest.mock("@/components/e2ee/e2eeMutedChats", () => ({
  useMutedE2eeChats: () => mockMuted,
}));

const chat = (g: string, unread: number): E2eeConversation =>
  ({ g, unread, status: "active" }) as E2eeConversation;

describe("opening the chat a push woke", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = "wake=1";
    mockStatus = "ready";
    mockMuted = new Set();
    mockConversations = [];
    globalThis.history.replaceState(null, "", "/messages/encrypted?wake=1");
  });

  it("picks the only chat with new messages", () => {
    expect(pickWakeChat([chat("a", 0), chat("b", 2)], new Set())).toBe("b");
  });

  it("picks none when several chats or only muted or left chats have new messages", () => {
    expect(pickWakeChat([chat("a", 1), chat("b", 2)], new Set())).toBeNull();
    expect(pickWakeChat([chat("a", 1)], new Set(["a"]))).toBeNull();
    expect(
      pickWakeChat(
        [{ ...chat("a", 1), status: "left" } as E2eeConversation],
        new Set()
      )
    ).toBeNull();
    expect(pickWakeChat([], new Set())).toBeNull();
  });

  it("opens that chat after syncing", async () => {
    mockConversations = [chat("g1", 0), chat("g2", 1)];
    renderHook(() => useOpenWakeChat());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted/g2")
    );
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("stays on the list, without the wake mark, when it cannot tell which chat", async () => {
    mockConversations = [chat("g1", 1), chat("g2", 1)];
    renderHook(() => useOpenWakeChat());
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted")
    );
  });

  it("does nothing for an ordinary visit or before the device is ready", async () => {
    mockSearch = "";
    const { rerender } = renderHook(() => useOpenWakeChat());
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
    renderHook(() => useOpenWakeChat());
    globalThis.history.replaceState(null, "", "/waves");
    finishSync();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
