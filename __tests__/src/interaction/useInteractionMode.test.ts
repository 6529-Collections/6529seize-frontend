import { act, renderHook } from "@testing-library/react";
import useInteractionMode, {
  deriveInteractionMode,
  type InteractionModeState,
} from "@/src/interaction/useInteractionMode";

const DEFAULT_STATE: InteractionModeState = {
  canHover: false,
  hasFinePointer: false,
  hasCoarsePointer: false,
  hoverNone: false,
  lastPointerType: null,
};

type ChangeListener = (event: MediaQueryListEvent) => void;

function createPointerEvent(pointerType: string): Event {
  const event = new Event("pointerdown");
  Object.defineProperty(event, "pointerType", { value: pointerType });
  return event;
}

function installMatchMedia(initialMatches: Record<string, boolean>) {
  const matches = new Map(Object.entries(initialMatches));
  const listeners = new Map<string, Set<ChangeListener>>();
  const mediaQueries: Array<
    MediaQueryList & {
      addEventListener: jest.Mock;
      removeEventListener: jest.Mock;
    }
  > = [];

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn((query: string) => {
      const queryListeners = listeners.get(query) ?? new Set<ChangeListener>();
      listeners.set(query, queryListeners);

      const mediaQuery = {
        media: query,
        get matches() {
          return matches.get(query) ?? false;
        },
        addEventListener: jest.fn((event: string, listener: ChangeListener) => {
          if (event === "change") {
            queryListeners.add(listener);
          }
        }),
        removeEventListener: jest.fn(
          (event: string, listener: ChangeListener) => {
            if (event === "change") {
              queryListeners.delete(listener);
            }
          }
        ),
      } as unknown as MediaQueryList & {
        addEventListener: jest.Mock;
        removeEventListener: jest.Mock;
      };

      mediaQueries.push(mediaQuery);
      return mediaQuery;
    }),
  });

  const setMatches = (query: string, value: boolean) => {
    matches.set(query, value);
    const event = { matches: value, media: query } as MediaQueryListEvent;
    listeners.get(query)?.forEach((listener) => listener(event));
  };

  return { mediaQueries, setMatches };
}

describe("deriveInteractionMode", () => {
  it("keeps hover UI and long-press activation independent on hybrid devices", () => {
    expect(
      deriveInteractionMode({
        ...DEFAULT_STATE,
        canHover: true,
        hasFinePointer: true,
      })
    ).toMatchObject({
      enableHoverUI: true,
      enableLongPress: false,
    });

    expect(
      deriveInteractionMode({
        ...DEFAULT_STATE,
        canHover: true,
        hasFinePointer: true,
        lastPointerType: "touch",
      })
    ).toMatchObject({
      enableHoverUI: true,
      enableLongPress: true,
    });
  });

  it("enables touch activation when the primary input cannot hover", () => {
    expect(
      deriveInteractionMode({
        ...DEFAULT_STATE,
        hoverNone: true,
        hasCoarsePointer: true,
      })
    ).toMatchObject({
      enableHoverUI: false,
      enableLongPress: true,
      hasCoarsePointer: true,
    });
  });
});

describe("useInteractionMode", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates derivations from media query and pointer events", () => {
    const { setMatches } = installMatchMedia({
      "(any-hover: hover)": true,
      "(any-pointer: fine)": true,
      "(pointer: coarse)": false,
      "(hover: none)": false,
    });

    const { result, unmount } = renderHook(() => useInteractionMode());

    expect(result.current.enableHoverUI).toBe(true);
    expect(result.current.enableLongPress).toBe(false);

    act(() => {
      window.dispatchEvent(createPointerEvent("touch"));
    });

    expect(result.current.lastPointerType).toBe("touch");
    expect(result.current.enableHoverUI).toBe(true);
    expect(result.current.enableLongPress).toBe(true);

    act(() => {
      window.dispatchEvent(createPointerEvent("mouse"));
    });

    expect(result.current.lastPointerType).toBe("mouse");
    expect(result.current.enableLongPress).toBe(false);

    act(() => {
      setMatches("(hover: none)", true);
      setMatches("(pointer: coarse)", true);
    });

    expect(result.current.hoverNone).toBe(true);
    expect(result.current.hasCoarsePointer).toBe(true);
    expect(result.current.enableLongPress).toBe(true);

    unmount();
  });

  it("tears down and re-initializes after the last subscriber unmounts", () => {
    const firstMedia = installMatchMedia({
      "(any-hover: hover)": true,
      "(any-pointer: fine)": true,
      "(pointer: coarse)": false,
      "(hover: none)": false,
    });

    const first = renderHook(() => useInteractionMode());
    expect(first.result.current.enableHoverUI).toBe(true);

    first.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
      expect.any(Object)
    );
    expect(
      firstMedia.mediaQueries.filter(
        (query) => query.removeEventListener.mock.calls.length > 0
      )
    ).toHaveLength(4);

    const secondMedia = installMatchMedia({
      "(any-hover: hover)": false,
      "(any-pointer: fine)": false,
      "(pointer: coarse)": true,
      "(hover: none)": true,
    });

    const second = renderHook(() => useInteractionMode());

    expect(second.result.current.enableHoverUI).toBe(false);
    expect(second.result.current.enableLongPress).toBe(true);
    expect(second.result.current.hasCoarsePointer).toBe(true);
    expect(secondMedia.mediaQueries).toHaveLength(8);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
      expect.any(Object)
    );

    second.unmount();
  });
});
