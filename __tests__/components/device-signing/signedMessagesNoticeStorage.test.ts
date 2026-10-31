import {
  dismissSignedMessagesNotice,
  markDeviceGrantsSeen,
  useSignedMessagesNoticeState,
} from "@/components/device-signing/signedMessagesNoticeStorage";
import { act, renderHook } from "@testing-library/react";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const STORAGE_KEY = "6529-signed-messages-notice";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

const failWrites = () =>
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  });

describe("signed messages notice storage", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("persists dismissals and seen grants per wallet", () => {
    const { result } = renderHook(() => useSignedMessagesNoticeState(ADDRESS));

    act(() => dismissSignedMessagesNotice(ADDRESS, 1_000));
    act(() => markDeviceGrantsSeen(ADDRESS, ["grant-1"]));

    expect(result.current).toEqual({
      dismissedUntil: 1_000 + DISMISS_MS,
      seenGrantIds: ["grant-1"],
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      [ADDRESS]: {
        dismissedUntil: 1_000 + DISMISS_MS,
        seenGrantIds: ["grant-1"],
      },
    });
  });

  it("keeps this page's state when only writes fail, then reads storage again", () => {
    const writes = failWrites();
    const { result } = renderHook(() => useSignedMessagesNoticeState(ADDRESS));

    // Reads still work, but the write is lost: the page must use its own copy
    // or the dismissal and the seen alert would have no visible effect.
    act(() => dismissSignedMessagesNotice(ADDRESS, 2_000));
    act(() => markDeviceGrantsSeen(ADDRESS, ["grant-2"]));

    expect(writes).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current).toEqual({
      dismissedUntil: 2_000 + DISMISS_MS,
      seenGrantIds: ["grant-2"],
    });

    writes.mockRestore();
    act(() => markDeviceGrantsSeen(ADDRESS, ["grant-3"]));

    expect(result.current.seenGrantIds).toEqual(["grant-2", "grant-3"]);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")[ADDRESS]
    ).toEqual({
      dismissedUntil: 2_000 + DISMISS_MS,
      seenGrantIds: ["grant-2", "grant-3"],
    });

    // Once writes succeed again, another tab's change is picked up.
    act(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [ADDRESS]: { seenGrantIds: ["grant-4"] } })
      );
      globalThis.dispatchEvent(new Event("storage"));
    });
    expect(result.current).toEqual({ seenGrantIds: ["grant-4"] });
  });
});
