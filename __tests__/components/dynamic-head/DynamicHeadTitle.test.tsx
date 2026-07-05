import { render, waitFor } from "@testing-library/react";
import React from "react";

let mockTitle = "6529.io";
let mockIsTitleOwned = false;
let mockPathname = "/network";

jest.mock("@/contexts/TitleContext", () => ({
  DEFAULT_TITLE: "6529.io",
  useTitle: () => ({ title: mockTitle, isTitleOwned: mockIsTitleOwned }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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
    mockPathname = "/network";
  });

  it("re-asserts an owned title after a later head commit overwrites it", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
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
    mockPathname = "/";
    document.title = "Something Else";

    render(<DynamicHeadTitle />);
    expect(document.title).toBe("6529.io");

    document.title = "Something Else";
    await waitFor(() => expect(document.title).toBe("6529.io"));
  });

  it("releases the title to the next route's metadata on navigation", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    document.title = "Network Metrics";

    const view = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    // Client-side navigation: ownership evaporates in the same render
    // (pathname-keyed), before the provider's reset effect would run.
    mockTitle = "Open Data | Tools";
    mockIsTitleOwned = false;
    mockPathname = "/open-data";
    view.rerender(<DynamicHeadTitle />);

    // The next route's metadata commit must win without a fight.
    document.title = "Open Data";
    await flushObservers();
    expect(document.title).toBe("Open Data");
  });

  it("restores the new context title once when ownership is released on the same pathname", async () => {
    mockTitle = "Wave One | Brain";
    mockIsTitleOwned = true;
    document.title = "Messages";

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

  it("stops re-asserting after unmount", async () => {
    mockTitle = "Network Metrics | Open Data";
    mockIsTitleOwned = true;
    document.title = "Network Metrics";

    const { unmount } = render(<DynamicHeadTitle />);
    expect(document.title).toBe("Network Metrics | Open Data");

    unmount();
    document.title = "Network Metrics";
    await flushObservers();
    expect(document.title).toBe("Network Metrics");
  });
});
