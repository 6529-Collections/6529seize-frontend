import { act, renderHook } from "@testing-library/react";
import { splitLinks } from "@/components/e2ee/conversation/e2eeLinks";
import { useE2eeDroppedMessage } from "@/components/e2ee/conversation/useE2eeDroppedMessage";
import { getE2eeDayKey, getE2eeDayLabel } from "@/components/e2ee/e2eeFormat";
import type { E2eeMessage } from "@/lib/e2ee/types";

const pending = (id: string, text: string, pendingFlag = true): E2eeMessage =>
  ({
    id,
    g: "0xg",
    seq: pendingFlag ? 0 : 7,
    kind: "message",
    senderProfileId: "me",
    senderDeviceKey: null,
    ts: 1,
    serverTs: 1,
    text,
    mentions: [],
    reply: null,
    attachments: [],
    editedAt: null,
    deleted: false,
    reactions: {},
    sigOk: true,
    undecryptable: false,
    pending: pendingFlag,
  }) as E2eeMessage;

describe("splitLinks", () => {
  it("links http(s) URLs and leaves trailing punctuation as text", () => {
    const parts = splitLinks("See https://6529.io/the-memes/400, then reply.");
    expect(parts).toEqual([
      { kind: "text", start: 0, value: "See " },
      {
        kind: "link",
        start: 4,
        value: "https://6529.io/the-memes/400",
        href: "https://6529.io/the-memes/400",
      },
      { kind: "text", start: 33, value: ", then reply." },
    ]);
  });

  it("keeps other schemes as text and offsets starts", () => {
    expect(splitLinks("javascript:alert(1) ftp://x", 10)).toEqual([
      { kind: "text", start: 10, value: "javascript:alert(1) ftp://x" },
    ]);
  });

  it("returns one text segment for empty text", () => {
    expect(splitLinks("")).toEqual([{ kind: "text", start: 0, value: "" }]);
  });
});

describe("day separators", () => {
  const now = new Date(2026, 9, 31, 12, 0).getTime();

  it("labels today, yesterday, this week and older days", () => {
    expect(
      getE2eeDayLabel("en-US", new Date(2026, 9, 31, 1).getTime(), now)
    ).toBe("Today");
    expect(
      getE2eeDayLabel("en-US", new Date(2026, 9, 30, 23).getTime(), now)
    ).toBe("Yesterday");
    expect(
      getE2eeDayLabel("en-US", new Date(2026, 9, 27, 9).getTime(), now)
    ).toBe("Tuesday");
    expect(
      getE2eeDayLabel("en-US", new Date(2025, 0, 2, 9).getTime(), now)
    ).toBe("Jan 2, 2025");
  });

  it("groups by local calendar day", () => {
    expect(getE2eeDayKey(new Date(2026, 9, 31, 0, 1).getTime())).toBe(
      getE2eeDayKey(new Date(2026, 9, 31, 23, 59).getTime())
    );
  });
});

describe("useE2eeDroppedMessage", () => {
  // The engine keeps a message id from local echo through sequencing
  // (lib/e2ee/engine/send.ts markSent), so only a refused send disappears.
  it("reports a pending message that disappears without being sequenced", () => {
    const { result, rerender } = renderHook(
      ({ messages }) => useE2eeDroppedMessage(messages, "me"),
      { initialProps: { messages: [pending("a", "hello")] } }
    );
    expect(result.current.dropped).toBeNull();
    rerender({ messages: [] });
    expect(result.current.dropped).toEqual({ id: "a", text: "hello" });
    act(() => result.current.dismiss());
    expect(result.current.dropped).toBeNull();
  });

  it("ignores a pending message that is sequenced", () => {
    const { result, rerender } = renderHook(
      ({ messages }) => useE2eeDroppedMessage(messages, "me"),
      { initialProps: { messages: [pending("a", "hello")] } }
    );
    rerender({ messages: [pending("a", "hello", false)] });
    expect(result.current.dropped).toBeNull();
  });
});
