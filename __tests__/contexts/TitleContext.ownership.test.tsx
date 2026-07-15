import { act, render, screen } from "@testing-library/react";
import React from "react";

const mockNavigation = {
  pathname: "/open-data/network-metrics",
  searchParams: new URLSearchParams(),
};
let mockActiveWaveId: string | null = null;

jest.mock("next/navigation", () => ({
  usePathname: () => mockNavigation.pathname,
  useSearchParams: () => mockNavigation.searchParams,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () =>
    mockActiveWaveId
      ? {
          activeWave: {
            id: mockActiveWaveId,
            set: jest.fn(),
          },
        }
      : null,
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

function WaveDataSetter({
  waveId = "wave-1",
  newItemsCount = 0,
}: {
  readonly waveId?: string | null;
  readonly newItemsCount?: number;
}) {
  useSetWaveData(
    waveId ? { id: waveId, name: "Wave One", newItemsCount } : null
  );
  return null;
}

describe("TitleProvider ownership", () => {
  beforeEach(() => {
    mockNavigation.pathname = "/open-data/network-metrics";
    mockNavigation.searchParams = new URLSearchParams();
    mockActiveWaveId = null;
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
    expect(screen.getByTestId("title").textContent).toBe("Downloads | Network");
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

  it("does not let stale wave data own the waves index after navigation", () => {
    mockNavigation.pathname = "/waves/wave-1";

    const view = render(
      <TitleProvider>
        <WaveDataSetter />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");

    act(() => {
      mockNavigation.pathname = "/waves";
    });
    view.rerender(
      <TitleProvider>
        <WaveDataSetter />
        <TitleReporter />
      </TitleProvider>
    );

    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Waves | Brain");
  });

  it("only lets data for the URL wave own a wave route title", () => {
    mockNavigation.pathname = "/waves/wave-2";

    const view = render(
      <TitleProvider>
        <WaveDataSetter waveId="wave-1" />
        <TitleReporter />
      </TitleProvider>
    );

    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Waves | Brain");

    view.rerender(
      <TitleProvider>
        <WaveDataSetter waveId="wave-2" />
        <TitleReporter />
      </TitleProvider>
    );

    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe("Wave One | Brain");
  });

  it("clears the previous wave title data while the destination is loading", () => {
    mockNavigation.pathname = "/waves/wave-1";

    const view = render(
      <TitleProvider>
        <WaveDataSetter newItemsCount={3} />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("title").textContent).toBe(
      "(3 new messages) Wave One | Brain"
    );

    view.rerender(
      <TitleProvider>
        <WaveDataSetter waveId={null} />
        <TitleReporter />
      </TitleProvider>
    );

    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Waves | Brain");
  });

  it("matches wave data against the active-wave fallback on the root view", () => {
    mockNavigation.pathname = "/";
    mockNavigation.searchParams = new URLSearchParams("view=waves");
    mockActiveWaveId = "wave-1";

    const view = render(
      <TitleProvider>
        <WaveDataSetter waveId="wave-2" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("6529.io");

    view.rerender(
      <TitleProvider>
        <WaveDataSetter waveId="wave-1" />
        <TitleReporter />
      </TitleProvider>
    );
    expect(screen.getByTestId("owned").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe("Wave One | Brain");
  });
});
