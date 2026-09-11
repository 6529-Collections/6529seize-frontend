import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NextgenView } from "@/types/enums";
import { render, screen, within } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt ?? ""} />,
}));

jest.mock("@/components/collections-dropdown/CollectionsDropdown", () => ({
  __esModule: true,
  default: ({ triggerContent }: any) => (
    <div data-testid="collections-dropdown">{triggerContent}</div>
  ),
}));

jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => <button type="button">LFG: Start the Show!</button>,
}));

describe("NextGenNavigationHeader", () => {
  it("uses responsive Tailwind sizing for the collection logo and controls", () => {
    render(<NextGenNavigationHeader />);

    const mobileLogo = within(
      screen.getByTestId("collections-dropdown")
    ).getByAltText("NextGen");
    expect(mobileLogo).toHaveClass(
      "tw-w-[140px]",
      "tw-max-w-[38vw]",
      "sm:tw-w-[250px]"
    );

    const controlRow = screen.getByTestId("collections-dropdown").parentElement
      ?.parentElement;
    expect(controlRow).toHaveClass(
      "tw-flex",
      "tw-w-full",
      "tw-justify-between",
      "sm:tw-w-auto",
      "sm:tw-justify-start"
    );
    expect(
      screen.getByRole("button", { name: "LFG: Start the Show!" }).parentElement
    ).toHaveClass("tw-shrink-0");
  });

  it("renders semantic links for every NextGen section", () => {
    render(<NextGenNavigationHeader />);

    const navigation = screen.getByRole("navigation", {
      name: "NextGen sections",
    });
    expect(
      within(navigation).getByRole("link", { name: "Featured" })
    ).toHaveAttribute("href", "/nextgen");
    expect(
      within(navigation).getByRole("link", { name: "Collections" })
    ).toHaveAttribute("href", "/nextgen/collections");
    expect(
      within(navigation).getByRole("link", { name: "Artists" })
    ).toHaveAttribute("href", "/nextgen/artists");
    expect(
      within(navigation).getByRole("link", { name: "About" })
    ).toHaveAttribute("href", "/nextgen/about");
  });

  it("marks the current home view as active", () => {
    render(
      <NextGenNavigationHeader view={NextgenView.ARTISTS} setView={jest.fn()} />
    );

    expect(screen.getByRole("link", { name: "Artists" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Featured" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
