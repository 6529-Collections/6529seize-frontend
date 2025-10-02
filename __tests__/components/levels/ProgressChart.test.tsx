import { render, waitFor, screen } from "@testing-library/react";
import React from "react";

const lineMock = jest.fn((props: any) => {
  if (props.options?.onHover) {
    props.options.onHover({}, [{ index: 1 }]);
  }
  return <div data-testid="chart" />;
});

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
  it("dispatches level-hover event on hover", () => {
    const spy = jest.spyOn(window, "dispatchEvent");
    render(<ProgressChart />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "level-hover", detail: { level: 1 } })
    );
    const options = lineMock.mock.calls[0][0].options;
    expect(options.animation).toBeUndefined();
    spy.mockRestore();
  });

  it("disables animation when prefers reduced motion", async () => {
    (window as any).matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(<ProgressChart />);
    await waitFor(() => expect(lineMock).toHaveBeenCalledTimes(2));
    const options = lineMock.mock.calls[1][0].options;
    expect(options.animation).toBe(false);
  });
});
