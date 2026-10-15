jest.mock("@/hooks/useConsolidationPolicy", () => ({
  useConsolidationPolicy: () => ({
    limits: { maxWallets: 4, ungatedMaxWallets: 3 },
    policy: {
      activationMs: Date.parse("2026-10-12T00:00:00Z"),
      signingOpensMs: Date.parse("2026-10-12T00:10:00Z"),
    },
  }),
}));
import TDHConsolidationDesignPage from "@/app/network/tdh/consolidation/design/page.client";
import { generateMetadata } from "@/app/network/tdh/consolidation/design/page";
import { render, screen, within } from "@testing-library/react";

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <div data-testid="contents-dropdown" />,
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

describe("TDHConsolidationDesignPage", () => {
  it("renders the rules, the analysis tables and the simulator", () => {
    render(<TDHConsolidationDesignPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How wallet consolidation works",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "The rules" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/October 12, 2026 at 00:00 UTC/).length
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

  it("points collectors back to the guide and the guided setup", () => {
    render(<TDHConsolidationDesignPage />);

    expect(
      screen.getByRole("link", { name: "Read the collector's guide" })
    ).toHaveAttribute("href", "/network/tdh/consolidation");
    expect(
      screen.getByRole("link", { name: "Open the guided setup" })
    ).toHaveAttribute("href", "/safe-collecting/build-consolidation");
  });

  it("links every on-page navigation item to a section", () => {
    render(<TDHConsolidationDesignPage />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    for (const link of within(nav).getAllByRole("link")) {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("uses its own canonical path in its metadata", () => {
    const metadata = generateMetadata();
    expect(metadata.title).toContain("How wallet consolidation works");
    expect(JSON.stringify(metadata)).toContain(
      "/network/tdh/consolidation/design"
    );
  });
});
