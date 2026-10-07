import {
  getWaveFeatureDescriptor,
  getWaveFeatureVisitEpoch,
  hasWaveFeatureBeenSeen,
  recordWaveFeatureActivation,
  recordWaveFeatureSeen,
  subscribeWaveFeatureVisitReset,
  type WaveFeatureContext,
  type WaveFeaturePlacement,
} from "./waveFeatureUsage";
import { getAnalyticsGeneration } from "./mixpanel";

export function isWaveFeatureVisible(element: HTMLElement): boolean {
  if (
    !element.isConnected ||
    document.visibilityState !== "visible" ||
    !document.hasFocus() ||
    element.closest('[inert], [aria-hidden="true"]') ||
    element.matches(":disabled")
  )
    return false;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(window.innerWidth, rect.right);
  let bottom = Math.min(window.innerHeight, rect.bottom);
  for (
    let ancestor: HTMLElement | null = element;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    const style = getComputedStyle(ancestor);
    if (
      style.display === "none" ||
      style.visibility !== "visible" ||
      Number(style.opacity) === 0
    )
      return false;
    // Root overflow applies to the viewport, already clipped above. Its content
    // box can be shorter than fixed portal dialogs when scrolling is locked.
    if (ancestor === document.documentElement) continue;
    const bounds = ancestor.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
      left = Math.max(left, bounds.left);
      right = Math.min(right, bounds.right);
    }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
      top = Math.max(top, bounds.top);
      bottom = Math.min(bottom, bounds.bottom);
    }
  }
  if (
    (Math.max(0, right - left) * Math.max(0, bottom - top)) /
      (rect.width * rect.height) <
    0.5
  )
    return false;
  // Hit-test inside the clipped area so overlays/sticky controls do not count.
  if (typeof document.elementFromPoint !== "function") return false;
  const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
  return hit !== null && element.contains(hit);
}

interface WaveFeatureObserverOptions {
  readonly root: HTMLElement;
  readonly placement: WaveFeaturePlacement;
  readonly getContext: () => WaveFeatureContext | null;
}

function createExposureChecks({
  root,
  placement,
  getContext,
}: WaveFeatureObserverOptions) {
  const selector =
    placement === "wave_tabs"
      ? '[role="tab"]'
      : '[data-wave-feature], [data-wave-feature-list="active-votes"] a';
  const controls = (): HTMLElement[] => {
    const descendants = [...root.querySelectorAll<HTMLElement>(selector)];
    return root.matches(selector) ? [root, ...descendants] : descendants;
  };
  const timers = new Map<
    HTMLElement,
    {
      timer: ReturnType<typeof setTimeout>;
      value: string;
      generation: number;
      epoch: number;
      contextKey: string;
    }
  >();
  const stopTimer = (element: HTMLElement) => {
    const pending = timers.get(element);
    if (pending) clearTimeout(pending.timer);
    timers.delete(element);
  };
  const safely = (measure: () => void) => {
    try {
      measure();
    } catch {
      // Failed measurements must neither count exposure nor interrupt controls.
      for (const element of timers.keys()) stopTimer(element);
    }
  };
  const check = () =>
    safely(() => {
      const context = getContext();
      const elements = controls();
      for (const element of timers.keys()) {
        const pending = timers.get(element);
        const descriptor = getWaveFeatureDescriptor(element, placement);
        if (
          !root.contains(element) ||
          !context ||
          !isWaveFeatureVisible(element) ||
          pending?.contextKey !== context.key ||
          pending.generation !== getAnalyticsGeneration() ||
          pending.epoch !== getWaveFeatureVisitEpoch() ||
          pending.value !== descriptor?.value
        )
          stopTimer(element);
      }
      if (!context) return;
      for (const element of elements) {
        const descriptor = getWaveFeatureDescriptor(element, placement);
        if (
          timers.has(element) ||
          !descriptor ||
          hasWaveFeatureBeenSeen(context, descriptor) ||
          !isWaveFeatureVisible(element)
        )
          continue;
        const startingKey = context.key;
        const startingGeneration = getAnalyticsGeneration();
        const startingEpoch = getWaveFeatureVisitEpoch();
        const timer = setTimeout(
          () =>
            safely(() => {
              stopTimer(element);
              const latest = getContext();
              const latestDescriptor = getWaveFeatureDescriptor(
                element,
                placement
              );
              if (
                latest?.key === startingKey &&
                startingGeneration === getAnalyticsGeneration() &&
                startingEpoch === getWaveFeatureVisitEpoch() &&
                latestDescriptor &&
                isWaveFeatureVisible(element)
              ) {
                recordWaveFeatureSeen(
                  latest,
                  latestDescriptor,
                  "foreground_dwell"
                );
              }
            }),
          1000
        );
        timers.set(element, {
          timer,
          value: descriptor.value,
          generation: startingGeneration,
          epoch: startingEpoch,
          contextKey: startingKey,
        });
      }
    });
  const cancel = () => {
    for (const element of timers.keys()) stopTimer(element);
  };
  return { selector, controls, safely, check, cancel };
}

const frameChecks = new Set<() => void>();
let measurementFrame: number | null = null;

function flushFrameChecks() {
  measurementFrame = null;
  const pending = [...frameChecks];
  frameChecks.clear();
  for (const check of pending) check();
}

function scheduleFrameCheck(check: () => void) {
  frameChecks.add(check);
  if (measurementFrame !== null) return;
  try {
    measurementFrame = window.requestAnimationFrame(flushFrameChecks);
  } catch {
    flushFrameChecks();
  }
}

function createFrameScheduler(check: () => void) {
  const schedule = () => scheduleFrameCheck(check);
  const cancel = () => {
    frameChecks.delete(check);
    if (frameChecks.size === 0 && measurementFrame !== null) {
      window.cancelAnimationFrame(measurementFrame);
      measurementFrame = null;
    }
  };
  return { schedule, cancel };
}

const occlusionChecks = new Set<() => void>();
let pageOcclusion: MutationObserver | undefined;

function observePageOcclusion(check: () => void): () => void {
  occlusionChecks.add(check);
  try {
    if (!pageOcclusion) {
      const observer = new MutationObserver(() => {
        for (const measure of occlusionChecks) scheduleFrameCheck(measure);
      });
      try {
        // One shared observer covers portal overlays outside telemetry roots.
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "inert", "aria-hidden", "hidden"],
        });
      } catch (error) {
        observer.disconnect();
        throw error;
      }
      pageOcclusion = observer;
    }
  } catch (error) {
    occlusionChecks.delete(check);
    throw error;
  }
  return () => {
    occlusionChecks.delete(check);
    if (occlusionChecks.size === 0) {
      pageOcclusion?.disconnect();
      pageOcclusion = undefined;
    }
  };
}

function observeRelevantScroll(
  root: HTMLElement,
  schedule: () => void
): () => void {
  const ancestors: HTMLElement[] = [];
  for (
    let ancestor = root.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  )
    ancestors.push(ancestor);
  root.addEventListener("scroll", schedule, true);
  for (const ancestor of ancestors)
    ancestor.addEventListener("scroll", schedule);
  // Viewport scrolling only; unrelated nested feeds do not bubble here.
  window.addEventListener("scroll", schedule);
  return () => {
    root.removeEventListener("scroll", schedule, true);
    for (const ancestor of ancestors)
      ancestor.removeEventListener("scroll", schedule);
    window.removeEventListener("scroll", schedule);
  };
}

export function observeWaveFeatures(
  options: WaveFeatureObserverOptions
): () => void {
  const { root, placement, getContext } = options;
  const { selector, controls, safely, check, cancel } =
    createExposureChecks(options);
  const scheduled = createFrameScheduler(check);
  let stopScroll: () => void = () => undefined;
  let unsubscribe: () => void = () => undefined;
  let stopOcclusion: () => void = () => undefined;
  const onClick = (event: MouseEvent) =>
    safely(() => {
      // Root triggers are captured here; portal choices use their selection callback.
      if (
        !event.isTrusted ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest<HTMLElement>(selector);
      const context = getContext();
      if (
        !element ||
        !root.contains(element) ||
        !context ||
        !isWaveFeatureVisible(element)
      )
        return;
      const descriptor = getWaveFeatureDescriptor(element, placement);
      if (!descriptor) return;
      if (placement === "leaderboard_dropdown" && descriptor.value !== "menu")
        return;
      let action: "choose" | "open" | "expand" | "collapse" = "choose";
      if (descriptor.feature === "sidebar_entry") action = "open";
      if (descriptor.feature === "leaderboard_sort" && descriptor.value === "menu") {
        action =
          element.getAttribute("aria-expanded") === "true" ? "collapse" : "open";
      }
      if (descriptor.feature === "sidebar_section") {
        action =
          element.getAttribute("aria-expanded") === "true"
            ? "collapse"
            : "expand";
      }
      recordWaveFeatureActivation(context, descriptor, action);
    });
  let mutation: MutationObserver | undefined;
  let controlsMutation: MutationObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  const cleanup = () => {
    mutation?.disconnect();
    controlsMutation?.disconnect();
    intersection?.disconnect();
    cancel();
    scheduled.cancel();
    stopScroll();
    unsubscribe();
    stopOcclusion();
    root.removeEventListener("click", onClick, true);
    window.removeEventListener("resize", scheduled.schedule);
    window.removeEventListener("blur", check);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
  };
  try {
    mutation = new MutationObserver(scheduled.schedule);
    mutation.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    for (
      let ancestor = root.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      mutation.observe(ancestor, { attributes: true });
    }
    intersection = new IntersectionObserver(scheduled.schedule, {
      threshold: [0, 0.5, 1],
    });
    const observeControls = () =>
      safely(() => {
        intersection?.disconnect();
        for (const element of controls()) intersection?.observe(element);
        scheduled.schedule();
      });
    controlsMutation = new MutationObserver(observeControls);
    controlsMutation.observe(root, { childList: true, subtree: true });
    // Capture sees the pre-action state, including keyboard clicks.
    root.addEventListener("click", onClick, true);
    stopScroll = observeRelevantScroll(root, scheduled.schedule);
    unsubscribe = subscribeWaveFeatureVisitReset(check);
    stopOcclusion = observePageOcclusion(check);
    window.addEventListener("resize", scheduled.schedule);
    window.addEventListener("blur", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    observeControls();
  } catch {
    cleanup();
  }
  return cleanup;
}
