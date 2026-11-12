import { act, render } from "@testing-library/react";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";

const previousBrowserRuntime = process.env["PUBLIC_RUNTIME_BROWSER"];

// The update checker as browser bundles build it: `@/config/env` resolves to
// config/env.browser.ts. Its baked env is jest's default PUBLIC_RUNTIME without
// VERSION, as next.config.ts bakes it, and VERSION comes from the page's
// <html data-version>, as app/layout.tsx renders it. jest.setup.js loads the
// env before this file runs, so the factory sets both up.
jest.mock("@/config/env", () => {
  const { VERSION: _version, ...bakedWithoutVersion } = JSON.parse(
    process.env["PUBLIC_RUNTIME"] ?? "{}"
  ) as Record<string, unknown>;
  process.env["PUBLIC_RUNTIME_BROWSER"] = JSON.stringify(bakedWithoutVersion);
  document.documentElement.setAttribute(
    "data-version",
    "0123456789abcdef0123456789abcdef01234567"
  );
  document.documentElement.setAttribute("data-release-order", "1200");
  return jest.requireActual("@/config/env.browser");
});
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const PAGE_VERSION = "0123456789abcdef0123456789abcdef01234567";

function Probe() {
  return <span>{useIsVersionStale(1000) ? "stale" : "fresh"}</span>;
}

describe("useIsVersionStale in a browser bundle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ announced_version: null, stale: false }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    document.documentElement.removeAttribute("data-version");
    document.documentElement.removeAttribute("data-release-order");
    if (previousBrowserRuntime === undefined) {
      delete process.env["PUBLIC_RUNTIME_BROWSER"];
    } else {
      process.env["PUBLIC_RUNTIME_BROWSER"] = previousBrowserRuntime;
    }
  });

  it("reports the page's version to /api/version", async () => {
    const { findByText } = render(<Probe />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/version", {
      cache: "no-store",
      headers: expect.objectContaining({
        "x-6529-client-version": PAGE_VERSION,
        "x-6529-client-release-order": "1200",
      }),
    });
    expect(await findByText("fresh")).toBeInTheDocument();
  });

  it.each([undefined, 1199, 1200, "1201junk", 1201])(
    "requires a newer announcement order when an instance reports stale: %s",
    async (order) => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          announced_version: "different-version",
          announced_release_order: order,
          stale: true,
        }),
      });

      const { getByText } = render(<Probe />);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(getByText(order === 1201 ? "stale" : "fresh")).toBeInTheDocument();
    }
  );
});
