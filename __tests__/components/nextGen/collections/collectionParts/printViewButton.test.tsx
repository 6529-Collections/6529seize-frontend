import { printViewButton } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NextgenCollectionView } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";

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
