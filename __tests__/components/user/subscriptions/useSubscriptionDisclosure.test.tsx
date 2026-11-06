import { act, fireEvent, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { useSubscriptionDisclosure } from "@/components/user/subscriptions/useSubscriptionDisclosure";

const ID = "profile-subscriptions-settings";
const QUERY = "(max-width: 1023px)";

describe("subscription sheet navigation", () => {
  let mobile: boolean;
  let resizeListeners: Set<() => void>;

  function resize(matches: boolean) {
    act(() => {
      mobile = matches;
      resizeListeners.forEach((listener) => listener());
    });
  }

  function flushFrame() {
    act(() => jest.advanceTimersByTime(20));
  }

  beforeEach(() => {
    jest.useFakeTimers();
    mobile = false;
    resizeListeners = new Set();
    jest.spyOn(window, "matchMedia").mockImplementation((media) => ({
      media,
      get matches() {
        return mobile;
      },
      onchange: null,
      addEventListener: jest.fn((_type, listener: () => void) => {
        resizeListeners.add(listener);
      }),
      removeEventListener: jest.fn((_type, listener: () => void) => {
        resizeListeners.delete(listener);
      }),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(() => true),
    }));
    window.history.replaceState(null, "", `/#${ID}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  function renderSheet() {
    return renderHook(
      () => useSubscriptionDisclosure(ID, true, `${ID}-title`, QUERY),
      { wrapper: StrictMode }
    );
  }

  it("does not reopen an existing desktop hash when the viewport gets smaller", () => {
    const { result, unmount } = renderSheet();
    flushFrame();
    resize(true);
    flushFrame();
    expect(result.current.expanded).toBe(false);
    unmount();
    expect(resizeListeners.size).toBe(0);
  });

  it("opens a direct mobile link but stays closed after resizing out and back", () => {
    mobile = true;
    const { result } = renderSheet();
    flushFrame();
    expect(result.current.expanded).toBe(true);
    resize(false);
    expect(result.current.expanded).toBe(false);
    resize(true);
    flushFrame();
    expect(result.current.expanded).toBe(false);
  });

  it("still opens new hash navigation and repeated same-hash links on mobile", () => {
    const { result } = renderSheet();
    flushFrame();
    resize(true);
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(result.current.expanded).toBe(true);
    act(() => result.current.setExpanded(false));
    const link = document.createElement("a");
    link.href = `#${ID}`;
    document.body.append(link);
    for (let attempt = 0; attempt < 2; attempt++) {
      fireEvent.click(link);
      expect(result.current.expanded).toBe(true);
      act(() => result.current.setExpanded(false));
    }
    link.remove();
  });

  it("preserves deferred top-up links while owner data is loading", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSubscriptionDisclosure(ID, enabled),
      { initialProps: { enabled: false } }
    );
    flushFrame();
    expect(result.current.expanded).toBe(false);
    rerender({ enabled: true });
    flushFrame();
    expect(result.current.expanded).toBe(true);
  });

  it("clears a closed sheet's hash and does not reopen it when effects reconnect", () => {
    mobile = true;
    const { result, rerender } = renderHook(
      ({ focusId }) => useSubscriptionDisclosure(ID, true, focusId, QUERY),
      { initialProps: { focusId: `${ID}-title` }, wrapper: StrictMode }
    );
    flushFrame();
    expect(result.current.expanded).toBe(true);
    act(() => result.current.setExpanded(false));
    expect(window.location.hash).toBe("");

    // Effect reconnects (including development refreshes) are not navigation.
    window.history.replaceState(null, "", `/#${ID}`);
    rerender({ focusId: `${ID}-new-title` });
    flushFrame();
    expect(result.current.expanded).toBe(false);
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(result.current.expanded).toBe(true);
  });
});
