import { observeWebVitals } from "@/services/analytics/telemetry/vitals";

type Entry = Record<string, unknown> & {
  startTime?: number;
  duration?: number;
};
const observers = new Map<
  string,
  { callback: (list: { getEntries: () => Entry[] }) => void; pending: Entry[] }
>();

class FakeObserver {
  static supportedEntryTypes = [
    "paint",
    "largest-contentful-paint",
    "layout-shift",
    "event",
    "first-input",
  ];
  constructor(
    private readonly callback: (list: { getEntries: () => Entry[] }) => void
  ) {}
  observe({ type }: { type: string }) {
    observers.set(type, { callback: this.callback, pending: [] });
  }
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const emit = (type: string, entries: Entry[]) =>
  observers.get(type)?.callback({ getEntries: () => entries });

let reports: Array<[string, number]>;

beforeEach(() => {
  observers.clear();
  reports = [];
  (globalThis as { PerformanceObserver?: unknown }).PerformanceObserver =
    FakeObserver;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  Object.defineProperty(performance, "getEntriesByType", {
    configurable: true,
    value: () => [{ responseStart: 180, activationStart: 30 }],
  });
});

const start = () =>
  observeWebVitals((name, value) => reports.push([name, value]));
const last = (name: string) => reports.filter(([n]) => n === name).at(-1)?.[1];

describe("observeWebVitals", () => {
  it("reports TTFB and FCP relative to activation", () => {
    start();
    emit("paint", [
      { name: "first-paint", startTime: 300 },
      { name: "first-contentful-paint", startTime: 430 },
    ]);
    expect(last("ttfb")).toBe(150);
    expect(last("fcp")).toBe(400);
  });

  it("stops LCP at the first input", () => {
    start();
    emit("largest-contentful-paint", [{ startTime: 900 }]);
    globalThis.dispatchEvent(new Event("pointerdown"));
    emit("largest-contentful-paint", [{ startTime: 4000 }]);
    expect(last("lcp")).toBe(870);
  });

  it("keeps the largest layout-shift session window", () => {
    start();
    emit("layout-shift", [
      { startTime: 100, value: 0.05, hadRecentInput: false },
      { startTime: 500, value: 0.05, hadRecentInput: false },
      { startTime: 700, value: 0.5, hadRecentInput: true },
      { startTime: 3000, value: 0.02, hadRecentInput: false },
    ]);
    expect(last("cls")).toBeCloseTo(0.1);
  });

  it("reports CLS 0 for a page without layout shifts", () => {
    start();
    expect(last("cls")).toBe(0);
  });

  it("estimates INP as the 98th-percentile interaction", () => {
    start();
    emit("event", [
      { interactionId: 1, duration: 80 },
      { interactionId: 1, duration: 120 },
      { interactionId: 2, duration: 300 },
      { interactionId: 0, duration: 900 },
    ]);
    expect(last("inp")).toBe(300);
    emit(
      "event",
      Array.from({ length: 60 }, (_, i) => ({
        interactionId: 100 + i,
        duration: 48,
      }))
    );
    // 62 interactions: skip the single worst one.
    expect(last("inp")).toBe(120);
  });

  it("reports only TTFB for a page that starts hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    start();
    expect(observers.size).toBe(0);
    expect(reports.map(([name]) => name)).toEqual(["ttfb"]);
  });
});
