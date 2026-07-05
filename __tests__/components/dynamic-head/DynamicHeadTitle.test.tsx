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

const flushObservers = async () => {
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
