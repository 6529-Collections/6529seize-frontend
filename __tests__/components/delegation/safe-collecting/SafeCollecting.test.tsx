import SafeCollecting from "@/components/delegation/safe-collecting/SafeCollecting";
import type { SafeCollectingSetupState } from "@/components/delegation/safe-collecting/useSafeCollectingSetup";
import { fireEvent, render, screen, within } from "@testing-library/react";

const mockVisibility = { hideNftPurchasing: false, shouldRedirect: false };
let mockSetupState: SafeCollectingSetupState = { kind: "disconnected" };
const mockSeizeConnect = jest.fn();

jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => mockVisibility,
}));

jest.mock(
  "@/components/delegation/safe-collecting/useSafeCollectingSetup",
  () => ({
    useSafeCollectingSetup: () => mockSetupState,
  })
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    isConnected: false,
    seizeConnect: mockSeizeConnect,
    seizeConnectOpen: false,
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

const VAULT = `0x${"a".repeat(40)}`;
const SOCIAL = `0x${"c".repeat(40)}`;

function renderHub() {
  return render(<SafeCollecting setSection={jest.fn()} />);
}

beforeEach(() => {
  mockVisibility.hideNftPurchasing = false;
  mockSetupState = { kind: "disconnected" };
});

describe("SafeCollecting", () => {
  it("leads with the promise, the setup button and the four roles", () => {
    renderHub();

    expect(
      screen.getByRole("heading", { level: 1, name: "Safe Collecting" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Set up your wallets/ })
    ).toHaveAttribute("href", "#safe-setup");
    expect(
      screen.getByRole("figure", {
        name: /work together as one collector/,
      })
    ).toBeInTheDocument();
    for (const role of [
      "Vault",
      "Transaction wallet",
      "Social wallet",
      "Old wallet",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: role })
      ).toBeInTheDocument();
    }
  });

  it("omits subscriptions where NFT purchasing is hidden", () => {
    renderHub();
    expect(screen.getAllByText(/subscription/i).length).toBeGreaterThan(0);

    mockVisibility.hideNftPurchasing = true;
    renderHub();
    const [, restricted] = screen.getAllByRole("heading", {
      level: 1,
      name: "Safe Collecting",
    });
    const page = restricted?.closest("div.tw-w-full");
    expect(page).not.toBeNull();
    expect(within(page as HTMLElement).queryByText(/subscription/i)).toBeNull();
  });

  it("switches between the fresh and existing setup paths", () => {
    renderHub();

    const fresh = screen.getByRole("tab", { name: "Starting fresh" });
    expect(fresh).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "From your vault, sign once" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Appoint a manager" })
    ).toHaveAttribute("href", "/safe-collecting/register-sub-delegation");

    fireEvent.click(screen.getByRole("tab", { name: "Already collecting" }));
    expect(
      screen.getByRole("tab", { name: "Already collecting" })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Combine the wallets you use" })
    ).toBeInTheDocument();
  });

  it("moves between setup tabs with the arrow, Home and End keys", () => {
    renderHub();
    const fresh = screen.getByRole("tab", { name: "Starting fresh" });
    const existing = screen.getByRole("tab", { name: "Already collecting" });

    fireEvent.keyDown(fresh, { key: "ArrowRight" });
    expect(existing).toHaveAttribute("aria-selected", "true");
    expect(existing).toHaveFocus();

    fireEvent.keyDown(existing, { key: "ArrowLeft" });
    expect(fresh).toHaveAttribute("aria-selected", "true");
    expect(fresh).toHaveFocus();

    fireEvent.keyDown(fresh, { key: "End" });
    expect(existing).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(existing, { key: "Home" });
    expect(fresh).toHaveAttribute("aria-selected", "true");
  });

  it("asks to connect before showing a setup", () => {
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
    expect(mockSeizeConnect).toHaveBeenCalled();
  });

  it("shows the connected collector's wallets and checklist", () => {
    mockSetupState = {
      kind: "ready",
      connectedWallet: SOCIAL,
      primaryWallet: VAULT,
      wallets: [
        {
          wallet: VAULT,
          display: "vault.eth",
          tdh: 1234.4,
          managedBy: [{ wallet: SOCIAL, display: "social.eth" }],
          manages: [],
          mintsFor: [],
          airdropsTo: [],
          airdropsFrom: [],
        },
        {
          wallet: SOCIAL,
          display: "social.eth",
          tdh: 0,
          managedBy: [],
          manages: [{ wallet: VAULT, display: "vault.eth" }],
          mintsFor: [],
          airdropsTo: [],
          airdropsFrom: [],
        },
      ],
      checklist: {
        combined: true,
        managedWallets: [{ wallet: VAULT, display: "vault.eth" }],
        mintDelegators: [],
      },
    };
    renderHub();

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("1,234 TDH")).toBeInTheDocument();
    expect(screen.getByText("Managed by social.eth")).toBeInTheDocument();
    expect(
      screen.getByText("Your 2 wallets count as one collector.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("A wallet manages vault.eth, so it never has to sign.")
    ).toBeInTheDocument();
    const setupPanel = screen
      .getByRole("heading", { level: 2, name: "Your setup" })
      .closest("section") as HTMLElement;
    expect(
      within(setupPanel).getByRole("link", { name: "Register a delegation" })
    ).toHaveAttribute(
      "href",
      "/safe-collecting/register-delegation?use_case=2"
    );
  });

  it("keeps the full tool list under All tools", () => {
    renderHub();
    expect(
      screen.getByRole("heading", { level: 2, name: "All tools" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Manage by Collection" })
    ).toBeInTheDocument();
  });
});
