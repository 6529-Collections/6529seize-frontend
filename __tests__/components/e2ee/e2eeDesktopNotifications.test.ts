import {
  collectE2eeDesktopNotices,
  e2eeNoticeId,
  getDesktopNotificationsBridge,
} from "@/components/e2ee/e2eeDesktopNotifications";
import type { E2eeConversation, E2eeMessage } from "@/lib/e2ee/types";

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}));

const ME = "profile-me";

const message = (seq: number, sender: string): E2eeMessage =>
  ({
    id: `m${seq}`,
    seq,
    kind: "message",
    senderProfileId: sender,
    pending: false,
  }) as E2eeMessage;

const chat = (
  g: string,
  seq: number,
  overrides: Partial<E2eeConversation> = {}
): E2eeConversation =>
  ({
    g,
    status: "active",
    unread: 1,
    lastMessage: message(seq, "profile-other"),
    ...overrides,
  }) as E2eeConversation;

const collect = (
  marks: ReadonlyMap<string, number> | null,
  conversations: E2eeConversation[],
  options: { muted?: string[]; focusedChat?: string | null } = {}
) =>
  collectE2eeDesktopNotices({
    marks,
    conversations,
    ownProfileId: ME,
    muted: new Set(options.muted ?? []),
    focusedChat: options.focusedChat ?? null,
  });

describe("encrypted-message desktop notices", () => {
  it("takes a baseline without notifying about what the device already had", () => {
    const { notices, marks } = collect(null, [chat("g1", 5), chat("g2", 3)]);
    expect(notices).toEqual([]);
    expect([...marks]).toEqual([
      ["g1", 5],
      ["g2", 3],
    ]);
  });

  it("notifies once per new message from someone else", () => {
    const baseline = collect(null, [chat("g1", 5)]).marks;
    const first = collect(baseline, [chat("g1", 6)]);
    expect(first.notices).toEqual([{ g: "g1", seq: 6 }]);
    expect(collect(first.marks, [chat("g1", 6)]).notices).toEqual([]);
  });

  it("notifies about a chat this device just joined", () => {
    const baseline = collect(null, [chat("g1", 5)]).marks;
    expect(collect(baseline, [chat("g1", 5), chat("g9", 1)]).notices).toEqual([
      { g: "g9", seq: 1 },
    ]);
  });

  it.each([
    ["the user's own message", { lastMessage: message(6, ME) }],
    ["a read chat", { unread: 0 }],
    ["a chat the user left", { status: "left" as const }],
    [
      "a pending message",
      { lastMessage: { ...message(6, "x"), pending: true } },
    ],
  ])("stays quiet for %s", (_name, overrides) => {
    const baseline = collect(null, [chat("g1", 5)]).marks;
    expect(collect(baseline, [chat("g1", 6, overrides)]).notices).toEqual([]);
  });

  it("stays quiet for a muted chat and for the chat open in the focused window", () => {
    const baseline = collect(null, [chat("g1", 5), chat("g2", 5)]).marks;
    const result = collect(baseline, [chat("g1", 6), chat("g2", 6)], {
      muted: ["g1"],
      focusedChat: "g2",
    });
    expect(result.notices).toEqual([]);
    // Marked as seen, so they do not notify later either.
    expect(result.marks.get("g1")).toBe(6);
    expect(result.marks.get("g2")).toBe(6);
  });

  it("gives every message a stable positive id", () => {
    const id = e2eeNoticeId({ g: "g1", seq: 6 });
    expect(id).toBe(e2eeNoticeId({ g: "g1", seq: 6 }));
    expect(id).not.toBe(e2eeNoticeId({ g: "g1", seq: 7 }));
    expect(Number.isInteger(id) && id > 0 && id <= 0x7fffffff).toBe(true);
  });

  describe("the desktop bridge", () => {
    const userAgent = navigator.userAgent;
    const setUserAgent = (value: string) =>
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value,
      });

    afterEach(() => {
      setUserAgent(userAgent);
      delete (globalThis as { notifications?: unknown }).notifications;
    });

    it("is used only in 6529 Desktop", () => {
      const bridge = { showNotification: jest.fn() };
      (globalThis as { notifications?: unknown }).notifications = bridge;
      expect(getDesktopNotificationsBridge()).toBeNull();
      setUserAgent(`${userAgent} Electron/44.0.0`);
      expect(getDesktopNotificationsBridge()).toBe(bridge);
    });

    it("is absent when the desktop app exposes no notifications", () => {
      setUserAgent(`${userAgent} Electron/44.0.0`);
      expect(getDesktopNotificationsBridge()).toBeNull();
    });
  });
});
