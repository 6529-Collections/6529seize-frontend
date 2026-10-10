import TDHConsolidationPage from "@/app/network/tdh/consolidation/page.client";
import { generateMetadata } from "@/app/network/tdh/consolidation/page";
import { render, screen, within } from "@testing-library/react";
import React from "react";

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <div data-testid="contents-dropdown" />,
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

describe("TDHConsolidationPage", () => {
  it("renders the rules, the analysis tables and the simulator", () => {
    render(<TDHConsolidationPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Wallet consolidation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "The rules" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/October 15, 2026 at 00:00 UTC/).length
    ).toBeGreaterThan(0);

    const matrix = screen.getByRole("table", {
      name: /Whether an outside wallet can be added/,
    });
    const meshRow = within(matrix).getByRole("row", {
      name: /Every pair links both ways/,
    });
    expect(
      within(meshRow)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["No", "No", "No", "Yes"]);

    expect(
      screen.getByRole("button", { name: "D signs last" })
    ).toBeInTheDocument();
  });

  it("links every on-page navigation item to a section", () => {
    render(<TDHConsolidationPage />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    for (const link of within(nav).getAllByRole("link")) {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("uses a canonical consolidation path in its metadata", () => {
    const metadata = generateMetadata();
    expect(metadata.title).toContain("Wallet consolidation");
    expect(JSON.stringify(metadata)).toContain("/network/tdh/consolidation");
  });
});
