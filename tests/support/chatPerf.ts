import type { Page, Request } from "@playwright/test";

/**
 * Chat performance probe (WAVES-PLAN Phase 0 item 0.1, Appendix A).
 *
 * Test-only: nothing here ships to users. One init script adds, before any
 * app code runs:
 * - a React DevTools global hook that walks every commit and counts the
 *   components that rendered: re-renders of mounted components (`renders`)
 *   separately from first mounts (`mounts`);
 * - a receive mark for each incoming `DROP_UPDATE` frame, taken when the app
 *   first reads the socket message;
 * - a DOM-insertion and next-frame mark for each chat row (`data-serial-no`);
 * - submit and own-render marks for the composer's send path;
 * - a long-task observer.
 *
 * The walk works in production builds: React calls the hook on every commit
 * there too. Component names are minified in production; set `names` on a
 * development server to see which components render.
 */
export type ChatPerfLongTask = {
  readonly start: number;
  readonly duration: number;
};

export type ChatPerfSnapshot = {
  readonly hookInstalled: boolean;
  readonly commits: number;
  readonly renders: number;
  readonly mounts: number;
  readonly walkErrors: number;
  readonly framesReceived: number;
  readonly longTasks: readonly ChatPerfLongTask[];
  readonly receives: Readonly<Record<string, number>>;
  readonly rows: Readonly<Record<string, number>>;
  readonly rowFrames: Readonly<Record<string, number>>;
  readonly submitAt: number | null;
  readonly ownRenderAt: number | null;
  readonly ownFrameAt: number | null;
  readonly names: Readonly<Record<string, number>> | null;
  readonly now: number;
};

export type ChatPerfArmOptions = {
  /** Record insertion times of chat rows (`[data-serial-no]`). */
  readonly trackRows?: boolean;
  /** Record a submit mark on the next click on a button with this name. */
  readonly submitLabel?: string;
  /** Record an own-render mark when a row containing this text appears. */
  readonly ownText?: string;
  /** Count renders per component name (useful on a development server). */
  readonly names?: boolean;
};

type ProbeFiber = {
  readonly tag: number;
  readonly flags: number;
  readonly type: unknown;
  readonly child: ProbeFiber | null;
  readonly sibling: ProbeFiber | null;
  readonly alternate: ProbeFiber | null;
};

type ProbeState = {
  hookInstalled: boolean;
  commits: number;
  renders: number;
  mounts: number;
  walkErrors: number;
  framesReceived: number;
  longTasks: ChatPerfLongTask[];
  receives: Record<string, number>;
  rows: Record<string, number>;
  rowFrames: Record<string, number>;
  trackRows: boolean;
  submitLabel: string | null;
  submitAt: number | null;
  ownText: string | null;
  ownRenderAt: number | null;
  ownFrameAt: number | null;
  names: Record<string, number> | null;
};

type ProbeWindow = Window & {
  __chatPerf?: ProbeState;
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
};

/**
 * Runs in the page before any app script. Self-contained: Playwright
 * serializes the function source, so it must not reference module scope.
 */
export function chatPerfProbe(): void {
  const w = window as ProbeWindow;
  if (w.__chatPerf) return;
  const state: ProbeState = {
    hookInstalled: false,
    commits: 0,
    renders: 0,
    mounts: 0,
    walkErrors: 0,
    framesReceived: 0,
    longTasks: [],
    receives: {},
    rows: {},
    rowFrames: {},
    trackRows: false,
    submitLabel: null,
    submitAt: null,
    ownText: null,
    ownRenderAt: null,
    ownFrameAt: null,
    names: null,
  };
  w.__chatPerf = state;

  // React work tags: function (0), class (1), forwardRef (11) and simple memo
  // (15). A memo with a custom comparison (14) wraps a separately counted
  // inner component, so it is walked but not counted.
  const COMPOSITE_TAGS = new Set([0, 1, 11, 15]);
  // React sets PerformedWork (bit 1) when a component's render function ran.
  const PERFORMED_WORK = 1;

  const nameOf = (fiber: ProbeFiber): string => {
    const type = fiber.type as
      | {
          displayName?: string;
          name?: string;
          render?: { displayName?: string; name?: string };
          type?: { displayName?: string; name?: string };
        }
      | undefined;
    if (!type) return "?";
    return (
      type.displayName ||
      type.name ||
      type.render?.displayName ||
      type.render?.name ||
      type.type?.displayName ||
      type.type?.name ||
      "?"
    );
  };

  const count = (key: string) => {
    if (!state.names) return;
    state.names[key] = (state.names[key] ?? 0) + 1;
  };

  // A subtree whose child pointer equals the previous tree's was not visited
  // by this commit's render, so it is skipped.
  const walkCommit = (root: ProbeFiber) => {
    const stack: ProbeFiber[] = [root];
    while (stack.length > 0) {
      let fiber: ProbeFiber | null = stack.pop() ?? null;
      for (; fiber; fiber = fiber.sibling) {
        const previous = fiber.alternate;
        if (COMPOSITE_TAGS.has(fiber.tag)) {
          if (!previous) {
            state.mounts += 1;
            count(`mount:${nameOf(fiber)}`);
          } else if (fiber.flags & PERFORMED_WORK) {
            state.renders += 1;
            count(nameOf(fiber));
          }
        }
        if (fiber.child && (!previous || fiber.child !== previous.child)) {
          stack.push(fiber.child);
        }
      }
    }
  };

  if (w.__REACT_DEVTOOLS_GLOBAL_HOOK__ === undefined) {
    let nextRendererId = 1;
    w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers: new Map(),
      inject() {
        state.hookInstalled = true;
        nextRendererId += 1;
        return nextRendererId - 1;
      },
      checkDCE() {},
      onScheduleFiberRoot() {},
      onCommitFiberRoot(_rendererId: number, root: { current: ProbeFiber }) {
        state.commits += 1;
        try {
          walkCommit(root.current);
        } catch {
          state.walkErrors += 1;
        }
      },
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
    };
  }

  // Receive mark: the first read of a socket message's data is when the app
  // starts handling it. Reading MessageEvent.data works for real sockets and
  // for Playwright's routed (mocked) sockets alike.
  const dataDescriptor = Object.getOwnPropertyDescriptor(
    MessageEvent.prototype,
    "data"
  );
  const readData = dataDescriptor?.get;
  if (readData) {
    const seen = new WeakSet<MessageEvent>();
    Object.defineProperty(MessageEvent.prototype, "data", {
      configurable: true,
      enumerable: dataDescriptor.enumerable ?? true,
      get(this: MessageEvent) {
        const value: unknown = readData.call(this);
        if (!seen.has(this)) {
          seen.add(this);
          if (
            typeof value === "string" &&
            value.includes('"DROP_UPDATE"') &&
            value.includes('"serial_no"')
          ) {
            const at = performance.now();
            try {
              const frame = JSON.parse(value) as {
                type?: string;
                data?: { serial_no?: number };
              };
              const serialNo = frame.data?.serial_no;
              if (
                frame.type === "DROP_UPDATE" &&
                typeof serialNo === "number"
              ) {
                state.framesReceived += 1;
                const key = String(serialNo);
                state.receives[key] ??= at;
              }
            } catch {
              // Not a chat frame.
            }
          }
        }
        return value;
      },
    });
  }

  const recordRow = (element: Element, now: number, inserted: string[]) => {
    const serialNo = element.getAttribute("data-serial-no");
    if (serialNo === null || state.rows[serialNo] !== undefined) return;
    state.rows[serialNo] = now;
    inserted.push(serialNo);
  };

  // A row's content can render after the row itself, so the own-render mark
  // checks every row that received new nodes, not only new rows.
  const checkOwnRow = (row: Element | null, now: number) => {
    if (
      row === null ||
      state.ownText === null ||
      state.ownRenderAt !== null ||
      !row.textContent?.includes(state.ownText)
    ) {
      return;
    }
    state.ownRenderAt = now;
    requestAnimationFrame(() => {
      state.ownFrameAt = performance.now();
    });
  };

  const observer = new MutationObserver((records) => {
    if (!state.trackRows) return;
    const now = performance.now();
    const inserted: string[] = [];
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        const element =
          node instanceof Element ? node : (node.parentElement ?? null);
        if (!element) return;
        if (node instanceof Element) {
          if (node.hasAttribute("data-serial-no"))
            recordRow(node, now, inserted);
          node.querySelectorAll("[data-serial-no]").forEach((row) => {
            recordRow(row, now, inserted);
            checkOwnRow(row, now);
          });
        }
        checkOwnRow(element.closest("[data-serial-no]"), now);
      });
    }
    if (inserted.length === 0) return;
    requestAnimationFrame(() => {
      const frameAt = performance.now();
      for (const serialNo of inserted) state.rowFrames[serialNo] ??= frameAt;
    });
  });
  const observe = () =>
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  if (document.documentElement) observe();
  else document.addEventListener("DOMContentLoaded", observe, { once: true });

  // Submit mark: the input event's own timestamp, so the mark does not wait
  // for the click handler or anything it schedules.
  window.addEventListener(
    "click",
    (event) => {
      if (state.submitLabel === null || state.submitAt !== null) return;
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button");
      if (!button) return;
      const name =
        button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "";
      if (name === state.submitLabel) state.submitAt = event.timeStamp;
    },
    { capture: true }
  );

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longTasks.push({
          start: entry.startTime,
          duration: entry.duration,
        });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {
    // Long-task timing is Chromium-only.
  }
}

export async function installChatPerfProbe(page: Page): Promise<void> {
  await page.addInitScript(chatPerfProbe);
}

export async function armChatPerf(
  page: Page,
  options: ChatPerfArmOptions
): Promise<void> {
  await page.evaluate((armOptions) => {
    const state = (window as ProbeWindow).__chatPerf;
    if (!state) throw new Error("Chat performance probe is not installed.");
    if (armOptions.trackRows !== undefined)
      state.trackRows = armOptions.trackRows;
    if (armOptions.submitLabel !== undefined) {
      state.submitLabel = armOptions.submitLabel;
      state.submitAt = null;
    }
    if (armOptions.ownText !== undefined) {
      state.ownText = armOptions.ownText;
      state.ownRenderAt = null;
      state.ownFrameAt = null;
    }
    if (armOptions.names) state.names = {};
  }, options);
}

export async function readChatPerf(page: Page): Promise<ChatPerfSnapshot> {
  return page.evaluate(() => {
    const state = (window as ProbeWindow).__chatPerf;
    if (!state) throw new Error("Chat performance probe is not installed.");
    return {
      hookInstalled: state.hookInstalled,
      commits: state.commits,
      renders: state.renders,
      mounts: state.mounts,
      walkErrors: state.walkErrors,
      framesReceived: state.framesReceived,
      longTasks: [...state.longTasks],
      receives: { ...state.receives },
      rows: { ...state.rows },
      rowFrames: { ...state.rowFrames },
      submitAt: state.submitAt,
      ownRenderAt: state.ownRenderAt,
      ownFrameAt: state.ownFrameAt,
      names: state.names ? { ...state.names } : null,
      now: performance.now(),
    };
  });
}

export type ApiRequestTracker = {
  /** Requests to the API origin since the last reset. */
  readonly requests: () => readonly string[];
  readonly reset: () => void;
  readonly dispose: () => void;
};

/** Counts browser requests to `<apiOrigin>/api/...` (A.2). */
export function trackApiRequests(
  page: Page,
  apiOrigin: string
): ApiRequestTracker {
  let seen: string[] = [];
  const listener = (request: Request) => {
    const url = new URL(request.url());
    if (url.origin !== apiOrigin || !url.pathname.startsWith("/api/")) return;
    seen.push(`${request.method()} ${url.pathname}`);
  };
  page.on("request", listener);
  return {
    requests: () => [...seen],
    reset: () => {
      seen = [];
    },
    dispose: () => {
      page.off("request", listener);
    },
  };
}

export type ChatPerfWindow = {
  readonly messages: number;
  readonly durationMs: number;
  readonly renders: number;
  readonly mounts: number;
  readonly commits: number;
  readonly requests: readonly string[];
  readonly idleRendersPerSecond: number;
};

export type ChatPerfSummary = {
  readonly messages: number;
  /** Re-renders of already-mounted components, idle-corrected. */
  readonly rendersPerMessage: number;
  /** First mounts, including each new row's own components. */
  readonly mountsPerMessage: number;
  readonly commitsPerMessage: number;
  readonly requestsPerMessage: number;
  readonly requests: readonly string[];
};

export function summarizeChatPerfWindow(
  window: ChatPerfWindow
): ChatPerfSummary {
  const idleRenders = (window.idleRendersPerSecond * window.durationMs) / 1000;
  const perMessage = (value: number) =>
    Math.round((value / window.messages) * 10) / 10;
  return {
    messages: window.messages,
    rendersPerMessage: perMessage(Math.max(0, window.renders - idleRenders)),
    mountsPerMessage: perMessage(window.mounts),
    commitsPerMessage: perMessage(window.commits),
    requestsPerMessage: perMessage(window.requests.length),
    requests: window.requests,
  };
}

/** Receive-to-row and receive-to-frame latencies for rows that appeared. */
export function rowLatencies(snapshot: ChatPerfSnapshot): {
  readonly toRowMs: readonly number[];
  readonly toFrameMs: readonly number[];
} {
  const toRowMs: number[] = [];
  const toFrameMs: number[] = [];
  for (const [serialNo, receivedAt] of Object.entries(snapshot.receives)) {
    const rowAt = snapshot.rows[serialNo];
    const frameAt = snapshot.rowFrames[serialNo];
    if (rowAt !== undefined) toRowMs.push(rowAt - receivedAt);
    if (frameAt !== undefined) toFrameMs.push(frameAt - receivedAt);
  }
  return { toRowMs, toFrameMs };
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return Math.round(sorted[index]! * 10) / 10;
}

/** Long tasks that started inside [start, end] (performance.now() times). */
export function longTasksBetween(
  snapshot: ChatPerfSnapshot,
  start: number,
  end: number
): {
  readonly count: number;
  readonly totalMs: number;
  readonly maxMs: number;
} {
  const tasks = snapshot.longTasks.filter(
    (task) => task.start >= start && task.start <= end
  );
  return {
    count: tasks.length,
    totalMs: Math.round(tasks.reduce((sum, task) => sum + task.duration, 0)),
    maxMs: Math.round(Math.max(0, ...tasks.map((task) => task.duration))),
  };
}
