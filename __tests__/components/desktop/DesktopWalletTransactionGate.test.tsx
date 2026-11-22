import { render, screen } from "@testing-library/react";
import DesktopWalletTransactionGate from "@/components/desktop/DesktopWalletTransactionGate";
import { useIsDesktopBrowserWallet } from "@/hooks/desktop/useIsDesktopBrowserWallet";

jest.mock("@/hooks/desktop/useIsDesktopBrowserWallet", () => ({
  useIsDesktopBrowserWallet: jest.fn(),
}));
jest.mock("@/services/desktop/continueInBrowser", () => ({
  continueInBrowser: jest.fn(() => true),
  getWebsiteHost: () => "6529.io",
}));

const forwarding = useIsDesktopBrowserWallet as jest.Mock;

describe("DesktopWalletTransactionGate", () => {
  it("renders the control with any other wallet", () => {
    forwarding.mockReturnValue(false);
    render(
      <DesktopWalletTransactionGate>
        <button type="button">Mint</button>
      </DesktopWalletTransactionGate>
    );
    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue in your browser" })
    ).not.toBeInTheDocument();
  });

  it("offers the website instead with 6529 Desktop browser forwarding", () => {
    forwarding.mockReturnValue(true);
    render(
      <DesktopWalletTransactionGate>
        <button type="button">Mint</button>
      </DesktopWalletTransactionGate>
    );
    expect(
      screen.queryByRole("button", { name: "Mint" })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/does not send this transaction/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Continue in your browser" })
    ).toBeInTheDocument();
  });

  it("wraps the control or the notice when given a class", () => {
    forwarding.mockReturnValue(false);
    const { container } = render(
      <DesktopWalletTransactionGate className="tw-pt-3">
        <button type="button">Mint</button>
      </DesktopWalletTransactionGate>
    );
    expect(container.firstElementChild).toHaveClass("tw-pt-3");
    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
  });
});
