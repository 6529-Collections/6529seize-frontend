import NextGenCollectionComponent, {
  printViewButton,
} from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NextgenCollectionView } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/app/nextgen/collection/[collection]/useShallowRedirect", () => ({
  useShallowRedirect: jest.fn(),
}));
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: jest.fn() }),
}));
jest.mock("@/components/nextGen/collections/NextGenNavigationHeader", () =>
  jest.fn(() => null)
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionArt",
  () => jest.fn(() => null)
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionArtist",
  () => jest.fn(() => null)
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionDetails",
  () =>
    jest.fn(({ view }: { view: NextgenCollectionView }) => (
      <div data-testid="collection-view">{view}</div>
    ))
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => jest.fn(() => null)
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow",
  () => jest.fn(() => null)
);

describe("printViewButton", () => {
  it("highlights current view and triggers setView on click", () => {
    const setView = jest.fn();
    render(
      printViewButton(
        NextgenCollectionView.ABOUT,
        NextgenCollectionView.ABOUT,
        setView
      )
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-current", "page");
    expect(button).toHaveClass("tw-border-primary-400", "tw-text-white");
    fireEvent.click(button);
    expect(setView).toHaveBeenCalledWith(NextgenCollectionView.ABOUT);
  });

  it("renders unselected state and calls setView with provided value", () => {
    const setView = jest.fn();
    render(
      printViewButton(
        NextgenCollectionView.ABOUT,
        NextgenCollectionView.PROVENANCE,
        setView
      )
    );
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-current");
    expect(button).toHaveClass("tw-border-transparent", "tw-text-iron-400");
    fireEvent.click(button);
    expect(setView).toHaveBeenCalledWith(NextgenCollectionView.PROVENANCE);
  });
});

describe("NextGenCollectionComponent navigation", () => {
  it("reads the view after a view-named collection slug on popstate", () => {
    window.history.replaceState(
      {},
      "",
      "/nextgen/collection/provenance/provenance"
    );
    render(
      <NextGenCollectionComponent
        collection={{ name: "Provenance", mint_count: 0 } as any}
        initialView={NextgenCollectionView.PROVENANCE}
      />
    );

    expect(screen.getByTestId("collection-view")).toHaveTextContent(
      NextgenCollectionView.PROVENANCE
    );

    window.history.replaceState({}, "", "/nextgen/collection/provenance");
    fireEvent.popState(window);

    expect(screen.getByTestId("collection-view")).toHaveTextContent(
      NextgenCollectionView.OVERVIEW
    );
  });
});
