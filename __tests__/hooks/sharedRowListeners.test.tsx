/**
 * A chat list mounts many rows, and every row calls the touch/hover/Capacitor
 * hooks. These tests mount real hooks in many rows and pin that the whole app
 * shares one set of capability media query listeners and one Capacitor
 * listener, that updates still reach every row, and that cleanup is complete.
 */
import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

jest.mock("@capacitor/core", () => ({
  registerPlugin: jest.fn(),
  WebPlugin: class {},
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    getState: jest.fn(),
    addListener: jest.fn(),
  },
}));

const { Capacitor } = require("@capacitor/core");
const { App } = require("@capacitor/app");

const ROW_COUNT = 25;

const CAPABILITY_QUERIES = [
  "(any-pointer: fine)",
  "(pointer: fine)",
  "(any-hover: hover)",
  "(hover: hover)",
  "(any-pointer: coarse)",
];
const PORTRAIT_QUERY = "(orientation: portrait)";

interface FakeMediaQueryList {
  readonly media: string;
  readonly matches: boolean;
  readonly changeListeners: Set<EventListener>;
  addCalls: number;
  removeCalls: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

let queryMatches: Record<string, boolean> = {};
let mediaQueryLists: FakeMediaQueryList[] = [];

const installMatchMedia = () => {
  queryMatches = { [PORTRAIT_QUERY]: true };
  mediaQueryLists = [];
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => {
      const list: FakeMediaQueryList = {
        media: query,
        get matches() {
          return queryMatches[query] ?? false;
        },
        changeListeners: new Set<EventListener>(),
        addCalls: 0,
        removeCalls: 0,
        addEventListener(_type, listener) {
          list.addCalls += 1;
          list.changeListeners.add(listener);
        },
        removeEventListener(_type, listener) {
          list.removeCalls += 1;
          list.changeListeners.delete(listener);
        },
      };
      mediaQueryLists.push(list);
      return list;
    }),
  });
};

const activeListenerCount = (query: string): number =>
  mediaQueryLists
    .filter((list) => list.media === query)
    .reduce((total, list) => total + list.changeListeners.size, 0);

const totalAdds = (): number =>
  mediaQueryLists.reduce((total, list) => total + list.addCalls, 0);

const totalRemoves = (): number =>
  mediaQueryLists.reduce((total, list) => total + list.removeCalls, 0);

/** Flips a media query and dispatches `change` to its listeners. */
const flipQuery = (query: string, matches: boolean) => {
  queryMatches[query] = matches;
  act(() => {
    for (const list of mediaQueryLists) {
      if (list.media !== query) {
        continue;
      }
      for (const listener of [...list.changeListeners]) {
        listener(new Event("change"));
      }
    }
  });
};

function Row() {
  const isTouchDevice = useIsTouchDevice();
  const { canUseDesktopHoverActions } = useDropActionInteractionMode();
  const { hasTouchScreen } = useDeviceInfo();
  const { isCapacitor, isActive, orientation } = useCapacitor();

  return (
    <li
      data-testid="row"
      data-touch={String(isTouchDevice)}
      data-hover-actions={String(canUseDesktopHoverActions)}
      data-touch-screen={String(hasTouchScreen)}
      data-capacitor={String(isCapacitor)}
      data-active={String(isActive)}
      data-orientation={String(orientation)}
    />
  );
}

const rows = (count: number) => (
  <ul>
    {Array.from({ length: count }, (_, position) => `row-${position}`).map(
      (id) => (
        <Row key={id} />
      )
    )}
  </ul>
);

const rowAttributes = (
  container: HTMLElement,
  attribute: string
): Set<string | null> =>
  new Set(
    Array.from(container.querySelectorAll("li")).map((row) =>
      row.getAttribute(attribute)
    )
  );

const flushPromises = () =>
  act(async () => {
    await Promise.resolve();
  });

describe("shared row listeners", () => {
  const originalMatchMedia = globalThis.matchMedia;
  let originalMaxTouchPoints: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMaxTouchPoints = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      "maxTouchPoints"
    );
    Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
    installMatchMedia();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue("web");
    (App.getState as jest.Mock).mockReset();
    (App.addListener as jest.Mock).mockReset();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
    if (originalMaxTouchPoints) {
      Object.defineProperty(
        globalThis.navigator,
        "maxTouchPoints",
        originalMaxTouchPoints
      );
    } else {
      Reflect.deleteProperty(globalThis.navigator, "maxTouchPoints");
    }
    jest.restoreAllMocks();
  });

  describe("capability media queries", () => {
    it("registers one listener per capability query however many rows mount", () => {
      render(rows(ROW_COUNT));

      for (const query of CAPABILITY_QUERIES) {
        expect(activeListenerCount(query)).toBe(1);
      }
      expect(totalAdds()).toBe(CAPABILITY_QUERIES.length);
      expect(
        mediaQueryLists
          .filter((list) => list.changeListeners.size > 0)
          .map((list) => list.media)
          .sort()
      ).toEqual([...CAPABILITY_QUERIES].sort());
    });

    it("propagates a capability change to every row", () => {
      const { container } = render(rows(ROW_COUNT));
      expect(rowAttributes(container, "data-touch")).toEqual(new Set(["true"]));
      expect(rowAttributes(container, "data-touch-screen")).toEqual(
        new Set(["true"])
      );
      expect(rowAttributes(container, "data-hover-actions")).toEqual(
        new Set(["false"])
      );

      flipQuery("(any-hover: hover)", true);

      expect(container.querySelectorAll("li")).toHaveLength(ROW_COUNT);
      expect(rowAttributes(container, "data-touch")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-touch-screen")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-hover-actions")).toEqual(
        new Set(["true"])
      );
    });

    it("reuses the existing listeners for rows mounted later", () => {
      render(rows(1));
      const addsAfterFirstRow = totalAdds();

      const { container } = render(rows(ROW_COUNT));

      expect(totalAdds()).toBe(addsAfterFirstRow);
      for (const query of CAPABILITY_QUERIES) {
        expect(activeListenerCount(query)).toBe(1);
      }
      expect(rowAttributes(container, "data-touch")).toEqual(new Set(["true"]));
    });

    it("removes the shared listeners only when the last row unmounts", () => {
      const { rerender, unmount } = render(rows(ROW_COUNT));

      rerender(rows(1));
      expect(totalRemoves()).toBe(0);
      for (const query of CAPABILITY_QUERIES) {
        expect(activeListenerCount(query)).toBe(1);
      }

      unmount();
      for (const query of CAPABILITY_QUERIES) {
        expect(activeListenerCount(query)).toBe(0);
      }
      expect(totalRemoves()).toBe(totalAdds());
    });
  });

  describe("native shell", () => {
    let appStateCallback: ((state: { isActive: boolean }) => void) | undefined;
    let removeAppStateHandle: jest.Mock;
    let addWindowListener: jest.SpyInstance;
    let removeWindowListener: jest.SpyInstance;

    const orientationCalls = (spy: jest.SpyInstance) =>
      spy.mock.calls.filter(([type]) => type === "orientationchange");

    beforeEach(() => {
      appStateCallback = undefined;
      removeAppStateHandle = jest.fn();
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue("ios");
      (App.getState as jest.Mock).mockResolvedValue({ isActive: false });
      (App.addListener as jest.Mock).mockImplementation(
        (_event: string, callback: (state: { isActive: boolean }) => void) => {
          appStateCallback = callback;
          return Promise.resolve({ remove: removeAppStateHandle });
        }
      );
      addWindowListener = jest.spyOn(window, "addEventListener");
      removeWindowListener = jest.spyOn(window, "removeEventListener");
    });

    afterEach(() => {
      // The shared store keeps its last known state between tests; the
      // rendered rows are still mounted here, so they can receive the reset.
      act(() => appStateCallback?.({ isActive: false }));
    });

    it("reads app state and registers its listeners once for all rows", async () => {
      render(rows(ROW_COUNT));
      await flushPromises();

      expect(App.getState).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledWith(
        "appStateChange",
        expect.any(Function)
      );
      expect(orientationCalls(addWindowListener)).toHaveLength(1);
    });

    it("looks up the orientation a constant number of times however many rows mount", async () => {
      render(rows(ROW_COUNT));
      await flushPromises();

      // One coalesced read for the initial renders plus one when subscribing.
      expect(
        jest
          .mocked(globalThis.matchMedia)
          .mock.calls.filter(([query]) => query === PORTRAIT_QUERY).length
      ).toBeLessThanOrEqual(2);
    });

    it("propagates app state and orientation changes to every row", async () => {
      const { container } = render(rows(ROW_COUNT));
      await flushPromises();
      expect(rowAttributes(container, "data-capacitor")).toEqual(
        new Set(["true"])
      );
      expect(rowAttributes(container, "data-active")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-orientation")).toEqual(
        new Set(["0"])
      );

      act(() => appStateCallback?.({ isActive: true }));
      expect(rowAttributes(container, "data-active")).toEqual(
        new Set(["true"])
      );

      queryMatches[PORTRAIT_QUERY] = false;
      act(() => {
        window.dispatchEvent(new Event("orientationchange"));
      });
      expect(rowAttributes(container, "data-orientation")).toEqual(
        new Set(["1"])
      );
    });

    it("gives rows mounted later the current state without new native calls", async () => {
      render(rows(1));
      await flushPromises();
      act(() => appStateCallback?.({ isActive: true }));

      const { container } = render(rows(ROW_COUNT));

      expect(rowAttributes(container, "data-active")).toEqual(
        new Set(["true"])
      );
      await flushPromises();
      expect(App.getState).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(orientationCalls(addWindowListener)).toHaveLength(1);
    });

    it("removes the native listeners when the last row unmounts", async () => {
      const { rerender, unmount } = render(rows(ROW_COUNT));
      await flushPromises();

      rerender(rows(1));
      await flushPromises();
      expect(removeAppStateHandle).not.toHaveBeenCalled();
      expect(orientationCalls(removeWindowListener)).toHaveLength(0);

      unmount();
      await flushPromises();
      expect(removeAppStateHandle).toHaveBeenCalledTimes(1);
      expect(orientationCalls(removeWindowListener)).toHaveLength(1);

      // A later mount starts a new session that re-reads the real state.
      render(rows(1));
      await flushPromises();
      expect(App.getState).toHaveBeenCalledTimes(2);
      expect(App.addListener).toHaveBeenCalledTimes(2);
    });

    describe("row churn", () => {
      let seenActive: boolean[];

      function Probe() {
        const { isActive } = useCapacitor();
        seenActive.push(isActive);
        return null;
      }

      beforeEach(() => {
        seenActive = [];
        (App.getState as jest.Mock).mockResolvedValue({ isActive: true });
      });

      it("keeps the native session and never flashes inactive when the last row is replaced in the same commit", async () => {
        const { rerender } = render(<Probe key="first" />);
        await flushPromises();
        expect(seenActive.at(-1)).toBe(true);
        seenActive = [];

        // Unmounts the only subscriber and mounts a new one in one commit.
        rerender(<Probe key="second" />);
        await flushPromises();

        expect(seenActive.length).toBeGreaterThan(0);
        expect(seenActive).not.toContain(false);
        expect(App.getState).toHaveBeenCalledTimes(1);
        expect(App.addListener).toHaveBeenCalledTimes(1);
        expect(removeAppStateHandle).not.toHaveBeenCalled();
        expect(orientationCalls(addWindowListener)).toHaveLength(1);
        expect(orientationCalls(removeWindowListener)).toHaveLength(0);
      });

      it("never flashes inactive when a row mounts right after the last one left", async () => {
        const { unmount } = render(<Probe />);
        await flushPromises();
        expect(seenActive.at(-1)).toBe(true);
        unmount();
        await flushPromises();
        seenActive = [];

        render(<Probe />);
        await flushPromises();

        expect(seenActive.length).toBeGreaterThan(0);
        expect(seenActive).not.toContain(false);
      });
    });
  });

  describe("outside a native shell", () => {
    it("makes no Capacitor calls and adds no orientation listener", async () => {
      const addWindowListener = jest.spyOn(window, "addEventListener");

      const { container } = render(rows(ROW_COUNT));
      await flushPromises();

      expect(App.getState).not.toHaveBeenCalled();
      expect(App.addListener).not.toHaveBeenCalled();
      expect(
        addWindowListener.mock.calls.filter(
          ([type]) => type === "orientationchange"
        )
      ).toHaveLength(0);
      expect(rowAttributes(container, "data-capacitor")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-orientation")).toEqual(
        new Set(["0"])
      );
    });
  });

  describe("server rendering and hydration", () => {
    it("renders web defaults on the server and hydrates without mismatches", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue("ios");
      (App.getState as jest.Mock).mockResolvedValue({ isActive: true });
      let appStateCallback:
        | ((state: { isActive: boolean }) => void)
        | undefined;
      (App.addListener as jest.Mock).mockImplementation(
        (_event: string, callback: (state: { isActive: boolean }) => void) => {
          appStateCallback = callback;
          return Promise.resolve({ remove: jest.fn() });
        }
      );
      queryMatches[PORTRAIT_QUERY] = false;
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const onRecoverableError = jest.fn();

      const container = document.createElement("div");
      container.innerHTML = renderToString(rows(2));
      expect(rowAttributes(container, "data-touch")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-capacitor")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-active")).toEqual(
        new Set(["false"])
      );
      expect(rowAttributes(container, "data-orientation")).toEqual(
        new Set(["0"])
      );

      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, rows(2), { onRecoverableError });
        });
        await flushPromises();

        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
        expect(rowAttributes(container, "data-capacitor")).toEqual(
          new Set(["true"])
        );
        expect(rowAttributes(container, "data-active")).toEqual(
          new Set(["true"])
        );
        expect(rowAttributes(container, "data-orientation")).toEqual(
          new Set(["1"])
        );
      } finally {
        // Leave the shared store inactive for any test that runs after this.
        act(() => appStateCallback?.({ isActive: false }));
        act(() => root?.unmount());
      }
    });
  });
});
