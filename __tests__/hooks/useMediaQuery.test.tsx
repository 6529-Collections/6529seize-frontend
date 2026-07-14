import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const QUERY = "(max-width: 1023px)";

type MediaQueryListMockOptions = {
  readonly matches: boolean;
  readonly modernListeners?: boolean;
  readonly previousOnChange?: MediaQueryList["onchange"];
};

const createMediaQueryListMock = ({
  matches,
  modernListeners = true,
  previousOnChange = null,
}: MediaQueryListMockOptions) => {
  let currentMatches = matches;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const addEventListener = jest.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === "change") {
        listeners.add(listener);
      }
    }
  );
  const removeEventListener = jest.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === "change") {
        listeners.delete(listener);
      }
    }
  );

  const mediaQueryList = {
    get matches() {
      return currentMatches;
    },
    media: QUERY,
    onchange: previousOnChange,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(() => true),
    ...(modernListeners ? { addEventListener, removeEventListener } : {}),
  } as unknown as MediaQueryList;

  const emitChange = (nextMatches: boolean) => {
    currentMatches = nextMatches;
    const event = Object.assign(new Event("change"), {
      matches: nextMatches,
      media: QUERY,
    }) as MediaQueryListEvent;

    listeners.forEach((listener) => {
      if (typeof listener === "function") {
        listener.call(mediaQueryList, event);
      } else {
        listener.handleEvent(event);
      }
    });
    mediaQueryList.onchange?.call(mediaQueryList, event);
  };

  return {
    addEventListener,
    emitChange,
    getListenerCount: () => listeners.size,
    mediaQueryList,
    removeEventListener,
  };
};

const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.window,
  "matchMedia"
);

const installMatchMedia = (mediaQueryList: MediaQueryList) => {
  const matchMedia = jest.fn(() => mediaQueryList);
  Object.defineProperty(globalThis.window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return matchMedia;
};

describe("useMediaQuery", () => {
  afterEach(() => {
    if (originalMatchMediaDescriptor !== undefined) {
      Object.defineProperty(
        globalThis.window,
        "matchMedia",
        originalMatchMediaDescriptor
      );
    }
  });

  it.each([false, true])(
    "returns the initial browser snapshot when matches is %s",
    (matches) => {
      const mediaQuery = createMediaQueryListMock({ matches });
      const matchMedia = installMatchMedia(mediaQuery.mediaQueryList);

      const { result } = renderHook(() => useMediaQuery(QUERY));

      expect(result.current).toBe(matches);
      expect(matchMedia).toHaveBeenCalledWith(QUERY);
    }
  );

  it("uses false as the server and hydration snapshot", () => {
    const mediaQuery = createMediaQueryListMock({ matches: true });
    installMatchMedia(mediaQuery.mediaQueryList);

    const Probe = () => <span>{String(useMediaQuery(QUERY))}</span>;

    expect(renderToString(<Probe />)).toContain("<span>false</span>");
    expect(mediaQuery.addEventListener).not.toHaveBeenCalled();

    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(true);
  });

  it("updates when the media query snapshot changes", () => {
    const mediaQuery = createMediaQueryListMock({ matches: false });
    installMatchMedia(mediaQuery.mediaQueryList);
    const { result } = renderHook(() => useMediaQuery(QUERY));

    act(() => mediaQuery.emitChange(true));
    expect(result.current).toBe(true);

    act(() => mediaQuery.emitChange(false));
    expect(result.current).toBe(false);
  });

  it("does not re-render for repeated synchronous same-value notifications", () => {
    const mediaQuery = createMediaQueryListMock({ matches: false });
    installMatchMedia(mediaQuery.mediaQueryList);
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useMediaQuery(QUERY);
    });
    const initialRenderCount = renderCount;

    act(() => {
      mediaQuery.emitChange(false);
      mediaQuery.emitChange(false);
    });
    expect(renderCount).toBe(initialRenderCount);

    act(() => {
      mediaQuery.emitChange(true);
      mediaQuery.emitChange(true);
    });
    expect(result.current).toBe(true);
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  it("removes the modern change listener during cleanup", () => {
    const mediaQuery = createMediaQueryListMock({ matches: false });
    installMatchMedia(mediaQuery.mediaQueryList);
    const { unmount } = renderHook(() => useMediaQuery(QUERY));
    const listener = mediaQuery.addEventListener.mock.calls[0]?.[1];

    expect(mediaQuery.getListenerCount()).toBe(1);
    unmount();

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      listener
    );
    expect(mediaQuery.getListenerCount()).toBe(0);
  });

  it("updates multiple consumers of the same query", () => {
    const mediaQuery = createMediaQueryListMock({ matches: false });
    installMatchMedia(mediaQuery.mediaQueryList);
    const { result, unmount } = renderHook(
      () => [useMediaQuery(QUERY), useMediaQuery(QUERY)] as const
    );

    expect(mediaQuery.addEventListener).toHaveBeenCalledTimes(2);

    act(() => mediaQuery.emitChange(true));
    expect(result.current).toEqual([true, true]);

    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it("shares and restores the legacy onchange fallback", () => {
    const previousOnChange: NonNullable<MediaQueryList["onchange"]> = jest.fn();
    const mediaQuery = createMediaQueryListMock({
      matches: false,
      modernListeners: false,
      previousOnChange,
    });
    installMatchMedia(mediaQuery.mediaQueryList);
    const { result, unmount } = renderHook(
      () => [useMediaQuery(QUERY), useMediaQuery(QUERY)] as const
    );

    expect(mediaQuery.mediaQueryList.onchange).not.toBe(previousOnChange);

    act(() => mediaQuery.emitChange(true));
    expect(previousOnChange).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual([true, true]);

    unmount();
    expect(mediaQuery.mediaQueryList.onchange).toBe(previousOnChange);
  });
});
