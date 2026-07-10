import { act, render } from "@testing-library/react";

describe("useIsVersionStale", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn();
    globalThis.history.replaceState(null, "", "/");
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = undefined;
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
      json: async () => ({
        announced_version: null,
        stale: false,
        version: "1.0.0",
      }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/version", {
      cache: "no-store",
    });
    expect(await findByText("fresh")).toBeInTheDocument();
  });

  it("shows stale when versions differ and no announcement endpoint is configured", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        announced_version: null,
        stale: true,
        version: "2.0.0",
      }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("stale")).toBeInTheDocument();
  });

  it("shows stale when the announced version differs from the current bundle", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    publicEnv.ANNOUNCED_VERSION_ENDPOINT =
      "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        announced_version: "2.0.0",
        stale: false,
        version: "2.0.0",
      }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("stale")).toBeInTheDocument();
  });

  it("does not use instance version while waiting for a configured announcement", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "1.0.0";
    publicEnv.ANNOUNCED_VERSION_ENDPOINT =
      "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json";
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        announced_version: null,
        stale: true,
        version: "2.0.0",
      }),
    });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(await findByText("fresh")).toBeInTheDocument();
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
