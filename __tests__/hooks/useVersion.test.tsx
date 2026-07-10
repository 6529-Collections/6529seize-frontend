import { act, render } from "@testing-library/react";

describe("useIsVersionStale", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn();
    globalThis.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function TestComponent({ interval }: { interval?: number | undefined }) {
    const { useIsVersionStale } = require("@/hooks/useIsVersionStale");
    const stale = useIsVersionStale(interval);
    return <span>{stale ? "stale" : "fresh"}</span>;
  }

  it("shows fresh when versions match", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ version: "1.0.0" }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/announced-version", {
      cache: "no-store",
    });
    expect(await findByText("fresh")).toBeInTheDocument();
  });

  it("shows stale when versions differ", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ version: "2.0.0" }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("stale")).toBeInTheDocument();
  });

  it("ignores malformed version responses", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({}),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("fresh")).toBeInTheDocument();
  });

  it("shows stale when forced by query param", async () => {
    globalThis.history.replaceState(null, "", "/?showNewVersionToast=true");
    const { findByText } = render(<TestComponent interval={1000} />);
    expect(await findByText("stale")).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
