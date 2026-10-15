import type { ContractWalletDelegation } from "@/components/delegation/CollectionDelegation.utils";
import { DelegationRowDetails } from "@/components/delegation/collection-delegation/DelegationRowDetails";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/delegation/delegation-expiry", () => ({
  ...jest.requireActual("@/components/delegation/delegation-expiry"),
  getViewerTimeZone: () => "America/Los_Angeles",
}));

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }) }));

const WALLET = "0x2222222222222222222222222222222222222222";

function renderRow(expiry: ContractWalletDelegation["expiry"]) {
  return render(
    <DelegationRowDetails
      label="Outgoing"
      walletDelegation={{ wallet: WALLET, expiry, all: true, tokens: 0 }}
      consolidationStatus={undefined}
      statusUnavailable={false}
      pending={false}
      isConsolidation={false}
    />
  );
}

describe("DelegationRowDetails expiry", () => {
  it("shows the exact expiry instant in the viewer's zone", () => {
    renderRow({
      status: "active",
      // A legacy expiry registered as 00:00 UTC on 15 October 2026.
      expiresAt: Date.parse("2026-10-15T00:00:00Z") / 1000,
    });
    const label = screen.getByText(/^active - expires /);
    expect(label.textContent?.replace(/\s/g, " ")).toBe(
      "active - expires Oct 14, 2026, 5:00 PM PDT"
    );
    expect(label).toHaveClass("tw-text-success");
  });

  it("marks expired and non-expiring delegations", () => {
    const { rerender } = renderRow({ status: "expired" });
    expect(screen.getByText("expired")).toHaveClass("tw-text-error");

    rerender(
      <DelegationRowDetails
        label="Outgoing"
        walletDelegation={{
          wallet: WALLET,
          expiry: { status: "nonExpiring" },
          all: true,
          tokens: 0,
        }}
        consolidationStatus={undefined}
        statusUnavailable={false}
        pending={false}
        isConsolidation={false}
      />
    );
    expect(screen.getByText("active - non-expiring")).toHaveClass(
      "tw-text-success"
    );
  });
});
