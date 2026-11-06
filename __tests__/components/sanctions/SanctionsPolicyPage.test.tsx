jest.mock("server-only", () => ({}), { virtual: true });

import SanctionsPolicyPage from "@/components/sanctions/SanctionsPolicyPage";

const SANCTIONS_CONTACT_EMAIL = "support@6529.io";
const OFAC_REMOVAL_URL =
  "https://ofac.treasury.gov/specially-designated-nationals-list-sdn-list/filing-a-petition-for-removal-from-an-ofac-list";
const SANCTIONS_LIST_DOWNLOAD_PATH = "/sanctions/sanctions-list.v1.json";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { buildSanctionsPageModel } from "@/lib/sanctions/sanctions-page-model";
import { loadSanctionsSnapshot } from "@/lib/sanctions/sanctions-snapshot.server";
import { fireEvent, render, screen, within } from "@testing-library/react";

const loaded = loadSanctionsSnapshot();

function renderPage(asOf = "2026-11-06") {
  return render(
    <SanctionsPolicyPage
      locale={DEFAULT_LOCALE}
      model={buildSanctionsPageModel(loaded.list, asOf)}
      sha256={loaded.sha256}
      cid={loaded.cid}
      builtOn={loaded.builtOn}
      preview={loaded.preview}
    />
  );
}

describe("SanctionsPolicyPage", () => {
  it("explains places, wallet addresses and the list in that order", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How 6529 follows sanctions laws",
      })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual(["Places", "Wallet addresses", "The list"]);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
    ).toEqual(["#sanctions-places", "#sanctions-wallets", "#sanctions-list"]);
  });

  it("names every comprehensively sanctioned place", () => {
    renderPage();
    const places = screen.getByRole("region", { name: "Places" });
    for (const place of [
      "Cuba",
      "Iran",
      "North Korea",
      "The Crimea region of Ukraine, including Sevastopol",
      "The Donetsk and Luhansk regions of Ukraine",
    ]) {
      expect(within(places).getByText(place)).toBeInTheDocument();
    }
  });

  it("states the wallet policy and the appeal paths", () => {
    renderPage();
    const wallets = screen.getByRole("region", { name: "Wallet addresses" });
    expect(
      within(wallets).getByText(/whole profile is affected/)
    ).toBeInTheDocument();
    expect(within(wallets).getByText(/carries no rights/)).toBeInTheDocument();
    expect(within(wallets).getByText(/can't sign in/)).toBeInTheDocument();
    expect(
      within(wallets).getByText(/only orders still in force/)
    ).toBeInTheDocument();
    expect(
      within(wallets).getAllByRole("link", { name: SANCTIONS_CONTACT_EMAIL })[0]
    ).toHaveAttribute("href", `mailto:${SANCTIONS_CONTACT_EMAIL}`);
    expect(
      within(wallets).getByRole("link", { name: "how to request removal" })
    ).toHaveAttribute("href", OFAC_REMOVAL_URL);
  });

  it("shows the verification details and a download of the exact bytes", () => {
    renderPage();
    expect(screen.getByText(loaded.sha256)).toBeInTheDocument();
    expect(screen.getByText(loaded.cid)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download the list (JSON)" })
    ).toHaveAttribute("href", SANCTIONS_LIST_DOWNLOAD_PATH);
    expect(screen.getByText(/preview snapshot/)).toBeInTheDocument();
  });

  it("groups addresses by jurisdiction with lapsed Israeli orders kept apart", () => {
    renderPage();
    const list = screen.getByRole("region", { name: "The list" });
    const groupHeadings = within(list)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(groupHeadings.slice(1)).toEqual([
      "United States",
      "United Kingdom",
      "European Union",
      "Switzerland",
      "Japan",
      "South Korea",
      "Israel",
      "Israel: lapsed orders, Lapsed, not enforced",
      "Canada",
    ]);
    expect(
      within(list).getByText(
        "This list currently includes no wallet addresses."
      )
    ).toBeInTheDocument();
  });

  it("filters the list and announces the result", () => {
    renderPage();
    const search = screen.getByRole("searchbox", { name: "Search the list" });
    const target = loaded.list.addresses[0]?.address ?? "";
    expect(target).toMatch(/^0x/);
    fireEvent.change(search, {
      target: { value: target.slice(2, 12).toUpperCase() },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      /matching entr(y|ies)/
    );
    expect(screen.getAllByText(target).length).toBeGreaterThan(0);

    fireEvent.change(search, {
      target: { value: "0x54a71549cc3bb5fbfe851226e1bb920ad4f5415e" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("1 matching entry");

    fireEvent.change(search, { target: { value: "no-such-entry" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "No entries match your search."
    );
  });
});
