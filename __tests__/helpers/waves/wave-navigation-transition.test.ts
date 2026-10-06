import {
  commitWaveNavigationTransition,
  runWaveNavigationTransition,
  skipWaveNavigationTransition,
} from "@/helpers/waves/wave-navigation-transition";

const originalStart = document.startViewTransition;
const originalMatchMedia = window.matchMedia;
const media = {
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
let finish: () => void;
let updateDone: Promise<void>;
const skip = jest.fn(() => finish());
const start = jest.fn((update: () => Promise<void>) => {
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  updateDone = Promise.resolve().then(update);
  return { ready: updateDone, finished, skipTransition: skip };
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  document.body.innerHTML = '<div data-wave-navigation-screen="list"></div>';
  media.matches = false;
  window.matchMedia = jest.fn().mockReturnValue(media);
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: start,
  });
});

afterEach(async () => {
  skipWaveNavigationTransition();
  await Promise.resolve();
  jest.useRealTimers();
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(document, "startViewTransition", {
    value: originalStart,
  });
  document.body.innerHTML = "";
});

it("captures the old screen before navigating and releases after the new screen commits", async () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).not.toHaveBeenCalled();
  expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
    "forward"
  );
  await Promise.resolve();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(true);
  await updateDone;
  jest.advanceTimersByTime(500);
  expect(skip).not.toHaveBeenCalled();
  finish();
  await Promise.resolve();
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
  expect(
    document.querySelector<HTMLElement>("[data-wave-navigation-screen]")?.style
      .viewTransitionName
  ).toBe("");
});

it("keeps navigation immediate with reduced motion or no browser support", () => {
  const navigate = jest.fn();
  media.matches = true;
  runWaveNavigationTransition("wave", navigate);
  media.matches = false;
  Object.defineProperty(document, "startViewTransition", { value: undefined });
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(start).not.toHaveBeenCalled();
});

it("does not capture unrelated layouts or same-screen navigation", () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("list", navigate);
  document.body.innerHTML = "";
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(start).not.toHaveBeenCalled();
});

it("releases an interrupted transition without waiting indefinitely", async () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("wave", navigate);
  await Promise.resolve();
  jest.advanceTimersByTime(500);
  await updateDone;
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(skip).toHaveBeenCalledTimes(1);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
});

it("skips an in-flight transition when motion preferences change", async () => {
  runWaveNavigationTransition("wave", jest.fn());
  await Promise.resolve();
  media.addEventListener.mock.calls[0]?.[1]();
  await updateDone;
  expect(skip).toHaveBeenCalledTimes(1);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
});

it("falls back to navigation and restores the surface when transition startup throws", () => {
  start.mockImplementationOnce(() => {
    throw new Error("Transition unavailable");
  });
  const navigate = jest.fn();
  expect(() => runWaveNavigationTransition("wave", navigate)).not.toThrow();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(false);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
  expect(
    document.documentElement.style.getPropertyValue("--wave-transition-height")
  ).toBe("");
  expect(
    document.querySelector<HTMLElement>("[data-wave-navigation-screen]")?.style
      .viewTransitionName
  ).toBe("");
});

it("cancels only once across repeated interruption and motion preference events", async () => {
  runWaveNavigationTransition("wave", jest.fn());
  await Promise.resolve();
  const preferenceChanged = media.addEventListener.mock.calls[0]?.[1];
  skipWaveNavigationTransition();
  skipWaveNavigationTransition();
  preferenceChanged();
  await updateDone;
  jest.advanceTimersByTime(500);
  preferenceChanged();
  expect(skip).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(false);
});
