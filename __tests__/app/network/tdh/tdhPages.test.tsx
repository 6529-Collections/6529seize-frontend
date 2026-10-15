import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import FormalPage from "@/app/network/tdh/formal/page";
import HowItWorksPage from "@/app/network/tdh/how-it-works/page";
import ImplementationsPage from "@/app/network/tdh/implementations/page";
import SpecificationPage from "@/app/network/tdh/specification/page";
import VerificationDayPage from "@/app/network/tdh/verification/[cycleDay]/page";
import VerificationPage, {
  generateMetadata as generateVerificationMetadata,
} from "@/app/network/tdh/verification/page";

const notFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/network/tdh",
  useSearchParams: () => ({ get: () => null }),
  notFound: () => notFound(),
}));
jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useSetTitle: jest.fn(),
  useTitle: () => ({ setTitle: jest.fn() }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
  useOptionalCookieConsent: () => ({ country: "US" }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

function renderPage(element: ReactElement) {
  return render(element);
}

function sourceAnchors(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[data-tdh-source-href]")].map(
    (element) =>
      element.getAttribute("data-tdh-source-href")?.split("#")[1] ?? ""
  );
}

describe("TDH sub-pages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders How TDH is calculated with fourteen steps and live explorables", async () => {
    const user = userEvent.setup();
    renderPage(<HowItWorksPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "How TDH is calculated" })
    ).toBeInTheDocument();
    for (let step = 1; step <= 14; step += 1) {
      expect(document.getElementById(`step-${step}`)).not.toBeNull();
    }
    expect(
      screen.getByRole("navigation", { name: "TDH pages" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "TDH pages" })).getByRole(
        "link",
        { name: "How it works" }
      )
    ).toHaveAttribute("aria-current", "page");

    const builder = screen.getByRole("region", { name: "Boost builder" });
    expect(within(builder).getByText("Boost 1.02")).toBeInTheDocument();
    await user.click(
      within(builder).getByRole("button", { name: "Increase Gradients" })
    );
    expect(within(builder).getByText("Boost 1.04")).toBeInTheDocument();
    await user.click(
      within(builder).getByRole("button", { name: "Increase Full sets" })
    );
    expect(within(builder).getByText("Boost 1.84")).toBeInTheDocument();
    expect(
      within(builder).getByRole("checkbox", { name: /Season 2$/ })
    ).toBeDisabled();

    const household = screen.getByRole("region", {
      name: "Show the household",
    });
    expect(
      within(household).getByText(/tomorrow it rises by 114/)
    ).toBeInTheDocument();
    await user.click(
      within(household).getByRole("button", { name: "As two wallets" })
    );
    expect(
      within(household).getByText(/16,246 and 3,828, together 20,074/)
    ).toBeInTheDocument();
    await user.click(
      within(household).getByRole("button", { name: "Sell Gradient 2" })
    );
    expect(
      within(household).getByText(/18,880, down 1,589/)
    ).toBeInTheDocument();

    const rate = screen.getByRole("region", { name: "Rate explorer" });
    expect(within(rate).getByText("12.71")).toBeInTheDocument();

    const stack = screen.getByRole("region", { name: "Stack simulator" });
    expect(within(stack).getByText("Whole days: 30")).toBeInTheDocument();
    expect(
      within(stack).getByRole("checkbox", { name: /consolidated/ })
    ).not.toBeChecked();

    expect(screen.queryByText("Rule text being finalised")).toBeNull();
    expect(screen.getAllByText("In the specification").length).toBeGreaterThan(
      0
    );
    expect(
      screen.getByRole("link", { name: /Next Specification/ })
    ).toHaveAttribute("href", "/network/tdh/specification");
  });

  it("renders the specification with an anchor for every source chip on every TDH page", async () => {
    const pages = [
      render(<HowItWorksPage />),
      render(await ImplementationsPage()),
      render(await FormalPage()),
      render(await VerificationPage()),
    ];
    const cited = new Set(
      pages.flatMap(({ container }) => sourceAnchors(container))
    );
    pages.forEach(({ unmount }) => unmount());

    const { container } = renderPage(<SpecificationPage />);
    for (const anchor of new Set([...cited, ...sourceAnchors(container)])) {
      expect(container.querySelector(`[id="${anchor}"]`)).not.toBeNull();
    }
    for (let id = 1; id <= 19; id += 1) {
      expect(container.querySelector(`#dev-${id}`)).not.toBeNull();
    }
    for (let id = 1; id <= 15; id += 1) {
      expect(container.querySelector(`#bug-${id}`)).not.toBeNull();
    }
    expect(
      screen.getByText(
        "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3"
      )
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/github\.com/);
    expect(container.textContent).not.toMatch(/not yet in the text/);
    expect(container.textContent).toMatch(/every one of the 51 conformance/);
    expect(container.textContent).toMatch(/net\(w\) = the amount w receives/);
    expect(container.querySelector("#symbols")).not.toBeNull();
  });

  it("filters the specification's deviations", async () => {
    const user = userEvent.setup();
    renderPage(<SpecificationPage />);
    const filters = screen.getByRole("group", { name: "Filter differences" });
    await user.click(
      within(filters).getByRole("button", { name: "Can change values" })
    );
    expect(document.getElementById("dev-2")).not.toBeNull();
    expect(document.getElementById("dev-1")).toBeNull();
    await user.click(
      within(filters).getByRole("button", { name: "Kept as before" })
    );
    expect(document.getElementById("dev-10")).not.toBeNull();
    expect(document.getElementById("dev-2")).toBeNull();
  });

  it("shows the formal model's proved, checked and refuted statements", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(await FormalPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Formal model" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Planned")).toBeNull();
    expect(screen.queryByText("In progress")).toBeNull();
    expect(container.querySelectorAll('[data-tdh-pill="proved"]')).toHaveLength(
      8
    );
    expect(
      container.querySelectorAll('[data-tdh-pill="shownFalse"]')
    ).toHaveLength(3);
    expect(screen.getByText("51 / 51")).toBeInTheDocument();
    expect(screen.getByText("21,410")).toBeInTheDocument();
    expect(
      screen.getAllByText(/theorem replayHoldings_invariance/).length
    ).toBeGreaterThan(0);
    const toggle = screen.getByRole("button", {
      name: "Show the details of The first netting rule",
    });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("The first netting rule against the current one")
    ).toBeInTheDocument();
  });

  it("renders the implementations with the vector browser and the latest agreement", async () => {
    const user = userEvent.setup();
    renderPage(await ImplementationsPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Implementations" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Source to be published").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Rust and Python agree on 10,282 of 10,282 identities/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/run before the Rust core netted within a transaction/)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("All 51 vectors (976 checks)").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Inside one vector")).toBeInTheDocument();
    const filters = screen.getByRole("group", {
      name: "Filter vectors by topic",
    });
    await user.click(
      within(filters).getByRole("button", { name: /No result/ })
    );
    expect(
      screen.getByText("Conformance vectors, 10 of 51 shown")
    ).toBeInTheDocument();
    await user.click(within(filters).getByRole("button", { name: /Netting/ }));
    expect(
      screen.getByText("Conformance vectors, 16 of 51 shown")
    ).toBeInTheDocument();
  });

  it("renders the dashboard page and its permalinks, and 404s an unknown day", async () => {
    renderPage(await VerificationPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "TDH verification" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sample").length).toBeGreaterThan(0);

    renderPage(
      await VerificationDayPage({
        params: Promise.resolve({ cycleDay: "20740" }),
      })
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "TDH verification, October 14, 2026",
      })
    ).toBeInTheDocument();

    await expect(
      VerificationDayPage({ params: Promise.resolve({ cycleDay: "1" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      VerificationDayPage({ params: Promise.resolve({ cycleDay: "abc" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets the dashboard metadata", async () => {
    const metadata = await generateVerificationMetadata();
    expect(metadata.title).toBe("TDH verification | Network");
  });
});
