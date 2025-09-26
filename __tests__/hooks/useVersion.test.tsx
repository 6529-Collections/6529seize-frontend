import { act, render } from "@testing-library/react";

describe("useIsVersionStale", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn();
  });

  function TestComponent({ interval }: { interval?: number }) {
    const { useIsVersionStale } = require("@/hooks/useIsVersionStale");
    const stale = useIsVersionStale(interval);
    return <span>{stale ? "stale" : "fresh"}</span>;
  }

  it("shows fresh when versions match", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ version: "1.0.0" }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("fresh")).toBeInTheDocument();
  });

  it("shows stale when versions differ", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ version: "2.0.0" }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("stale")).toBeInTheDocument();
  });
});
