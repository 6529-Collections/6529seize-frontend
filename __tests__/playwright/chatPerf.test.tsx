import {
  chatPerfProbe,
  longTasksBetween,
  percentile,
  rowLatencies,
  summarizeChatPerfWindow,
  type ChatPerfSnapshot,
} from "../../tests/support/chatPerf";

type ProbeState = {
  hookInstalled: boolean;
  commits: number;
  renders: number;
  mounts: number;
  walkErrors: number;
  framesReceived: number;
  receives: Record<string, number>;
  rows: Record<string, number>;
  trackRows: boolean;
  ownText: string | null;
  ownRenderAt: number | null;
  names: Record<string, number> | null;
};

const probeState = () =>
  (window as unknown as { __chatPerf: ProbeState }).__chatPerf;

// The probe's hook must exist before React DOM loads, as in the browser,
// where it is an init script. Load a separate React copy after installing it.
chatPerfProbe();
let React: typeof import("react");
let ReactDOMClient: typeof import("react-dom/client");
jest.isolateModules(() => {
  React = require("react");
  ReactDOMClient = require("react-dom/client");
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("chat performance probe", () => {
  it("counts exactly one render for a single leaf update (calibration)", async () => {
    const { act, createElement, memo, useState } = React;
    let setLeafValue: (value: number) => void = () => {};
    let setParentValue: (value: number) => void = () => {};

    function Leaf() {
      const [value, setValue] = useState(0);
      setLeafValue = setValue;
      return createElement("span", null, value);
    }
    function Static({ label }: { readonly label: string }) {
      return createElement("span", null, label);
    }
    const MemoStatic = memo(Static);
    function Parent() {
      const [value, setValue] = useState(0);
      setParentValue = setValue;
      return createElement(
        "div",
        null,
        createElement(Leaf),
        createElement(Static, { label: `plain ${value}` }),
        createElement(MemoStatic, { label: "memo" })
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(createElement(Parent));
    });

    const state = probeState();
    expect(state.hookInstalled).toBe(true);
    expect(state.walkErrors).toBe(0);
    // Parent, Leaf, Static and the memo's inner Static mount once each.
    expect(state.mounts).toBe(4);
    expect(state.renders).toBe(0);

    const afterMount = state.renders;
    await act(async () => {
      setLeafValue(1);
    });
    expect(state.renders - afterMount).toBe(1);

    // A parent update re-renders its non-memoized children; the memoized
    // child with unchanged props is skipped.
    const afterLeaf = state.renders;
    await act(async () => {
      setParentValue(1);
    });
    expect(state.renders - afterLeaf).toBe(3);
    expect(state.mounts).toBe(4);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("names rendered components when asked", async () => {
    const { act, createElement, useState } = React;
    let setValue: (value: number) => void = () => {};
    function NamedLeaf() {
      const [value, update] = useState(0);
      setValue = update;
      return createElement("span", null, value);
    }
    const container = document.createElement("div");
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(createElement(NamedLeaf));
    });
    probeState().names = {};
    await act(async () => {
      setValue(2);
    });
    expect(probeState().names).toEqual({ NamedLeaf: 1 });
    probeState().names = null;
    await act(async () => {
      root.unmount();
    });
  });

  it("marks the first read of each drop frame by serial number", () => {
    const state = probeState();
    const frame = JSON.stringify({
      type: "DROP_UPDATE",
      data: { id: "drop-7", serial_no: 7 },
    });
    const event = new MessageEvent("message", { data: frame });
    expect(event.data).toBe(frame);
    const firstMark = state.receives["7"];
    expect(firstMark).toEqual(expect.any(Number));
    // Repeated reads and other frame types leave the mark alone.
    expect(event.data).toBe(frame);
    new MessageEvent("message", {
      data: JSON.stringify({
        type: "DROP_UPDATE_REF",
        data: { update_type: "DROP_UPDATE", serial_no: 8 },
      }),
    }).data;
    expect(state.receives["7"]).toBe(firstMark);
    expect(state.receives["8"]).toBeUndefined();
    expect(state.framesReceived).toBe(1);
  });

  it("records chat rows only while armed", async () => {
    const state = probeState();
    const row = document.createElement("div");
    row.setAttribute("data-serial-no", "41");
    document.body.appendChild(row);
    await Promise.resolve();
    expect(state.rows["41"]).toBeUndefined();

    state.trackRows = true;
    const wrapper = document.createElement("section");
    const nested = document.createElement("div");
    nested.setAttribute("data-serial-no", "42");
    wrapper.appendChild(nested);
    document.body.appendChild(wrapper);
    await Promise.resolve();
    expect(state.rows["42"]).toEqual(expect.any(Number));
    state.trackRows = false;
    row.remove();
    wrapper.remove();
  });
});

describe("chat performance own-render mark", () => {
  it("marks the own row when its content renders after the row", async () => {
    const state = probeState();
    state.trackRows = true;
    state.ownText = "my own message";
    const row = document.createElement("div");
    row.setAttribute("data-serial-no", "77");
    document.body.appendChild(row);
    await Promise.resolve();
    expect(state.rows["77"]).toEqual(expect.any(Number));
    expect(state.ownRenderAt).toBeNull();

    const content = document.createElement("p");
    content.textContent = "my own message";
    row.appendChild(content);
    await Promise.resolve();
    expect(state.ownRenderAt).toEqual(expect.any(Number));
    state.trackRows = false;
    state.ownText = null;
    row.remove();
  });
});

describe("chat performance summaries", () => {
  const snapshot = (
    overrides: Partial<ChatPerfSnapshot>
  ): ChatPerfSnapshot => ({
    hookInstalled: true,
    commits: 0,
    renders: 0,
    mounts: 0,
    walkErrors: 0,
    framesReceived: 0,
    longTasks: [],
    receives: {},
    rows: {},
    rowFrames: {},
    submitAt: null,
    ownRenderAt: null,
    ownFrameAt: null,
    names: null,
    now: 0,
    ...overrides,
  });

  it("subtracts idle renders and divides by the message count", () => {
    expect(
      summarizeChatPerfWindow({
        messages: 20,
        durationMs: 5000,
        renders: 2010,
        mounts: 400,
        commits: 60,
        requests: Array.from({ length: 40 }, () => "GET /api/x"),
        idleRendersPerSecond: 2,
      })
    ).toMatchObject({
      rendersPerMessage: 100,
      mountsPerMessage: 20,
      commitsPerMessage: 3,
      requestsPerMessage: 2,
    });
  });

  it("pairs receive marks with row marks", () => {
    const latencies = rowLatencies(
      snapshot({
        receives: { "1": 10, "2": 20, "3": 30 },
        rows: { "1": 14, "2": 29 },
        rowFrames: { "1": 18, "2": 33 },
      })
    );
    expect(latencies.toRowMs).toEqual([4, 9]);
    expect(latencies.toFrameMs).toEqual([8, 13]);
    expect(percentile(latencies.toFrameMs, 50)).toBe(8);
    expect(percentile([], 50)).toBeNaN();
  });

  it("keeps long tasks that start inside the window", () => {
    expect(
      longTasksBetween(
        snapshot({
          longTasks: [
            { start: 5, duration: 300 },
            { start: 15, duration: 60 },
            { start: 40, duration: 90 },
          ],
        }),
        10,
        50
      )
    ).toEqual({ count: 2, totalMs: 150, maxMs: 90 });
  });
});
