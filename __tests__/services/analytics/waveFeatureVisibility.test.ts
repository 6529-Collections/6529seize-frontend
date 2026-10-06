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
afterEach(() => {
  jest.restoreAllMocks();
  document.body.replaceChildren();
  if (originalIntersection)
    Object.defineProperty(
      globalThis,
      "IntersectionObserver",
      originalIntersection
    );
  else Reflect.deleteProperty(globalThis, "IntersectionObserver");
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
  expect(() => button.click()).not.toThrow();
  expect(action).toHaveBeenCalledTimes(1);
  expect(() => window.dispatchEvent(new Event("resize"))).not.toThrow();
  cleanup();
});
