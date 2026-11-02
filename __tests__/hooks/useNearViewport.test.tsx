import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useNearViewport } from "@/hooks/useNearViewport";

const original = globalThis.IntersectionObserver;
afterEach(() => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: original,
  });
});

it("waits for viewport observation, follows visibility and disconnects on unmount", () => {
  const element = document.createElement("div");
  const root = document.createElement("div");
  root.setAttribute("data-e2ee-scroll", "");
  root.append(element);
  const targetRef = { current: element };
  let callback: IntersectionObserverCallback | undefined;
  const observe = jest.fn();
  const disconnect = jest.fn();
  const observer = { observe, disconnect } as unknown as IntersectionObserver;
  const constructor = jest.fn((notify: IntersectionObserverCallback) => {
    callback = notify;
    return observer;
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: constructor,
  });
  const { result, unmount } = renderHook(() =>
    useNearViewport(targetRef, "400px 0px")
  );
  expect(result.current).toBe(false);
  expect(constructor).toHaveBeenCalledWith(expect.any(Function), {
    root,
    rootMargin: "400px 0px",
  });
  expect(observe).toHaveBeenCalledWith(element);
  act(() =>
    callback?.(
      [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
      observer
    )
  );
  expect(result.current).toBe(true);
  act(() =>
    callback?.(
      [{ isIntersecting: false, target: element } as IntersectionObserverEntry],
      observer
    )
  );
  expect(result.current).toBe(false);
  unmount();
  expect(disconnect).toHaveBeenCalledTimes(1);
});

it("uses the supplied scroll root", () => {
  const element = document.createElement("div");
  const root = document.createElement("div");
  const targetRef = { current: element };
  const rootRef = { current: root };
  const constructor = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  }));
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: constructor,
  });
  const { unmount } = renderHook(() =>
    useNearViewport(targetRef, "600px 0px", rootRef)
  );
  expect(constructor).toHaveBeenCalledWith(expect.any(Function), {
    root,
    rootMargin: "600px 0px",
  });
  unmount();
});

it("keeps server rendering deferred and supports clients without IntersectionObserver", () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  const targetRef = { current: document.createElement("div") };
  const { result, unmount } = renderHook(() =>
    useNearViewport(targetRef, "400px 0px")
  );
  expect(result.current).toBe(true);
  unmount();
  function ServerProbe() {
    const near = useNearViewport(targetRef, "400px 0px");
    return createElement("span", { "data-visible": String(near) });
  }
  expect(renderToString(createElement(ServerProbe))).toContain(
    'data-visible="false"'
  );
});
