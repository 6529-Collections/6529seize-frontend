import { observeWaveFeatures } from "@/services/analytics/waveFeatureVisibility";

jest.mock("@/services/analytics/mixpanel", () => ({
  getAnalyticsGeneration: () => 1,
  isAnalyticsTrackingAllowed: () => true,
  trackAnalyticsEvent: jest.fn(),
}));

const originalIntersection = Object.getOwnPropertyDescriptor(
  globalThis,
  "IntersectionObserver"
);
const originalFrame = Object.getOwnPropertyDescriptor(
  window,
  "requestAnimationFrame"
);
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  document.body.replaceChildren();
  if (originalIntersection)
    Object.defineProperty(
      globalThis,
      "IntersectionObserver",
      originalIntersection
    );
  else Reflect.deleteProperty(globalThis, "IntersectionObserver");
  if (originalFrame)
    Object.defineProperty(window, "requestAnimationFrame", originalFrame);
  else Reflect.deleteProperty(window, "requestAnimationFrame");
});

it("disconnects partially initialized observers when a browser API fails", () => {
  const disconnect = jest.fn();
  jest.spyOn(globalThis, "MutationObserver").mockImplementation(
    () =>
      ({
        observe: jest.fn(),
        disconnect,
      }) as unknown as MutationObserver
  );
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: jest.fn(() => {
      throw new Error("Observer unavailable");
    }),
  });
  const root = document.createElement("div");
  document.body.appendChild(root);
  const cleanup = observeWaveFeatures({
    root,
    placement: "sidebar",
    getContext: () => null,
  });
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(() => cleanup()).not.toThrow();
});

it("contains measurement callback failures while product clicks still run", () => {
  jest.useFakeTimers();
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() })),
  });
  const root = document.createElement("div");
  const button = document.createElement("button");
  button.dataset["waveFeature"] = "sidebar_collection";
  button.dataset["waveFeatureValue"] = "pinned";
  root.appendChild(button);
  document.body.appendChild(root);
  const action = jest.fn();
  button.addEventListener("click", action);
  const cleanup = observeWaveFeatures({
    root,
    placement: "sidebar",
    getContext: () => {
      throw new Error("Measurement unavailable");
    },
  });
  expect(() => jest.advanceTimersByTime(20)).not.toThrow();
  expect(() => button.click()).not.toThrow();
  expect(action).toHaveBeenCalledTimes(1);
  expect(() => window.dispatchEvent(new Event("resize"))).not.toThrow();
  cleanup();
});

it("coalesces relevant scrolls per frame and ignores an unrelated feed", () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() })),
  });
  const frames: FrameRequestCallback[] = [];
  const requestFrame = jest.fn((measure: FrameRequestCallback) => {
    frames.push(measure);
    return 1;
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: requestFrame,
  });
  const root = document.createElement("div");
  const unrelatedFeed = document.createElement("div");
  document.body.append(root, unrelatedFeed);
  const getContext = jest.fn(() => null);
  const cleanup = observeWaveFeatures({
    root,
    placement: "sidebar",
    getContext,
  });
  frames[0]?.(0);
  expect(getContext).toHaveBeenCalledTimes(1);
  requestFrame.mockClear();
  unrelatedFeed.dispatchEvent(new Event("scroll"));
  expect(requestFrame).not.toHaveBeenCalled();
  for (let index = 0; index < 10; index += 1) {
    root.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
  }
  expect(requestFrame).toHaveBeenCalledTimes(1);
  expect(getContext).toHaveBeenCalledTimes(1);
  frames[1]?.(0);
  expect(getContext).toHaveBeenCalledTimes(2);
  cleanup();
  window.dispatchEvent(new Event("scroll"));
  expect(requestFrame).toHaveBeenCalledTimes(1);
});

it("shares page occlusion observation and one frame across roots until the last cleanup", () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() })),
  });
  const observers: {
    callback: () => void;
    observe: jest.Mock;
    disconnect: jest.Mock;
  }[] = [];
  jest.spyOn(globalThis, "MutationObserver").mockImplementation((callback) => {
    const observer = {
      callback: () => callback([], {} as MutationObserver),
      observe: jest.fn(),
      disconnect: jest.fn(),
    };
    observers.push(observer);
    return observer as unknown as MutationObserver;
  });
  const frames: FrameRequestCallback[] = [];
  const requestFrame = jest.fn((measure: FrameRequestCallback) => {
    frames.push(measure);
    return 1;
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: requestFrame,
  });
  const roots = [document.createElement("div"), document.createElement("div")];
  document.body.append(...roots);
  const contexts = [jest.fn(() => null), jest.fn(() => null)];
  const cleanups = roots.map((root, index) =>
    observeWaveFeatures({
      root,
      placement: "sidebar",
      getContext: contexts[index]!,
    })
  );
  try {
    expect(requestFrame).toHaveBeenCalledTimes(1);
    frames[0]?.(0);
    const bodyObservers = observers.filter((observer) =>
      observer.observe.mock.calls.some(
        ([target, options]) => target === document.body && options?.subtree
      )
    );
    expect(bodyObservers).toHaveLength(1);
    requestFrame.mockClear();
    for (let index = 0; index < 10; index += 1) bodyObservers[0]?.callback();
    expect(requestFrame).toHaveBeenCalledTimes(1);
    frames[1]?.(0);
    for (const context of contexts) expect(context).toHaveBeenCalledTimes(2);
    cleanups[0]?.();
    expect(bodyObservers[0]?.disconnect).not.toHaveBeenCalled();
    bodyObservers[0]?.callback();
    frames[2]?.(0);
    expect(contexts[0]).toHaveBeenCalledTimes(2);
    expect(contexts[1]).toHaveBeenCalledTimes(3);
    cleanups[1]?.();
    expect(bodyObservers[0]?.disconnect).toHaveBeenCalledTimes(1);
    requestFrame.mockClear();
    bodyObservers[0]?.callback();
    expect(requestFrame).not.toHaveBeenCalled();
  } finally {
    for (const cleanup of cleanups) cleanup();
  }
});
