import type { PhoneNavigationMotion } from "./phone-navigation-registry";
import { animate } from "framer-motion";
import { MOTION_SPRINGS } from "./springs";

interface PhoneNavigationLayers {
  readonly page: HTMLElement;
  readonly destination: HTMLElement;
  readonly dim: HTMLElement;
}

function clearPhoneNavigationLayers(layers: PhoneNavigationLayers) {
  for (const element of [layers.page, layers.destination]) {
    element.style.removeProperty("transform");
    element.style.removeProperty("opacity");
    element.style.removeProperty("will-change");
    element.style.removeProperty("visibility");
    element.style.removeProperty("box-shadow");
  }
  layers.dim.style.removeProperty("opacity");
  layers.dim.style.removeProperty("will-change");
}

function paintPhoneNavigation(
  layers: PhoneNavigationLayers,
  position: number,
  width: number,
  reducedMotion: boolean
) {
  if (reducedMotion) {
    layers.page.style.removeProperty("transform");
    layers.page.style.opacity = String(1 - position / width);
    layers.destination.style.removeProperty("transform");
    layers.dim.style.opacity = "0";
    return;
  }
  const progress = position / width;
  layers.page.style.transform = `translate3d(${position}px,0,0)`;
  layers.destination.style.transform = `translate3d(${((progress - 1) * width) / 3}px,0,0)`;
  layers.dim.style.opacity = String((1 - progress) * 0.12);
}

/** One compositor position drives the page, its real destination and depth. */
export function createPhoneNavigationMotion(
  getLayers: () => PhoneNavigationLayers | null
): PhoneNavigationMotion {
  let animation: ReturnType<typeof animate> | null = null;
  let layers: PhoneNavigationLayers | null = null;
  let position = 0;
  let width = 0;
  let generation = 0;
  let entering = false;
  const entryFocus = new WeakMap<HTMLElement, HTMLElement>();

  const motionPreference = globalThis.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const reducedMotion = () => motionPreference.matches;

  const stop = () => {
    generation += 1;
    animation?.stop();
    animation = null;
  };

  const clear = () => {
    if (!layers) return;
    clearPhoneNavigationLayers(layers);
    layers = null;
    position = 0;
  };

  const applyMotionPreference = () => {
    if (!layers) return;
    layers.page.style.willChange = reducedMotion() ? "opacity" : "transform";
    layers.page.style.boxShadow = reducedMotion()
      ? ""
      : "-6px 0 22px rgb(0 0 0 / 0.28)";
  };

  const prepare = () => {
    const next = getLayers();
    if (!next) return false;
    if (layers?.page !== next.page || layers.destination !== next.destination) {
      clear();
      layers = next;
    }
    width = next.page.getBoundingClientRect().width || globalThis.innerWidth;
    next.destination.style.visibility = "visible";
    // Descendant visibility rules must not reveal an inactive retained screen.
    // Reveal its entire composited subtree only for the navigation motion.
    next.destination.style.opacity = "1";
    applyMotionPreference();
    next.destination.style.willChange = "transform";
    next.dim.style.willChange = "opacity";
    return true;
  };

  const paint = (value: number) => {
    if (!layers) return;
    position = Math.max(0, Math.min(width, value));
    paintPhoneNavigation(layers, position, width, reducedMotion());
  };

  const settle = (
    destination: number,
    velocity: number,
    finish: () => void
  ) => {
    stop();
    const released = generation;
    let finished = false;
    const complete = () => {
      if (finished || released !== generation) return;
      finished = true;
      paint(destination);
      finish();
    };
    animation = animate(position, destination, {
      ...(reducedMotion()
        ? MOTION_SPRINGS.effects
        : MOTION_SPRINGS.spatial.default),
      velocity,
      onUpdate: (value) => {
        if (released !== generation || finished) return;
        paint(value);
        // Clip the invisible spring tail, including overshoot, at either edge.
        if (Math.abs(position - destination) < 0.5) complete();
      },
      onComplete: complete,
    });
  };

  const onMotionPreferenceChange = () => {
    if (!layers) return;
    layers.page.style.removeProperty("opacity");
    applyMotionPreference();
    paint(position);
  };
  motionPreference.addEventListener("change", onMotionPreferenceChange);

  return {
    transition(direction, navigate) {
      if (direction === "forward") {
        const focused = document.activeElement;
        const source = focused?.closest<HTMLElement>(
          "[data-phone-navigation-screen]"
        );
        if (focused instanceof HTMLElement && source)
          entryFocus.set(source, focused);
        stop();
        entering = true;
        navigate();
        return true;
      }
      if (!prepare()) return false;
      entering = false;
      settle(width, 0, navigate);
      return true;
    },
    begin() {
      stop();
      entering = false;
      if (!prepare()) return null;
      const origin = position;
      paint(position);
      return {
        origin,
        width,
        move(distance) {
          if (!reducedMotion()) paint(origin + distance);
        },
        end(committed, velocity, navigate) {
          settle(committed ? width : 0, velocity, committed ? navigate : clear);
        },
      };
    },
    commit(isEntering) {
      stop();
      const animateEntry = entering || isEntering;
      const restoreFocus =
        !animateEntry && layers
          ? entryFocus.get(layers.destination)
          : undefined;
      entering = false;
      clear();
      if (restoreFocus?.isConnected)
        restoreFocus.focus({ preventScroll: true });
      if (!animateEntry || !prepare()) return;
      paint(width);
      settle(0, 0, clear);
    },
    dispose() {
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      stop();
      clear();
    },
  };
}
