import { render, waitFor, screen } from "@testing-library/react";
import React from "react";

const lineMock = jest.fn((props: any) => (
  <canvas
    aria-label={props["aria-label"]}
    data-testid="chart"
    role={props.role}
  />
));

jest.mock("react-chartjs-2", () => ({ Line: (props: any) => lineMock(props) }));

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  (window as any).matchMedia = jest.fn().mockReturnValue({ matches: false });
  lineMock.mockClear();
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

const ProgressChart = require("@/components/levels/ProgressChart").default;

describe("ProgressChart", () => {
  it("provides an accessible name and localized exact-value tooltip", () => {
    render(<ProgressChart />);
    expect(
      screen.getByRole("img", {
        name: /TDH \+ Rep thresholds from Level 0 through Level 100/i,
      })
    ).toBeInTheDocument();

    const props = lineMock.mock.calls[0][0];
    const options = props.options;
    expect(options.animation).toBeUndefined();
    expect(options.onHover).toBeUndefined();
    expect(
      options.plugins.tooltip.callbacks.label({
        label: "2",
        parsed: { y: 50 },
      })
    ).toBe("Level 2: 50 TDH + Rep");
  });

  it("disables animation when prefers reduced motion", async () => {
    (window as any).matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(<ProgressChart />);
    await waitFor(() => expect(lineMock).toHaveBeenCalledTimes(2));
    const options = lineMock.mock.calls[1][0]?.options;
    expect(options.animation).toBe(false);
  });
});
