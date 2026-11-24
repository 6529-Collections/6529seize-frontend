import { act, render } from "@testing-library/react";
import { domAnimation, LazyMotion, MotionValue, animate } from "framer-motion";
import { Profiler, StrictMode, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import SpringNavigationSurface from "@/components/mobile-navigation/SpringNavigationSurface";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { useMediaQuery } from "@/hooks/useMediaQuery";

jest.mock("@/hooks/useHorizontalSwipe", () => ({
  useHorizontalSwipe: jest.fn(() => () => undefined),
}));
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion");
  return { ...actual, animate: jest.fn(actual.animate) };
});

const QUERY = "(prefers-reduced-motion: reduce)";
const originalMatchMedia = window.matchMedia;

function installPreference(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const query = {
    get matches() {
      return matches;
    },
    media: QUERY,
    addEventListener: (_type: string, callback: () => void) =>
      listeners.add(callback),
    removeEventListener: (_type: string, callback: () => void) =>
      listeners.delete(callback),
  } as unknown as MediaQueryList;
  window.matchMedia = jest.fn((value) =>
    value === QUERY ? query : originalMatchMedia(value)
  );
  return (next: boolean) => {
    matches = next;
    act(() => listeners.forEach((listener) => listener()));
  };
}

function Surface({
  onBack = () => false,
  children = "Details",
  scope = "wave",
}: {
  readonly onBack?: () => boolean;
  readonly children?: ReactNode;
  readonly scope?: string;
}) {
  const reducedMotion = useMediaQuery(QUERY);
  return (
    <LazyMotion features={domAnimation}>
      <SpringNavigationSurface
        scope={scope}
        onBack={onBack}
        reducedMotion={reducedMotion}
      >
        {children}
      </SpringNavigationSurface>
    </LazyMotion>
  );
}

function gesture() {
  const options = jest.mocked(useHorizontalSwipe).mock.calls.at(-1)?.[0];
  if (!options) throw new Error("Gesture has not mounted");
  return options;
}

function position() {
  const value = jest.mocked(animate).mock.calls[0]?.[0];
  if (!(value instanceof MotionValue))
    throw new Error("Entry animation has not mounted");
  return value;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  jest.clearAllMocks();
  jest.useRealTimers();
});

it("never reads viewport dimensions while server rendering", () => {
  installPreference(false);
  const descriptor = Object.getOwnPropertyDescriptor(window, "innerWidth")!;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    get: () => {
      throw new Error("Render read viewport width");
    },
  });
  try {
    expect(renderToString(<Surface />)).toContain("clamp(0px, 0px, 100vw)");
  } finally {
    Object.defineProperty(window, "innerWidth", descriptor);
  }
});

it.each([false, true])(
  "hydrates without mismatches under Strict Mode with reduced motion %s",
  async (reduced) => {
    installPreference(reduced);
    const element = (
      <StrictMode>
        <Surface />
      </StrictMode>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const onRecoverableError = jest.fn();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      act(() => root?.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  }
);

it("stops motion when the preference changes and does not replay entry when restored", () => {
  const change = installPreference(false);
  const view = render(<Surface />);
  const x = position();
  act(() => {
    x.stop();
    x.set(80);
  });
  change(true);
  expect(x.get()).toBe(0);
  expect(x.isAnimating()).toBe(false);
  change(false);
  expect(x.get()).toBe(0);
  view.unmount();
});

it("keeps drag and spring frames outside React rendering", () => {
  jest.useFakeTimers();
  installPreference(false);
  const commits = jest.fn();
  const view = render(
    <Profiler id="motion" onRender={commits}>
      <Surface />
    </Profiler>
  );
  const count = commits.mock.calls.length;
  act(() => {
    const options = gesture();
    options.onStart?.();
    for (let distance = 1; distance <= 60; distance++)
      options.onMove(distance, false);
    options.onEnd(false, 60, 200);
    jest.advanceTimersByTime(800);
  });
  expect(commits).toHaveBeenCalledTimes(count);
  view.unmount();
});

it("stops snap-back on unmount and ignores a late gesture cancellation", () => {
  installPreference(false);
  const onBack = jest.fn(() => true);
  const view = render(<Surface onBack={onBack} />);
  const x = position();
  const options = gesture();
  act(() => {
    options.onStart?.();
    options.onMove(40, false);
    options.onEnd(false, 40, 100);
  });
  expect(x.isAnimating()).toBe(true);
  view.unmount();
  expect(x.isAnimating()).toBe(false);
  const animations = jest.mocked(animate).mock.calls.length;
  act(() => options.onEnd(true, 150, 800));
  expect(jest.mocked(animate)).toHaveBeenCalledTimes(animations);
  expect(onBack).not.toHaveBeenCalled();
});

it("clears a completed swipe offset when Back changes sub-pages without unmounting", () => {
  installPreference(false);
  const onBack = jest.fn(() => true);
  const view = render(<Surface scope="rename" onBack={onBack} />);
  const x = position();
  act(() => {
    const options = gesture();
    options.onStart?.();
    options.onMove(180, true);
    options.onEnd(true, 180, 800);
  });
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(x.get()).toBeGreaterThan(0);
  view.rerender(<Surface scope="about" onBack={onBack} />);
  expect(x.get()).toBe(0);
  view.unmount();
});
