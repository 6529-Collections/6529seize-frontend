import {
  limits,
  policy,
} from "@/__tests__/helpers/consolidation-policy.fixture";
import TapGuide from "@/components/delegation/tap-guide/TapGuide";
import { render, screen, within } from "@testing-library/react";

let mockHideNftPurchasing = false;
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({
    hideNftPurchasing: mockHideNftPurchasing,
    shouldRedirect: false,
  }),
}));

let mockLimits: typeof limits | null = limits;
let mockPolicy: typeof policy | null = policy;
jest.mock("@/hooks/useConsolidationPolicy", () => ({
  useConsolidationPolicy: () => ({
    policy: mockPolicy,
    limits: mockLimits,
    isLoading: false,
  }),
}));

describe("TapGuide", () => {
  beforeEach(() => {
    mockHideNftPurchasing = false;
    mockPolicy = policy;
    mockLimits = limits;
  });

  it("dates the fourth wallet from the backend consolidation settings", () => {
    render(<TapGuide />);
    expect(
      screen.getByText(
        "You can combine up to 4 wallets. The fourth can be added from October 15, 2026."
      )
    ).toBeInTheDocument();
  });

  it("points to Guided Setup while the consolidation settings are unavailable", () => {
    mockPolicy = null;
    render(<TapGuide />);
    expect(
      screen.getByText(
        "You can combine up to 4 wallets. The fourth can be added from the start time shown in Guided Setup."
      )
    ).toBeInTheDocument();
  });

  it("leads with the protocol, the one rule and the setup button", () => {
    render(<TapGuide />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The Three Address Protocol",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Never connect a wallet that holds your NFTs to a link you saw on X or Discord."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Set up your wallets" })
    ).toHaveAttribute("href", "/safe-collecting#safe-setup");
    expect(
      screen.getByRole("link", { name: "Combine your wallets" })
    ).toHaveAttribute("href", "/network/tdh/consolidation");
  });

  it("keeps headings in order", () => {
    render(<TapGuide />);

    const sectionHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(sectionHeadings).toEqual([
      "Three wallets, three jobs",
      "The fourth wallet: old addresses",
      "Hardware wallets are a separate thing",
      "Good TAP and great TAP",
      "How 6529 makes TAP painless",
      "Worth knowing",
      "Learn more",
    ]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("explains the three wallet roles with their rules", () => {
    render(<TapGuide />);

    for (const [name, temperature] of [
      ["Vault", "Ice-cold"],
      ["Transaction wallet", "Warm"],
      ["Social wallet", "Hot"],
    ] as const) {
      const heading = screen.getByRole("heading", { level: 3, name });
      const card = heading.closest("li");
      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getByText(temperature)).toBeVisible();
      expect(within(card as HTMLElement).getByText("Holds")).toBeVisible();
      expect(
        within(card as HTMLElement).getByText("Connects to")
      ).toBeVisible();
    }
    expect(
      screen.getByText(
        "Never mint from it. If you mint from it, it is not a vault."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Great TAP is how 6529 runs.")).toBeInTheDocument();
  });

  it("links each 6529 tool and the reference pages", () => {
    render(<TapGuide />);

    for (const [name, href] of [
      ["Start guided setup", "/safe-collecting/build-consolidation"],
      ["Appoint a manager", "/safe-collecting/register-sub-delegation"],
      ["Register a delegation", "/safe-collecting/register-delegation"],
      ["See the setup steps", "/safe-collecting#safe-setup"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    for (const [name, href] of [
      [/Using a SAFE/, "/safe-collecting/faq/using-safe"],
      [/FAQ/, "/safe-collecting/faq"],
      [/Wallet Checker/, "/safe-collecting/wallet-checker"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("mentions paying for Meme subscriptions where purchasing is allowed", () => {
    render(<TapGuide />);

    expect(
      screen.getByText(
        "Use it for everything else: signing in to 6529, voting, posting, minting anywhere and paying for Meme subscriptions."
      )
    ).toBeInTheDocument();
  });

  it("omits Meme subscriptions entirely where purchasing is hidden", () => {
    mockHideNftPurchasing = true;
    const { container } = render(<TapGuide />);

    expect(
      screen.getByText(
        "Use it for everything else: signing in to 6529, voting, posting and minting anywhere."
      )
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/subscription/i);
  });

  it("marks decorative icons as hidden from assistive technology", () => {
    const { container } = render(<TapGuide />);

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});

test("does not display an invented wallet maximum when backend limits are missing", () => {
  mockLimits = null;
  render(<TapGuide />);
  expect(screen.getByText(/Wallet limits are loading/)).toBeInTheDocument();
  expect(
    screen.queryByText(/You can combine up to 4 wallets/)
  ).not.toBeInTheDocument();
});
