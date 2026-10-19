jest.mock("@/hooks/useConsolidationPolicy", () => ({
  useConsolidationPolicy: () => ({
    limits: { maxWallets: 4, ungatedMaxWallets: 3 },
    policy: {
      activationMs: Date.parse("2026-10-12T00:00:00Z"),
      signingOpensMs: Date.parse("2026-10-12T00:10:00Z"),
    },
  }),
}));
import TDHConsolidationPage from "@/app/network/tdh/consolidation/page.client";
import { generateMetadata } from "@/app/network/tdh/consolidation/page";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <div data-testid="contents-dropdown" />,
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

describe("TDHConsolidationPage (collector's guide)", () => {
  it("leads with the benefit and the guided setup", () => {
    render(<TDHConsolidationPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Combine your wallets" })
    ).toBeInTheDocument();
    const setupLinks = screen.getAllByRole("link", {
      name: /Start guided setup/,
    });
    expect(setupLinks.length).toBeGreaterThan(0);
    for (const link of setupLinks) {
      expect(link).toHaveAttribute(
        "href",
        "/safe-collecting/build-consolidation"
      );
    }
    expect(
      screen.getByRole("figure", {
        name: "Up to four of your wallets count as one collector",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The fourth requires fresh links from October 12, 2026/)
    ).toBeInTheDocument();
  });

  it("explains the benefits, the wallet roles and the steps in plain words", () => {
    render(<TDHConsolidationPage />);

    for (const heading of [
      "Your vault stays cold",
      "Your TDH adds up",
      "Sets count across wallets",
      "Keep the TDH of old wallets",
      "List your wallets",
      "Follow the signing steps",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading })
      ).toBeInTheDocument();
    }
    expect(screen.getAllByText("Transaction wallet").length).toBeGreaterThan(0);
    expect(screen.queryByText(/use case 999/)).not.toBeInTheDocument();
    expect(screen.queryByText(/batchDelegations/)).not.toBeInTheDocument();
  });

  it("links to the technical design page", () => {
    render(<TDHConsolidationPage />);

    expect(
      screen.getByRole("link", { name: /Read how it works/ })
    ).toHaveAttribute("href", "/network/tdh/consolidation/design");
  });

  it("describes the guide in its metadata", () => {
    const metadata = generateMetadata();
    expect(metadata.title).toContain("Combine your wallets");
    expect(JSON.stringify(metadata)).toContain("/network/tdh/consolidation");
  });
});
