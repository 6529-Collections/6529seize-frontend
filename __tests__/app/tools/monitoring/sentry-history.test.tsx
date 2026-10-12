import SentryHistory from "@/app/tools/monitoring/sentry-history";
import type { ApiMonitoringSentryHistory } from "@/generated/models/ApiMonitoringSentryHistory";
import {
  ApiMonitoringSentryHistoryStatusEnum,
  ApiMonitoringSentryHistoryPeriodEnum,
  ApiMonitoringSentryHistoryTimezoneEnum,
} from "@/generated/models/ApiMonitoringSentryHistory";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ChartData } from "chart.js";
type MockLineProps = { data: ChartData<"line">; "aria-label": string };
const mockLine = jest.fn((props: MockLineProps) => (
  <div role="img" aria-label={props["aria-label"]} />
));

jest.mock("react-chartjs-2", () => ({
  Line: (props: MockLineProps) => mockLine(props),
}));

function history(): ApiMonitoringSentryHistory {
  return {
    status: ApiMonitoringSentryHistoryStatusEnum.Ready,
    environment: "production",
    period: ApiMonitoringSentryHistoryPeriodEnum._30d,
    timezone: ApiMonitoringSentryHistoryTimezoneEnum.Utc,
    projects: ["frontend", "seize-backend"].map((project, index) => ({
      project,
      days: Array.from({ length: 30 }, (_, day) => ({
        date: new Date(Date.UTC(2026, 8, 8 + day)).toISOString().slice(0, 10),
        events: index === 0 ? 305 : 0,
        issues: index === 0 ? 17 : 0,
      })),
    })),
  };
}

function props() {
  return {
    history: history(),
    locale: "en-US" as const,
    loading: false,
    unavailable: false,
    onRetry: jest.fn(),
  };
}

function latestData(): ChartData<"line"> {
  return mockLine.mock.calls.at(-1)![0].data;
}

describe("Sentry daily history", () => {
  beforeEach(() => jest.clearAllMocks());

  it("switches between occurrences and distinct issues without mixing their scales", () => {
    render(<SentryHistory {...props()} />);
    expect(
      screen.getByRole("button", { name: "Error occurrences" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(latestData().datasets[0]?.data[29]).toBe(305);
    fireEvent.click(screen.getByRole("button", { name: "Distinct issues" }));
    expect(
      screen.getByRole("button", { name: "Distinct issues" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Error occurrences" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(latestData().datasets[0]?.data[29]).toBe(17);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /Daily Distinct issues by project/
    );
  });

  it("preserves chart gaps and gives exact zero/missing values in accessible UTC tables", () => {
    const value = props();
    value.history.projects[0]!.days[29] = {
      date: "2026-10-07",
      events: null,
      issues: null,
    };
    render(<SentryHistory {...value} />);
    expect(latestData().datasets[0]?.data[29]).toBeNull();
    expect(latestData().datasets[0]?.spanGaps).toBe(false);
    expect(latestData().datasets[1]?.data[29]).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Gaps mean unavailable data, not zero errors."
    );
    const frontend = within(
      screen.getByRole("table", { name: "frontend", hidden: true })
    );
    expect(frontend.getAllByRole("row", { hidden: true })).toHaveLength(31);
    expect(
      frontend
        .getAllByRole("cell", { hidden: true })
        .filter((cell) => cell.textContent === "Unavailable")
    ).toHaveLength(2);
    expect(
      frontend.getByRole("rowheader", { name: "Oct 7", hidden: true })
    ).toBeInTheDocument();
  });

  it("shows loading and a recoverable error without drawing stale data", () => {
    const value = props();
    const view = render(<SentryHistory {...value} loading />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading daily history"
    );
    expect(mockLine).not.toHaveBeenCalled();
    view.rerender(<SentryHistory {...value} unavailable />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load daily history"
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(value.onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(SUPPORTED_LOCALES)(
    "formats dates and numbers while retaining message fallback in %s",
    (locale) => {
      render(<SentryHistory {...props()} locale={locale} />);
      expect(
        screen.getByRole("button", { name: "Distinct issues" })
      ).toBeInTheDocument();
      expect(latestData().labels).toHaveLength(30);
      expect(latestData().datasets.map((dataset) => dataset.label)).toEqual([
        "frontend",
        "seize-backend",
      ]);
      expect(
        screen.getByText(/Last 30 completed days · UTC/)
      ).toBeInTheDocument();
    }
  );
});
