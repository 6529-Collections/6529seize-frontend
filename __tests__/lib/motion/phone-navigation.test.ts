import { animate } from "framer-motion";
import { createPhoneNavigationMotion } from "@/lib/motion/phone-navigation";
import { MOTION_SPRINGS } from "@/lib/motion/springs";

jest.mock("framer-motion", () => ({ animate: jest.fn() }));

const originalWidth = window.innerWidth;
const originalMatchMedia = window.matchMedia;
const stop = jest.fn();
let motionPreference: MediaQueryList;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 400,
  });
  motionPreference = Object.assign(new EventTarget(), {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });
  window.matchMedia = jest.fn().mockReturnValue(motionPreference);
  jest.mocked(animate).mockReturnValue({ stop } as ReturnType<typeof animate>);
});

afterEach(() => {
  document.body.replaceChildren();
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalWidth,
  });
});

function setup() {
  const page = document.createElement("div");
  const destination = document.createElement("div");
  const dim = document.createElement("div");
  destination.append(dim);
  document.body.append(destination, page);
  destination.scrollTop = 850;
  return {
    page,
    destination,
    dim,
    motion: createPhoneNavigationMotion(() => ({ page, destination, dim })),
  };
}

function options() {
  const call = jest.mocked(animate).mock.calls.at(-1);
  if (!call?.[2]) throw new Error("Expected a running navigation spring");
  return call[2];
}

it("reveals the real destination with depth without changing its reading position", () => {
  const { motion, page, destination, dim } = setup();
  const gesture = motion.begin();
  expect(gesture?.width).toBe(400);
  gesture?.move(100);
  expect(page.style.transform).toBe("translate3d(100px,0,0)");
  expect(destination.style.visibility).toBe("visible");
  expect(destination.style.opacity).toBe("1");
  expect(destination.style.transform).toBe("translate3d(-100px,0,0)");
  expect(destination.scrollTop).toBe(850);
  expect(Number(dim.style.opacity)).toBeCloseTo(0.09);
  expect(page.style.boxShadow).not.toBe("");
  motion.dispose();
});

it("carries release velocity and commits only once when the page reaches the edge", () => {
  const { motion } = setup();
  const navigate = jest.fn();
  const gesture = motion.begin();
  gesture?.move(120);
  gesture?.end(true, 1800, navigate);
  expect(animate).toHaveBeenLastCalledWith(
    120,
    400,
    expect.objectContaining({
      ...MOTION_SPRINGS.spatial.default,
      velocity: 1800,
    })
  );
  options().onUpdate?.(399.8);
  options().onComplete?.();
  expect(navigate).toHaveBeenCalledTimes(1);
  motion.commit(false);
});

it("cancels back to the same page and leaves the destination mounted", () => {
  const { motion, page, destination, dim } = setup();
  const navigate = jest.fn();
  const gesture = motion.begin();
  gesture?.move(110);
  gesture?.end(false, 0, navigate);
  options().onComplete?.();
  expect(navigate).not.toHaveBeenCalled();
  expect(page.style.transform).toBe("");
  expect(destination.style.visibility).toBe("");
  expect(destination.style.opacity).toBe("");
  expect(dim.style.opacity).toBe("");
  expect(dim.style.willChange).toBe("");
  expect(destination.isConnected).toBe(true);
  expect(destination.scrollTop).toBe(850);
  motion.dispose();
});

it("catches an in-flight Back and prevents its old completion from navigating", () => {
  const { motion, page } = setup();
  const navigate = jest.fn();
  motion.transition("back", navigate);
  const outgoing = options();
  outgoing.onUpdate?.(140);
  const gesture = motion.begin();
  expect(stop).toHaveBeenCalled();
  expect(gesture?.origin).toBe(140);
  gesture?.move(-20);
  expect(page.style.transform).toBe("translate3d(120px,0,0)");
  outgoing.onComplete?.();
  expect(navigate).not.toHaveBeenCalled();
  gesture?.end(false, -500, navigate);
  options().onComplete?.();
  expect(navigate).not.toHaveBeenCalled();
  motion.dispose();
});

it("crossfades with reduced motion without translating, dimming or shadow", () => {
  Object.defineProperty(motionPreference, "matches", { value: true });
  const { motion, page, destination, dim } = setup();
  motion.transition("back", jest.fn());
  options().onUpdate?.(100);
  expect(page.style.transform).toBe("");
  expect(destination.style.transform).toBe("");
  expect(dim.style.opacity).toBe("0");
  expect(page.style.opacity).toBe("0.75");
  expect(destination.style.opacity).toBe("1");
  expect(page.style.boxShadow).toBe("");
  motion.dispose();
});

it.each(["chevron", "gesture"] as const)(
  "lets a superseding %s finish Back exactly once",
  (method) => {
    const { motion } = setup();
    const first = jest.fn();
    const second = jest.fn();
    motion.transition("back", first);
    const old = options();
    old.onUpdate?.(140);
    if (method === "gesture") {
      const caught = motion.begin();
      caught?.move(120);
      caught?.end(true, 500, second);
    } else motion.transition("back", second);
    old.onComplete?.();
    expect(first).not.toHaveBeenCalled();
    options().onUpdate?.(399.8);
    options().onComplete?.();
    expect(second).toHaveBeenCalledTimes(1);
    motion.commit(false);
    motion.dispose();
  }
);

it("honors reduced-motion changes during a drag and removes its listener on disposal", () => {
  const { motion, page, destination, dim } = setup();
  const removeListener = jest.spyOn(motionPreference, "removeEventListener");
  const gesture = motion.begin();
  gesture?.move(100);
  Object.defineProperty(motionPreference, "matches", {
    configurable: true,
    value: true,
  });
  motionPreference.dispatchEvent(new Event("change"));
  expect(page.style.transform).toBe("");
  expect(page.style.opacity).toBe("0.75");
  expect(page.style.boxShadow).toBe("");
  expect(destination.style.transform).toBe("");
  expect(dim.style.opacity).toBe("0");

  Object.defineProperty(motionPreference, "matches", { value: false });
  motionPreference.dispatchEvent(new Event("change"));
  expect(page.style.opacity).toBe("");
  expect(page.style.transform).toBe("translate3d(100px,0,0)");
  expect(page.style.boxShadow).not.toBe("");
  expect(Number(dim.style.opacity)).toBeCloseTo(0.09);
  motion.dispose();
  expect(removeListener).toHaveBeenCalledWith("change", expect.any(Function));
  removeListener.mockRestore();
});

it("opens over the same retained source and cleans its final motion styles", () => {
  const { motion, page, destination } = setup();
  const navigate = jest.fn();
  motion.transition("forward", navigate);
  expect(navigate).toHaveBeenCalledTimes(1);
  motion.commit(true);
  expect(page.style.transform).toBe("translate3d(400px,0,0)");
  expect(destination.style.transform).toBe("translate3d(0px,0,0)");
  options().onComplete?.();
  expect(page.style.transform).toBe("");
  expect(destination.style.transform).toBe("");
  expect(destination.scrollTop).toBe(850);
  motion.dispose();
});

it("resets an interrupted entry before selecting another conversation", () => {
  const { motion, page, destination } = setup();
  motion.transition("forward", jest.fn());
  motion.commit(true);
  const entry = options();
  entry.onUpdate?.(100);
  page.dataset["phoneNavigationScreen"] = "conversation";
  const navigate = jest.fn();
  motion.transition("forward", navigate);
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(page.style.transform).toBe("");
  expect(destination.style.visibility).toBe("");
  entry.onUpdate?.(50);
  entry.onComplete?.();
  expect(page.style.transform).toBe("");
  const count = jest.mocked(animate).mock.calls.length;
  motion.commit(false);
  expect(animate).toHaveBeenCalledTimes(count);
  motion.dispose();
});

it("ignores an old touch release after a newer Back takes ownership", () => {
  const { motion, page } = setup();
  const oldTouch = motion.begin();
  oldTouch?.move(100);
  const navigate = jest.fn();
  motion.transition("back", navigate);
  const back = options();
  back.onUpdate?.(200);
  oldTouch?.move(20);
  oldTouch?.end(false, 0, jest.fn());
  expect(page.style.transform).toBe("translate3d(200px,0,0)");
  back.onComplete?.();
  expect(navigate).toHaveBeenCalledTimes(1);
  motion.dispose();
});
