import SentrySummary from "@/app/tools/monitoring/sentry-summary";
import type { ApiMonitoringSentryProjectOverview } from "@/generated/models/ApiMonitoringSentryProjectOverview";
import { render, screen } from "@testing-library/react";

function project(
  overrides: Partial<ApiMonitoringSentryProjectOverview> = {}
): ApiMonitoringSentryProjectOverview {
  const empty = { issues: [], count: 0, count_exact: true, has_more: false };
  return {
    project: "web",
    new_issues: [],
    top_issues: [],
    new_issues_has_more: false,
    top_issues_has_more: false,
    high_priority: empty,
    regressed: empty,
    escalating: empty,
    new_issues_total: 0,
    new_issues_count_exact: true,
    event_trend: { current_events: 0, previous_events: 0 },
    ...overrides,
  };
}

it("uses independent provider counts across projects rather than counting preview rows", () => {
  render(
    <SentrySummary
      locale="en-US"
      projects={[
        project({
          high_priority: {
            issues: [],
            count: 9,
            count_exact: true,
            has_more: true,
          },
          new_issues_total: 1,
        }),
        project({
          project: "backend",
          high_priority: {
            issues: [],
            count: 1,
            count_exact: true,
            has_more: false,
          },
        }),
      ]}
    />
  );
  expect(screen.getByText("10", { exact: true })).toBeInTheDocument();
  expect(
    screen.getByText("1 new · 0 returned · 0 spiking")
  ).toBeInTheDocument();
});

it("labels incomplete counts as lower bounds", () => {
  render(
    <SentrySummary
      locale="en-US"
      projects={[
        project({
          high_priority: {
            issues: [],
            count: 6,
            count_exact: false,
            has_more: true,
          },
        }),
      ]}
    />
  );
  expect(screen.getByText("At least 6")).toBeInTheDocument();
});

it.each([
  [30, 10, "Up 200% from the previous 24 hours"],
  [5, 10, "Down 50% from the previous 24 hours"],
  [0, 10, "Down 100% from the previous 24 hours"],
  [10, 10, "Unchanged from the previous 24 hours"],
  [0, 0, "Unchanged from the previous 24 hours"],
  [10, 0, "Activity after a quiet previous 24 hours"],
])("handles event comparison %s versus %s", (current, previous, label) => {
  render(
    <SentrySummary
      locale="en-US"
      projects={[
        project({
          event_trend: { current_events: current, previous_events: previous },
        }),
      ]}
    />
  );
  expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
});

it("does not display a partial multi-project trend as a complete total", () => {
  render(
    <SentrySummary
      locale="en-US"
      projects={[
        project({ event_trend: { current_events: 50, previous_events: 100 } }),
        project({
          project: "backend",
          event_trend: { current_events: null, previous_events: 10 },
        }),
      ]}
    />
  );
  expect(
    screen.getByText(
      "A complete daily comparison is unavailable for this snapshot."
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/Down 50%/)).not.toBeInTheDocument();
});
