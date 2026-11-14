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

  it("keeps its cursor during a pending send and notices incoming messages behind it", () => {
    const baseline = collect(null, [
      chat("g1", 5, { lastIncomingSeq: 5 }),
    ]).marks;
    const pending = { ...message(0, ME), pending: true };
    const waiting = collect(baseline, [
      chat("g1", 0, {
        lastMessage: pending,
        lastIncomingSeq: 5,
      }),
    ]);
    expect(waiting.marks.get("g1")).toBe(5);
    expect(waiting.notices).toEqual([]);

    const incoming = collect(waiting.marks, [
      chat("g1", 0, {
        lastMessage: pending,
        lastIncomingSeq: 6,
      }),
    ]);
    expect(incoming.notices).toEqual([{ g: "g1", seq: 6 }]);
    const sent = collect(incoming.marks, [
      chat("g1", 7, {
        lastMessage: message(7, ME),
        lastIncomingSeq: 6,
      }),
    ]);
    expect(sent.notices).toEqual([]);
    expect(sent.marks.get("g1")).toBe(6);
  });

  it("notices an incoming message even when an own send is published in the same batch", () => {
    const baseline = collect(null, [
      chat("g1", 5, { lastIncomingSeq: 5 }),
    ]).marks;
    expect(
      collect(baseline, [
        chat("g1", 7, {
          lastMessage: message(7, ME),
          lastIncomingSeq: 6,
        }),
      ]).notices
    ).toEqual([{ g: "g1", seq: 6 }]);
  });

  it("never notifies about imported history", () => {
    const baseline = collect(null, [chat("g1", 5)]).marks;
    const imported = {
      ...message(6, "profile-other"),
      imported: { waveId: "old-wave" },
    } as E2eeMessage;
    expect(
      collect(baseline, [chat("g1", 6, { lastMessage: imported })]).notices
    ).toEqual([]);
    expect(
      collect(baseline, [
        chat("g1", 6, {
          lastMessage: imported,
          lastIncomingSeq: 5,
        }),
      ]).notices
    ).toEqual([]);
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

  it("gives every message a stable id that never equals a server notification id", () => {
    const id = e2eeNoticeId({ g: "g1", seq: 6 });
    expect(id).toBe(e2eeNoticeId({ g: "g1", seq: 6 }));
    expect(Number.isSafeInteger(id) && id < 0).toBe(true);
    const ids = new Set<number>();
    for (let chatIndex = 0; chatIndex < 200; chatIndex += 1) {
      for (let seq = 1; seq <= 50; seq += 1) {
        ids.add(e2eeNoticeId({ g: `0x${chatIndex.toString(16)}`, seq }));
      }
    }
    expect(ids.size).toBe(200 * 50);
  });

  it("forgets chats that are no longer listed", () => {
    const baseline = collect(null, [chat("g1", 5), chat("g2", 5)]).marks;
    expect([...collect(baseline, [chat("g1", 5)]).marks.keys()]).toEqual([
      "g1",
    ]);
  });

  describe("the desktop bridge", () => {
    const userAgent = navigator.userAgent;
    const setUserAgent = (value: string) =>
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value,
      });
    const setGlobal = (key: string, value: unknown) =>
      Object.defineProperty(globalThis, key, { configurable: true, value });
    const installDesktopShell = () => {
      setGlobal("api", { openExternal: jest.fn() });
      setGlobal("nativeAuth", { sessionLogin: jest.fn() });
    };

    afterEach(() => {
      setUserAgent(userAgent);
      for (const key of ["notifications", "api", "nativeAuth"]) {
        Reflect.deleteProperty(globalThis, key);
      }
    });

    it("is used only in 6529 Desktop", () => {
      const bridge = { showNotification: jest.fn(), setBadge: jest.fn() };
      setGlobal("notifications", bridge);
      expect(getDesktopNotificationsBridge()).toBeNull();
      installDesktopShell();
      expect(getDesktopNotificationsBridge()).toBe(bridge);
    });

    // Every desktop build defines the shell bridge; a user agent alone (for
    // example a browser extension spoofing "Electron") is not enough.
    it("is not used for an Electron user agent without the desktop bridge", () => {
      setGlobal("notifications", { showNotification: jest.fn() });
      setUserAgent(`${userAgent} Electron/44.0.0`);
      expect(getDesktopNotificationsBridge()).toBeNull();
    });

    it("is absent when the desktop app exposes no notifications", () => {
      installDesktopShell();
      expect(getDesktopNotificationsBridge()).toBeNull();
      setGlobal("notifications", { setBadge: jest.fn() });
      expect(getDesktopNotificationsBridge()).toBeNull();
    });
  });
});
