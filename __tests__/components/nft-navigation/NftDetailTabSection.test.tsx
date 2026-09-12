import { act, render, screen } from "@testing-library/react";
import { lazy, Suspense } from "react";
import NftDetailTabSection from "@/components/nft-navigation/NftDetailTabSection";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

it.each(SUPPORTED_LOCALES)(
  "keeps navigation and focus mounted while the next panel loads in %s",
  async (locale) => {
    let finishLoading: (module: { default: () => React.JSX.Element }) => void;
    const PendingPanel = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((resolve) => {
          finishLoading = resolve;
        })
    );
    const scrollIntoView = jest.spyOn(HTMLElement.prototype, "scrollIntoView");
    const page = (focus: string) => (
      <Suspense fallback={<div>Entire page loading</div>}>
        <div>Artwork viewer</div>
        <NftDetailTabSection
          activeFocus={focus}
          locale={locale}
          navigation={<button type="button">Details</button>}
        >
          {focus === "live" ? <div>Overview content</div> : <PendingPanel />}
        </NftDetailTabSection>
      </Suspense>
    );
    const { rerender } = render(page("live"));
    expect(scrollIntoView).not.toHaveBeenCalled();
    const tab = screen.getByRole("button", { name: "Details" });
    tab.focus();
    rerender(page("the-art"));

    expect(tab).toHaveFocus();
    expect(screen.getByText("Artwork viewer")).toBeVisible();
    expect(screen.queryByText("Entire page loading")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading section…");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "instant",
    });

    await act(async () => {
      finishLoading({ default: () => <div>Properties</div> });
    });
    expect(screen.getByText("Properties")).toBeVisible();
    expect(tab).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    rerender(page("the-art"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    scrollIntoView.mockRestore();
  }
);
