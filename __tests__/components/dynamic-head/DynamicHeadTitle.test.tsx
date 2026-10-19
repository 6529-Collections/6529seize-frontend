import { render, waitFor } from "@testing-library/react";
import React from "react";

let mockTitle = "6529.io";
let mockIsTitleOwned = false;
let mockTitlePathname: string | null = "/network";
let mockPathname = "/network";
let mockSearchParams = new URLSearchParams();

jest.mock("@/contexts/TitleContext", () => ({
  DEFAULT_TITLE: "6529.io",
  useTitle: () => ({
    title: mockTitle,
    isTitleOwned: mockIsTitleOwned,
    titlePathname: mockTitlePathname,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";

// MutationObserver callbacks are microtask-scheduled; flush microtasks and
// two macrotask ticks so negative assertions are deterministic.
const flushObservers = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("DynamicHeadTitle", () => {
  beforeEach(() => {
    mockTitle = "6529.io";
    mockIsTitleOwned = false;
    mockTitlePathname = "/network";
    mockPathname = "/network";
    mockSearchParams = new URLSearchParams();
  });

  it("re-asserts an owned title after a later head commit overwrites it", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    mockTitlePathname = "/open-data/network-metrics";
    mockPathname = "/open-data/network-metrics";
    document.title = "Network Metrics"; // SSR metadata title

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    // The App Router's metadata commit lands after hydration and would
    // silently clobber the owned title without the observer.
    document.title = "Network Metrics";
    await waitFor(() =>
      expect(document.title).toBe("Network Metrics | Open Data")
    );
  });

  it("lets server metadata win over route-default placeholders", async () => {
    mockTitle = "Open Data | Tools"; // provider route default, not owned
    mockIsTitleOwned = false;
    mockTitlePathname = "/open-data";
    mockPathname = "/open-data";
    document.title = "Open Data";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Open Data");

    document.title = "Open Data Updated";
    await flushObservers();
    expect(document.title).toBe("Open Data Updated");
  });

  it("writes a one-shot fallback when the document title is empty", async () => {
    mockTitle = "Open Data | Tools";
    mockIsTitleOwned = false;
    mockTitlePathname = "/open-data";
    mockPathname = "/open-data";
    document.title = "";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Open Data | Tools");

    // Not sticky: a later head commit must win for unowned titles.
    document.title = "Open Data";
    await flushObservers();
    expect(document.title).toBe("Open Data");
  });

  it("owns the default title on the root path", async () => {
    mockTitle = "6529.io";
    mockIsTitleOwned = false;
    mockTitlePathname = "/";
    mockPathname = "/";
    document.title = "Something Else";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("6529.io");

    document.title = "Something Else";
    await waitFor(() => expect(document.title).toBe("6529.io"));
  });

  it("never writes route defaults across a route change, whichever side of the metadata commit", async () => {
    // Owned title on the source route.
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    mockTitlePathname = "/open-data/network-metrics";
    mockPathname = "/open-data/network-metrics";
    document.title = "Network Metrics";

    const view = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    // Navigation render: ownership evaporates render-time; the context text
    // still belongs to the previous route (titlePathname lags pathname).
    mockIsTitleOwned = false;
    mockPathname = "/open-data";
    view.rerender(<DynamicHeadTitle />);
    await flushObservers();
    expect(document.title).toBe("Network Metrics | Open Data"); // untouched

    // Metadata commit for the new route lands BEFORE the provider reset.
    document.title = "Open Data";

    // Provider reset render: context becomes consistent for the new route.
    mockTitle = "Open Data | Tools";
    mockTitlePathname = "/open-data";
    view.rerender(<DynamicHeadTitle />);
    await flushObservers();
    // The route-default placeholder must not clobber the committed metadata.
    expect(document.title).toBe("Open Data");
  });

  it("restores the new context title once when ownership is released on the same pathname", async () => {
    mockTitle = "Wave One | Brain";
    mockIsTitleOwned = true;
    mockTitlePathname = "/messages";
    mockPathname = "/messages";
    document.title = "Messages | Brain";

    const view = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Wave One | Brain");

    // Leaving a wave without a pathname change: no metadata commit fires,
    // so the context's route-default reset must reach document.title.
    mockTitle = "Messages | Brain";
    mockIsTitleOwned = false;
    view.rerender(<DynamicHeadTitle />);
    expect(document.title).toBe("Messages | Brain");

    // But it is not sticky: a later external write stands.
    document.title = "External";
    await flushObservers();
    expect(document.title).toBe("External");
  });

  it("keeps owning the title when the head commit replaces the <title> node", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    mockTitlePathname = "/open-data/network-metrics";
    mockPathname = "/open-data/network-metrics";
    document.title = "Network Metrics";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    // Simulate a head commit that swaps the <title> element entirely.
    const replacement = document.createElement("title");
    replacement.textContent = "Network Metrics";
    document.querySelector("title")?.replaceWith(replacement);
    await waitFor(() =>
      expect(document.title).toBe("Network Metrics | Open Data")
    );
  });

  it("normalizes owned title whitespace before observing browser title writes", async () => {
    mockTitle = "Mint #519 | The Loom  | The Memes";
    mockIsTitleOwned = true;
    mockTitlePathname = "/the-memes/mint";
    mockPathname = "/the-memes/mint";
    document.title = "Mint | The Memes";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Mint #519 | The Loom | The Memes");

    document.title = "Mint #519 | The Loom | The Memes";
    await flushObservers();
    expect(document.title).toBe("Mint #519 | The Loom | The Memes");
  });

  it("does not let a stale observer fight the next route's metadata commit", async () => {
    mockTitle = "Wave One | Brain";
    mockIsTitleOwned = true;
    mockTitlePathname = "/messages";
    mockPathname = "/messages";
    document.title = "Messages | Brain";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("Wave One | Brain");

    // SPA navigation: the browser location moves before the next route's
    // head commit lands, while this observer's cleanup is still pending.
    window.history.pushState({}, "", "/tools/api");
    try {
      document.title = "API";
      await flushObservers();
      expect(document.title).toBe("API");
    } finally {
      window.history.pushState({}, "", "/");
    }
  });

  it.each(["drop=first", "serialNo=42"])(
    "preserves streamed drop metadata while the background wave updates (%s)",
    async (query) => {
      mockPathname = "/waves/wave-1";
      mockTitlePathname = mockPathname;
      mockSearchParams = new URLSearchParams(query);
      mockIsTitleOwned = true;
      mockTitle = "Main Stage | Brain";
      document.title = "TestIntern by @phoebeum";

      const view = render(<DynamicHeadTitle />);
      expect(document.title).toBe("TestIntern by @phoebeum");

      mockTitle = "(3 new messages) Main Stage | Brain";
      view.rerender(<DynamicHeadTitle />);
      document.title = "Updated submission by @artist";
      await flushObservers();
      expect(document.title).toBe("Updated submission by @artist");
    }
  );

  it("does not apply an unowned fallback over drop metadata", async () => {
    mockPathname = "/waves/wave-1";
    mockTitlePathname = mockPathname;
    mockSearchParams = new URLSearchParams("drop=first");
    document.title = "";
    const view = render(<DynamicHeadTitle />);
    expect(document.title).toBe("");
    document.title = "TestIntern by @phoebeum";
    mockTitle = "Waves | Brain";
    view.rerender(<DynamicHeadTitle />);
    await flushObservers();
    expect(document.title).toBe("TestIntern by @phoebeum");
  });

  it("releases an old observer before a same-path drop navigation commits", async () => {
    mockPathname = "/waves/wave-1";
    mockTitlePathname = mockPathname;
    mockIsTitleOwned = true;
    mockTitle = "Main Stage | Brain";
    window.history.replaceState({}, "", mockPathname);
    const view = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Main Stage | Brain");

    try {
      // The browser moves and commits metadata before React can clean up
      // the wave observer. That observer must already have released ownership.
      window.history.pushState({}, "", `${mockPathname}?drop=first`);
      document.title = "First submission by @artist";
      await flushObservers();
      expect(document.title).toBe("First submission by @artist");
      // A background update can render before navigation's search params
      // have caught up. It must not claim the new URL on the old wave's behalf.
      mockTitle = "(1 new message) Main Stage | Brain";
      view.rerender(<DynamicHeadTitle />);
      await flushObservers();
      expect(document.title).toBe("First submission by @artist");
      mockTitle = "Main Stage | Brain";
      mockSearchParams = new URLSearchParams("drop=first");
      view.rerender(<DynamicHeadTitle />);

      mockSearchParams = new URLSearchParams("drop=second");
      window.history.pushState({}, "", `${mockPathname}?drop=second`);
      document.title = "Second submission by @artist";
      view.rerender(<DynamicHeadTitle />);
      await flushObservers();
      expect(document.title).toBe("Second submission by @artist");

      // Close (or Back to the wave) restores chat ownership.
      mockSearchParams = new URLSearchParams();
      window.history.replaceState({}, "", mockPathname);
      view.rerender(<DynamicHeadTitle />);
      expect(document.title).toBe("Main Stage | Brain");
      document.title = "Main Stage";
      await flushObservers();
      expect(document.title).toBe("Main Stage | Brain");

      // Returning to a drop through history gives metadata ownership again.
      mockSearchParams = new URLSearchParams("drop=first");
      window.history.replaceState({}, "", `${mockPathname}?drop=first`);
      document.title = "First submission by @artist";
      view.rerender(<DynamicHeadTitle />);
      await flushObservers();
      expect(document.title).toBe("First submission by @artist");
    } finally {
      view.unmount();
      window.history.replaceState({}, "", "/");
    }
  });

  it.each(["/network", "/waves/wave-1/competitions/competition-1"])(
    "keeps explicit title ownership outside wave metadata routes (%s)",
    (pathname) => {
      mockPathname = pathname;
      mockTitlePathname = pathname;
      mockSearchParams = new URLSearchParams("drop=first");
      mockIsTitleOwned = true;
      mockTitle = "Explicit page title";
      render(<DynamicHeadTitle />);
      expect(document.title).toBe("Explicit page title");
    }
  );

  it("stops re-asserting after unmount", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    mockTitlePathname = "/open-data/network-metrics";
    mockPathname = "/open-data/network-metrics";
    document.title = "Network Metrics";

    const { unmount } = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    unmount();
    document.title = "Network Metrics";
    await flushObservers();
    expect(document.title).toBe("Network Metrics");
  });
});
