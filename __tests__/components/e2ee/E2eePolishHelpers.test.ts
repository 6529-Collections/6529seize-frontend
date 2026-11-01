import { act, renderHook } from "@testing-library/react";
import { splitLinks } from "@/components/e2ee/conversation/e2eeLinks";
import { useE2eeDroppedMessage } from "@/components/e2ee/conversation/useE2eeDroppedMessage";
import { getE2eeDeviceLabel } from "@/components/e2ee/e2eeDeviceLabel";
import { getE2eeDayKey, getE2eeDayLabel } from "@/components/e2ee/e2eeFormat";
import { t } from "@/i18n/messages";
import type { E2eeMessage } from "@/lib/e2ee/types";
import { NEW_DEVICE_NOTICE } from "../../../tests/support/e2ee/e2eeCopy";

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

describe("splitLinks parentheses", () => {
  it("keeps a balanced closing parenthesis inside the URL", () => {
    const parts = splitLinks(
      "Read https://en.wikipedia.org/wiki/Foo_(bar) first."
    );
    expect(parts[1]).toEqual({
      kind: "link",
      start: 5,
      value: "https://en.wikipedia.org/wiki/Foo_(bar)",
      href: "https://en.wikipedia.org/wiki/Foo_(bar)",
    });
    expect(parts[2]).toEqual({ kind: "text", start: 44, value: " first." });
  });

  it("drops an unbalanced closing parenthesis around a URL", () => {
    const parts = splitLinks("(see https://6529.io/about)");
    expect(parts[1]).toMatchObject({
      kind: "link",
      value: "https://6529.io/about",
    });
    expect(parts[2]).toEqual({ kind: "text", start: 26, value: ")" });
  });
});

describe("getE2eeDeviceLabel", () => {
  const chromeWindows =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  const safariIphone =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const firefoxMac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:131.0) Gecko/20100101 Firefox/131.0";

  it("names browser and OS family from the user agent", () => {
    expect(getE2eeDeviceLabel("web", { userAgent: chromeWindows })).toBe(
      "Chrome on Windows"
    );
    expect(getE2eeDeviceLabel("web", { userAgent: safariIphone })).toBe(
      "Safari on iPhone"
    );
    expect(getE2eeDeviceLabel("web", { userAgent: firefoxMac })).toBe(
      "Firefox on Mac"
    );
  });

  it("prefers client hints and specific brands", () => {
    expect(
      getE2eeDeviceLabel("web", {
        userAgent: chromeWindows,
        userAgentData: {
          brands: [
            { brand: "Chromium" },
            { brand: "Not?A_Brand" },
            { brand: "Microsoft Edge" },
          ],
          platform: "macOS",
        },
      })
    ).toBe("Edge on Mac");
  });

  it("names the 6529 apps and falls back to Browser", () => {
    expect(
      getE2eeDeviceLabel("phone", {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile",
      })
    ).toBe("6529 app on Android");
    expect(getE2eeDeviceLabel("web", { userAgent: "curl/8.0" })).toBe(
      "Browser"
    );
    expect(getE2eeDeviceLabel("web", {})).toBe("Browser");
  });
});

describe("shared copy patterns", () => {
  it("matches the rendered new-device notice", () => {
    expect(
      t("en-US", "e2ee.devices.newDevice", {
        date: "Oct 31, 2026, 12:49 PM",
        label: "Chrome on Windows",
        platform: "Browser",
      })
    ).toMatch(NEW_DEVICE_NOTICE);
  });
});
