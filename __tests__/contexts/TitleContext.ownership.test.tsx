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
  useTitle,
} from "@/contexts/TitleContext";

function TitleReporter() {
  const { title, isTitleOwned } = useTitle();
  return (
    <div>
      <span data-testid="title">{title}</span>
      <span data-testid="owned">{String(isTitleOwned)}</span>
    </div>
  );
}

function ExplicitTitleSetter({ pageTitle }: { readonly pageTitle: string }) {
  useSetTitle(pageTitle);
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
});
