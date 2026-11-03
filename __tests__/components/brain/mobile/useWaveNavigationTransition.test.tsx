import { act, render } from "@testing-library/react";
import {
  getWaveNavigationScreen,
  useWaveNavigationTransition,
} from "@/components/brain/mobile/useWaveNavigationTransition";

const cancel = jest.fn();
const animate = jest.fn<
  Pick<Animation, "cancel">,
  [Keyframe[], KeyframeAnimationOptions]
>(() => ({ cancel }));
const media = {
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
const originalAnimate = HTMLElement.prototype.animate;
const originalMatchMedia = window.matchMedia;

function Surface({
  screen,
}: {
  readonly screen: Parameters<typeof useWaveNavigationTransition>[0];
}) {
  const ref = useWaveNavigationTransition(screen);
  return <div ref={ref}>Wave content</div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  media.matches = false;
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  window.matchMedia = jest.fn().mockReturnValue(media);
});

afterEach(() => {
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: originalAnimate,
  });
  window.matchMedia = originalMatchMedia;
});

it("does not animate initial loads or unrelated routes", () => {
  const { rerender } = render(<Surface screen={null} />);
  rerender(<Surface screen="list" />);
  rerender(<Surface screen="list" />);
  expect(animate).not.toHaveBeenCalled();
  expect(getWaveNavigationScreen("/notifications", null)).toBeNull();
  expect(getWaveNavigationScreen("/messages/wave-a", "wave-a")).toBeNull();
  expect(getWaveNavigationScreen("/waves", null)).toBe("list");
  expect(getWaveNavigationScreen("/waves/wave-a", "wave-a")).toBe("wave");
});

it("moves into a wave and reverses direction on return without remounting", () => {
  const { container, rerender, unmount } = render(<Surface screen="list" />);
  const surface = container.firstElementChild;
  rerender(<Surface screen="wave" />);
  expect(container.firstElementChild).toBe(surface);
  expect(animate).toHaveBeenLastCalledWith(
    [
      { opacity: 0.75, transform: "scale(0.98)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
  );
  rerender(<Surface screen="list" />);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(animate.mock.calls[1]?.[0][0]).toEqual({
    opacity: 0.75,
    transform: "scale(1.02)",
  });
  unmount();
  expect(cancel).toHaveBeenCalledTimes(2);
});

it("skips motion when reduced motion is requested", () => {
  media.matches = true;
  const { rerender } = render(<Surface screen="list" />);
  rerender(<Surface screen="wave" />);
  expect(animate).not.toHaveBeenCalled();
});

it("stops an active transition if reduced motion is enabled", () => {
  const { rerender, unmount } = render(<Surface screen="list" />);
  rerender(<Surface screen="wave" />);
  const listener = media.addEventListener.mock.calls[0]?.[1];
  media.matches = true;
  act(() => listener());
  expect(cancel).toHaveBeenCalledTimes(1);
  unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", listener);
});

it("keeps navigation usable when Web Animations is unavailable", () => {
  Object.defineProperty(HTMLElement.prototype, "animate", { value: undefined });
  const { rerender } = render(<Surface screen="list" />);
  expect(() => rerender(<Surface screen="wave" />)).not.toThrow();
});
