import { ComingUpNextDecision } from "@/components/home/next-mint-leading/ComingUpNextDecision";
import { Profiler } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  mockDefaultTimeZone,
  renderServerThenHydrate,
} from "@/__tests__/utils/timeZoneHydration";

jest.mock("@/services/app-activity/native-app-activity", () => ({
  getNativeAppActivity: () => true,
  subscribeNativeAppActivity: () => () => undefined,
}));

const NOW = Date.parse("2026-10-26T12:00:00Z");
const DECISION = Date.parse("2026-10-26T16:00:00Z");

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it.each([
  ["Europe/Tallinn", "2026-10-26", "Next decision today at 18:00."],
  ["Asia/Shanghai", "2026-10-26", "Next decision tomorrow at 00:00."],
  ["America/New_York", "2026-10-26", "Next decision today at 12:00."],
  ["Europe/Tallinn", "2026-07-15", "Next decision today at 19:00."],
  ["America/New_York", "2026-11-02", "Next decision today at 11:00."],
])("uses the viewer's %s zone on %s", (zone, day, expected) => {
  jest.setSystemTime(Date.parse(`${day}T12:00:00Z`));
  const timestamp = Date.parse(`${day}T16:00:00Z`);
  const restore = mockDefaultTimeZone(zone);
  try {
    render(<ComingUpNextDecision timestamp={timestamp} locale="en-US" />);
    expect(screen.getByText(expected)).toHaveAttribute(
      "datetime",
      new Date(timestamp).toISOString()
    );
  } finally {
    restore();
  }
});

it.each([null, Number.NaN, Number.POSITIVE_INFINITY, 1e20, NOW, NOW - 1])(
  "omits unavailable, invalid, or passed decisions (%s)",
  (timestamp) => {
    const { container } = render(
      <ComingUpNextDecision timestamp={timestamp} locale="en-US" />
    );
    expect(container).toBeEmptyDOMElement();
    expect(jest.getTimerCount()).toBe(0);
  }
);

it("changes the date to today at local midnight", () => {
  jest.setSystemTime(Date.parse("2026-10-26T23:59:00Z"));
  render(
    <ComingUpNextDecision
      timestamp={Date.parse("2026-10-27T16:00:00Z")}
      locale="en-US"
    />
  );
  expect(
    screen.getByText("Next decision tomorrow at 16:00.")
  ).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(60_000));
  expect(screen.getByText("Next decision today at 16:00.")).toBeInTheDocument();
});

it("expires the label at the decision time without interval polling", () => {
  const interval = jest.spyOn(globalThis, "setInterval");
  const { container } = render(
    <ComingUpNextDecision timestamp={DECISION} locale="en-US" />
  );
  act(() => jest.advanceTimersByTime(DECISION - NOW - 1));
  expect(container.querySelector("time")).not.toBeNull();
  act(() => jest.advanceTimersByTime(1));
  expect(container).toBeEmptyDOMElement();
  expect(jest.getTimerCount()).toBe(0);
  expect(interval).not.toHaveBeenCalled();
});

it("cancels timers while hidden and catches up when the tab returns", () => {
  const visibility = jest.spyOn(document, "visibilityState", "get");
  const { container } = render(
    <ComingUpNextDecision timestamp={DECISION} locale="en-US" />
  );
  expect(jest.getTimerCount()).toBe(1);
  act(() => {
    visibility.mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(jest.getTimerCount()).toBe(0);
  jest.setSystemTime(DECISION + 1);
  act(() => {
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(container).toBeEmptyDOMElement();
});

it("catches up on focus after the device clock changes", () => {
  const { container } = render(
    <ComingUpNextDecision timestamp={DECISION} locale="en-US" />
  );
  jest.setSystemTime(DECISION + 1);
  act(() => globalThis.dispatchEvent(new Event("focus")));
  expect(container).toBeEmptyDOMElement();
  expect(jest.getTimerCount()).toBe(0);
});

it("replaces the timer when the schedule changes and clears it on unmount", () => {
  const { rerender, unmount } = render(
    <ComingUpNextDecision timestamp={DECISION} locale="en-US" />
  );
  const replacement = DECISION + 3_600_000;
  rerender(<ComingUpNextDecision timestamp={replacement} locale="en-US" />);
  expect(jest.getTimerCount()).toBe(1);
  act(() => jest.advanceTimersByTime(DECISION - NOW));
  expect(screen.getByText("Next decision today at 17:00.")).toBeInTheDocument();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it("hydrates without exposing the server's timezone", async () => {
  const result = await renderServerThenHydrate(
    <ComingUpNextDecision timestamp={DECISION} locale="en-US" />,
    { serverTimeZone: "UTC", clientTimeZone: "Asia/Shanghai" }
  );
  try {
    expect(result.serverHtml).toBe("");
    expect(result.container).toHaveTextContent(
      "Next decision tomorrow at 00:00."
    );
    expect(result.recoverableErrors).toEqual([]);
    expect(result.hydrationConsoleErrors).toEqual([]);
  } finally {
    await result.cleanup();
  }
});

it.each([
  ["2026-10-27T16:00:00Z", "Next decision tomorrow at 16:00."],
  ["2026-10-28T16:00:00Z", "Next decision Wednesday at 16:00."],
  ["2026-11-01T16:00:00Z", "Next decision Sunday at 16:00."],
  ["2026-11-02T16:00:00Z", "Next decision Nov 2 at 16:00."],
  ["2026-11-06T16:00:00Z", "Next decision Nov 6 at 16:00."],
])("uses a concise calendar label for %s", (date, expected) => {
  render(<ComingUpNextDecision timestamp={Date.parse(date)} locale="en-US" />);
  expect(screen.getByText(expected)).toHaveAttribute(
    "datetime",
    new Date(date).toISOString()
  );
});

it.each([
  [
    "Europe/Tallinn",
    "2026-03-28T21:30:00Z",
    "2026-03-29T21:30:00Z",
    "Next decision Monday at 00:30.",
  ],
  [
    "Europe/Tallinn",
    "2026-10-24T21:30:00Z",
    "2026-10-25T21:30:00Z",
    "Next decision today at 23:30.",
  ],
  [
    "UTC",
    "2026-12-31T12:00:00Z",
    "2027-01-01T16:00:00Z",
    "Next decision tomorrow at 16:00.",
  ],
])(
  "uses calendar days across DST and year boundaries in %s",
  (zone, current, decision, expected) => {
    jest.setSystemTime(Date.parse(current));
    const restore = mockDefaultTimeZone(zone);
    try {
      render(
        <ComingUpNextDecision timestamp={Date.parse(decision)} locale="en-US" />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    } finally {
      restore();
    }
  }
);

it.each([
  ["en-US", "Friday"],
  ["en-GB", "Friday"],
  ["fr-FR", "vendredi"],
  ["es-ES", "viernes"],
  ["de-DE", "Freitag"],
] as const)(
  "formats weekdays with %s and the existing message fallback",
  (locale, weekday) => {
    render(
      <ComingUpNextDecision
        timestamp={Date.parse("2026-10-30T18:00:00Z")}
        locale={locale}
      />
    );
    expect(
      screen.getByText(`Next decision ${weekday} at 18:00.`)
    ).toBeInTheDocument();
  }
);

it("does not rerender between calendar or decision boundaries", () => {
  const onRender = jest.fn();
  render(
    <Profiler id="decision" onRender={onRender}>
      <ComingUpNextDecision timestamp={DECISION} locale="en-US" />
    </Profiler>
  );
  onRender.mockClear();
  act(() => jest.advanceTimersByTime(3_600_000));
  expect(onRender).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(1);
});
