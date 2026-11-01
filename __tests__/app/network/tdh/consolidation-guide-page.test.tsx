import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TdhYourWalletsPage, {
  generateMetadata,
} from "@/app/network/tdh/consolidation/page";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * 2 Your wallets (TDH-DESIGN.md §4.3, §5.8, §5.9): why a number changed
 * first, the four-wallet rule with its model, the safe way to add a fourth
 * wallet, and every anchor of the old consolidation guide.
 */
jest.mock("@/lib/explained/feed.server", () => ({
  loadFactBook: async () => createFactBook(fixtureFactInputs()),
}));

async function renderPage(locale?: string) {
  return render(
    await TdhYourWalletsPage({
      searchParams: Promise.resolve(locale ? { locale } : {}),
    })
  );
}

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("Your wallets", () => {
  it("opens on the rule, decided and live, with the guided setup", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Up to four wallets count as one collector.",
      })
    ).toBeInTheDocument();
    expect(document.querySelector("[data-ex-lede]")).toHaveTextContent(
      "A fourth needs fresh links, made on or after October 15, 2026."
    );
    // In the hero, and again where the page says how to add a wallet.
    const setups = screen.getAllByRole("link", { name: "Start guided setup" });
    expect(setups).toHaveLength(2);
    for (const setup of setups) {
      expect(setup).toHaveAttribute(
        "href",
        "/safe-collecting/build-consolidation"
      );
    }
    expect(
      screen.getAllByRole("link", { name: "Explain my TDH" })[0]
    ).toHaveAttribute("href", "/network/tdh#explain");
    for (const id of [
      "why",
      "four",
      "add",
      "before",
      "faq",
      "consolidation-status",
      "consolidation-benefits",
      "consolidation-wallets",
      "consolidation-steps",
      "consolidation-before",
      "consolidation-change",
      "consolidation-faq",
      "consolidation-under",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("answers one cause at a time: a move, by default, with its picture", async () => {
    const user = userEvent.setup();
    await renderPage();
    const why = document.getElementById("why")!;
    const answer = (key: string) =>
      why.querySelector<HTMLElement>(`[data-ans="${key}"]`)!;
    expect(answer("moved")).toBeVisible();
    expect(answer("added")).not.toBeVisible();
    expect(
      within(answer("moved")).getByRole("img", {
        name: "A linked with B, B linked with C, but A and C not linked: B + C; A alone.",
      })
    ).toBeInTheDocument();
    await user.click(
      within(why).getByRole("button", { name: "I added a wallet" })
    );
    expect(answer("added")).toBeVisible();
    expect(answer("moved")).not.toBeVisible();
    expect(
      within(answer("added")).getByRole("link", { name: "how" })
    ).toHaveAttribute("href", "#add");
  });

  it("groups wallets with the engine, and Break it links a fifth", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = document.querySelector<HTMLElement>('[data-lens="wallets"]')!;
    const groups = () =>
      model.querySelector("[data-readout-groups]")?.textContent;
    expect(groups()).toBe("B + C; A alone");
    const preset = (value: string) =>
      model.querySelector<HTMLElement>(`[data-preset="${value}"]`)!;
    await user.click(preset("step1"));
    expect(groups()).toBe("A + D, B + C");
    expect(model).toHaveTextContent("The three are split");
    await user.click(preset("step2"));
    expect(groups()).toBe("A + B + D; C alone");
    await user.click(preset("batch"));
    expect(groups()).toBe("A + B + C + D");
    expect(model).toHaveTextContent("No split.");
    await user.click(preset("oldfour"));
    expect(model).toHaveTextContent("Only three count together.");
    const breakIt = model.querySelector<HTMLElement>('[data-break="five"]')!;
    await user.click(breakIt);
    expect(groups()).toBe("B + C + D + E; A alone");
    expect(model).toHaveAttribute("data-broken", "1");
    expect(
      model.querySelector('[data-wallet="A"] circle')?.getAttribute("stroke")
    ).toBe("#F97066");
    await user.click(breakIt);
    expect(model).toHaveAttribute("data-broken", "0");
    expect(model).toHaveTextContent("Only three count together.");
  });

  it("shows the safe order and the cost, and keeps closed answers out of view", async () => {
    await renderPage();
    const add = document.getElementById("add")!;
    expect(
      within(add).getByRole("figure", { name: "The safe signing order" })
    ).toHaveTextContent("D → A, B, C");
    expect(add).toHaveTextContent(
      "Four transactions, each with a normal network fee"
    );
    const faq = document.getElementById("faq")!;
    const details = faq.querySelectorAll("details");
    expect(details).toHaveLength(5);
    expect(details[0]).toHaveAttribute("open");
    expect(details[2]).toHaveTextContent(
      "I set up four wallets before Oct 15."
    );
    expect(
      within(faq).getByRole("link", {
        name: "Under the hood: why every pair must link both ways",
      })
    ).toHaveAttribute("href", "/network/tdh/consolidation/design");
  });

  it("renders in French", async () => {
    await renderPage("fr-FR");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Jusqu'à quatre wallets comptent pour un seul collectionneur.",
      })
    ).toBeInTheDocument();
  });

  it("sets its metadata", () => {
    expect(generateMetadata()).toMatchObject({
      title: expect.stringContaining("Your wallets"),
    });
  });
});
