import type { VitalName } from "./wire";

type Report = (name: VitalName, value: number) => void;
type ShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };
type EventEntry = PerformanceEntry & { interactionId?: number };

const MAX_INTERACTIONS = 1000;

/**
 * Core Web Vitals from the browser's own performance entries, in about 1 KB
 * instead of a library: TTFB, FCP, LCP (until the first input), CLS (largest
 * session window: gaps under 1 s, at most 5 s) and INP (the 98th-percentile
 * interaction, estimated as in web-vitals). Each call to `report` carries the
 * metric's current value; the collector keeps the latest one until the page
 * first hides. Pages that start hidden report TTFB only.
 */
export function observeWebVitals(report: Report): {
  /** Delivers pending entries now, e.g. just before the page hides. */
  readonly flush: () => void;
  readonly stop: () => void;
} {
  const stops: Array<() => void> = [];
  const flushes: Array<() => void> = [];
  const observe = (
    type: string,
    onEntries: (entries: PerformanceEntry[]) => void,
    options: Record<string, unknown> = {}
  ): boolean => {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) return false;
      const observer = new PerformanceObserver((list) =>
        onEntries(list.getEntries())
      );
      observer.observe({ type, buffered: true, ...options });
      stops.push(() => observer.disconnect());
      flushes.push(() => onEntries(observer.takeRecords()));
      return true;
    } catch {
      /* Not observable in this browser. */
      return false;
    }
  };
  let navigation:
    | (PerformanceNavigationTiming & { activationStart?: number })
    | undefined;
  try {
    navigation = performance.getEntriesByType("navigation")[0] as
      | typeof navigation
      | undefined;
  } catch {
    navigation = undefined;
  }
  const since = (time: number) =>
    Math.max(0, time - (navigation?.activationStart ?? 0));

  if (navigation && navigation.responseStart > 0)
    report("ttfb", since(navigation.responseStart));
  const handle = {
    flush: () => {
      for (const flush of flushes) flush();
    },
    stop: () => {
      for (const stop of stops.splice(0)) stop();
      flushes.length = 0;
    },
  };
  if (document.visibilityState === "hidden") return handle;

  observe("paint", (entries) => {
    for (const entry of entries)
      if (entry.name === "first-contentful-paint")
        report("fcp", since(entry.startTime));
  });

  let lcpDone = false;
  observe("largest-contentful-paint", (entries) => {
    const last = entries.at(-1);
    if (!lcpDone && last) report("lcp", since(last.startTime));
  });
  const stopLcp = () => {
    lcpDone = true;
  };
  for (const type of ["keydown", "pointerdown"] as const) {
    addEventListener(type, stopLcp, { capture: true, once: true });
    stops.push(() => removeEventListener(type, stopLcp, { capture: true }));
  }

  let cls = 0;
  let session = 0;
  let sessionStart = 0;
  let previous = 0;
  const clsObserved = observe("layout-shift", (entries) => {
    for (const entry of entries as ShiftEntry[]) {
      if (entry.hadRecentInput) continue;
      const joins =
        session > 0 &&
        entry.startTime - previous < 1000 &&
        entry.startTime - sessionStart < 5000;
      session = joins ? session + entry.value : entry.value;
      if (!joins) sessionStart = entry.startTime;
      previous = entry.startTime;
      if (session > cls) {
        cls = session;
        report("cls", cls);
      }
    }
  });
  // A page with no layout shift has CLS 0, as web-vitals reports it; leaving
  // it out would skew the per-route percentiles upwards.
  if (clsObserved && cls === 0) report("cls", 0);

  const interactions = new Map<number, number>();
  const onEvents = (entries: PerformanceEntry[]) => {
    for (const entry of entries as EventEntry[]) {
      const id = entry.interactionId;
      if (
        id === undefined ||
        id === 0 ||
        (interactions.size >= MAX_INTERACTIONS && !interactions.has(id))
      )
        continue;
      interactions.set(id, Math.max(interactions.get(id) ?? 0, entry.duration));
    }
    const longest = [...interactions.values()].sort((a, b) => b - a);
    const inp =
      longest[Math.min(longest.length - 1, Math.floor(interactions.size / 50))];
    if (inp !== undefined) report("inp", inp);
  };
  observe("event", onEvents, { durationThreshold: 40 });
  observe("first-input", onEvents);

  return handle;
}
