import { ComingUpNextDecision } from "@/components/home/next-mint-leading/ComingUpNextDecision";
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
  ["Asia/Shanghai", "2026-10-26", "Next decision on Oct 27, 2026 at 00:00."],
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
    screen.getByText("Next decision on Oct 27, 2026 at 16:00.")
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
      "Next decision on Oct 27, 2026 at 00:00."
    );
    expect(result.recoverableErrors).toEqual([]);
    expect(result.hydrationConsoleErrors).toEqual([]);
  } finally {
    await result.cleanup();
  }
});
