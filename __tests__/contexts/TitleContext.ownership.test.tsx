import { act, render, screen } from "@testing-library/react";
import React from "react";

const mockNavigation = {
  pathname: "/open-data/network-metrics",
  searchParams: new URLSearchParams(),
};

jest.mock("next/navigation", () => ({
  usePathname: () => mockNavigation.pathname,
  useSearchParams: () => mockNavigation.searchParams,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => null,
}));

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.io" },
}));

import {
  TitleProvider,
  useSetTitle,
  useSetWaveData,
  useTitle,
} from "@/contexts/TitleContext";

function TitleReporter() {
  const { title, isTitleOwned, titlePathname } = useTitle();
  return (
    <div>
      <span data-testid="title">{title}</span>
      <span data-testid="owned">{String(isTitleOwned)}</span>
      <span data-testid="title-pathname">{titlePathname}</span>
    </div>
  );
}

function ExplicitTitleSetter({ pageTitle }: { readonly pageTitle: string }) {
  useSetTitle(pageTitle);
  return null;
}

function WaveDataSetter() {
  useSetWaveData({ name: "Wave One", newItemsCount: 0 });
  return null;
}

describe("TitleProvider ownership", () => {
  beforeEach(() => {
    mockNavigation.pathname = "/open-data/network-metrics";
    mockNavigation.searchParams = new URLSearchParams();
  });

  it("route defaults are not owned; explicit titles are", () => {
    const view = render(
      <TitleProvider>
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Open Data | Tools");

    view.rerender(
      <TitleProvider>
        <ExplicitTitleSetter pageTitle="Network Metrics | Open Data" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe(
      "Network Metrics | Open Data"
    );
  });

  it("ownership resets when the pathname changes", () => {
    const view = render(
      <TitleProvider>
        <ExplicitTitleSetter pageTitle="Network Metrics | Open Data" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");

    act(() => {
      mockNavigation.pathname = "/network";
    });
    view.rerender(
      <TitleProvider>
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Network");
  });

  it("a mounted setter re-claims after the pathname-change reset", () => {
    const view = render(
      <TitleProvider>
        <ExplicitTitleSetter pageTitle="Downloads | Open Data" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title-pathname").textContent).toBe(
      "/open-data/network-metrics"
    );

    // The setter survives the navigation: the provider's reset effect clears
    // the old claim, then the setter's effect re-claims for the new route.
    act(() => {
      mockNavigation.pathname = "/network";
    });
    view.rerender(
      <TitleProvider>
        <ExplicitTitleSetter pageTitle="Downloads | Network" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe(
      "Downloads | Network"
    );
    expect(screen.getByTestId("title-pathname").textContent).toBe("/network");
  });

  it("wave data owns the title on wave routes", () => {
    mockNavigation.pathname = "/messages";
    mockNavigation.searchParams = new URLSearchParams("wave=wave-1");

    render(
      <TitleProvider>
        <WaveDataSetter />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe("Wave One | Brain");
  });
});
