import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TdhConsolidationDesignPage, {
  generateMetadata,
} from "@/app/network/tdh/consolidation/design/page";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * Shelf S3, Consolidation design (TDH-DESIGN.md §4.7): registrations pair
 * by pair, the signing order starting on "D signs last", what the rule
 * protects and does not, and the old anchors.
 */
jest.mock("@/lib/explained/feed.server", () => ({
  loadFactBook: async () => createFactBook(fixtureFactInputs()),
}));

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("Consolidation design", () => {
  it("counts the registrations pair by pair from the registry", async () => {
    render(
      await TdhConsolidationDesignPage({ searchParams: Promise.resolve({}) })
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Why every pair of wallets links both ways",
      })
    ).toBeInTheDocument();
    expect(document.querySelector("[data-ex-lede]")?.textContent).not.toMatch(
      /\.\s+\S/
    );
    const article = document.querySelector<HTMLElement>("[data-ex-article]")!;
    expect(article).toHaveTextContent(
      "registers a consolidation in both directions in 6529's delegation contract, where consolidation is use case 999, on Any Collection or The Memes. Two wallets need 2 registrations, three need 6, and four need 12."
    );
    expect(article).toHaveTextContent("for four, the fourth's from Oct 15");
    expect(within(article).getByText("S3")).toBeInTheDocument();
    for (const id of [
      "consolidation-rules",
      "consolidation-add",
      "consolidation-order",
      "consolidation-remove",
      "consolidation-why",
      "consolidation-protects",
      "consolidation-start",
      "consolidation-tested",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("starts the signing order on D's batch, and one link at a time splits", async () => {
    const user = userEvent.setup();
    render(
      await TdhConsolidationDesignPage({ searchParams: Promise.resolve({}) })
    );
    const model = document.querySelector<HTMLElement>('[data-lens="wallets"]')!;
    expect(model).toHaveAccessibleName("The signing order");
    expect(model.querySelector("[data-readout-groups]")).toHaveTextContent(
      "A + B + C + D"
    );
    await user.click(within(model).getByRole("button", { name: "D–A first" }));
    expect(model.querySelector("[data-readout-groups]")).toHaveTextContent(
      "A + D, B + C"
    );
  });

  it("names what the rule protects and what it does not", async () => {
    render(
      await TdhConsolidationDesignPage({ searchParams: Promise.resolve({}) })
    );
    const box = document.querySelector<HTMLElement>("[data-honest]")!;
    expect(box).toHaveTextContent("It protects");
    expect(box).toHaveTextContent("It does not");
    expect(box.querySelectorAll('[data-glyph="tested"]')).toHaveLength(2);
    expect(box.querySelectorAll('[data-glyph="notGuaranteed"]')).toHaveLength(
      2
    );
    expect(screen.getByText(/100,000/).closest("[data-fact]")).not.toBeNull();
  });

  it("sets its metadata", () => {
    expect(generateMetadata()).toMatchObject({
      title: expect.stringContaining("Consolidation design"),
    });
  });
});
