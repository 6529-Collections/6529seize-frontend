import { render, screen, waitFor, within } from "@testing-library/react";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";

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
  const originalInnerWidth = globalThis.innerWidth;

  afterEach(() => {
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("keeps the mobile logo and LFG button on one row", async () => {
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 500,
    });

    render(<NextGenNavigationHeader />);

    await waitFor(() => {
      const logo = within(
        screen.getByTestId("collections-dropdown")
      ).getByAltText("nextgen");
      expect(logo.getAttribute("style")).toContain("width: 140px");
      expect(logo.getAttribute("style")).toContain("max-width: 38vw");
    });

    const row = screen.getByTestId("collections-dropdown").parentElement
      ?.parentElement;
    expect(row).toHaveClass("flex-nowrap", "justify-content-between", "w-100");
    expect(row).not.toHaveClass("flex-wrap");
    expect(
      screen.getByRole("button", { name: "LFG: Start the Show!" }).parentElement
    ).toHaveClass("flex-shrink-0");
    expect(screen.getByText("Featured").closest("span")).not.toHaveClass(
      "flex-wrap"
    );
    expect(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    ).toBeInTheDocument();
  });

  it("moves tabs to their own row before the mobile logo breakpoint", async () => {
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 1000,
    });

    render(<NextGenNavigationHeader />);

    await waitFor(() => {
      const row = screen.getByTestId("collections-dropdown").parentElement
        ?.parentElement;
      expect(row).toHaveClass("flex-nowrap", "justify-content-start", "w-100");
      expect(row).not.toHaveClass("justify-content-between");
      expect(row?.parentElement).toHaveClass("flex-column");
    });

    const logo = within(
      screen.getByTestId("collections-dropdown")
    ).getByAltText("nextgen");
    expect(logo.getAttribute("style")).toContain("width: 250px");
    expect(
      screen.getByRole("button", { name: "LFG: Start the Show!" }).parentElement
    ).toHaveClass("flex-shrink-0");
    expect(screen.getByText("Featured").closest("span")).not.toHaveClass(
      "flex-wrap"
    );
  });
});
