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
    expect(button.className).toMatch(/nextgenTokenDetailsLinkSelected/);
    expect(screen.getByText("About")).toHaveClass("font-color");
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
    expect(button.className).not.toMatch(/nextgenTokenDetailsLinkSelected/);
    expect(screen.getByText("Provenance")).toHaveClass(
      "font-color-h cursor-pointer"
    );
    fireEvent.click(button);
    expect(setView).toHaveBeenCalledWith(NextgenCollectionView.PROVENANCE);
  });
});
