import { TitleProvider, useSetTitle, useTitle } from "@/contexts/TitleContext";
import type { SupportedLocale } from "@/i18n/locales";
import { act, render, screen, waitFor } from "@testing-library/react";

let mockLocale: SupportedLocale = "en-US";

jest.mock("next/navigation", () => ({
  usePathname: () => "/network",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => null,
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");

  return {
    ...actual,
    t: (
      locale: SupportedLocale,
      key: Parameters<typeof actual.t>[1],
      params?: Parameters<typeof actual.t>[2]
    ) =>
      key === "titleContext.routes.network"
        ? `${locale} Network`
        : actual.t(locale, key, params),
  };
});

function TitleReporter() {
  const { title } = useTitle();
  return <span data-testid="title">{title}</span>;
}

function ExplicitTitle() {
  useSetTitle("Custom Network Title");
  return null;
}

describe("TitleProvider locale changes", () => {
  beforeEach(() => {
    mockLocale = "en-US";
  });

  it("recomputes a route-default title when the browser locale changes", async () => {
    const view = render(
      <TitleProvider>
        <TitleReporter />
      </TitleProvider>
    );

    expect(screen.getByTestId("title")).toHaveTextContent("en-US Network");

    act(() => {
      mockLocale = "de-DE";
    });
    view.rerender(
      <TitleProvider>
        <TitleReporter />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("title")).toHaveTextContent("de-DE Network")
    );
  });

  it("preserves an explicitly owned title when the locale changes", async () => {
    const view = render(
      <TitleProvider>
        <ExplicitTitle />
        <TitleReporter />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("title")).toHaveTextContent(
        "Custom Network Title"
      )
    );

    act(() => {
      mockLocale = "de-DE";
    });
    view.rerender(
      <TitleProvider>
        <ExplicitTitle />
        <TitleReporter />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("title")).toHaveTextContent(
        "Custom Network Title"
      )
    );
  });
});
