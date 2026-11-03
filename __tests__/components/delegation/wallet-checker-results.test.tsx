import WalletCheckerResults, {
  type ConsolidationDisplay,
} from "@/components/delegation/walletChecker/WalletCheckerResults";
import { MEMES_CONTRACT, NEVER_DATE } from "@/constants/constants";
import type { Delegation } from "@/entities/IDelegation";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/address/Address",
  () =>
    function MockAddress(props: {
      wallets: string[];
      display: string | undefined;
    }) {
      return <span>{props.display ?? props.wallets[0]}</span>;
    }
);

jest.mock("@/components/delegation/delegation-expiry", () => ({
  ...jest.requireActual("@/components/delegation/delegation-expiry"),
  getViewerTimeZone: () => "America/Los_Angeles",
}));

const CHECKED_ADDRESS = "0x1111111111111111111111111111111111111111";
const RELATED_ADDRESS = "0x2222222222222222222222222222222222222222";

function createDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    block: 1,
    from_address: CHECKED_ADDRESS,
    from_display: "checked.eth",
    to_address: RELATED_ADDRESS,
    to_display: "related.eth",
    collection: MEMES_CONTRACT,
    use_case: 1,
    expiry: NEVER_DATE,
    token_id: 0,
    all_tokens: true,
    ...overrides,
  };
}

const reciprocalConsolidations: ConsolidationDisplay[] = [
  {
    from: CHECKED_ADDRESS,
    from_display: "checked.eth",
    to: RELATED_ADDRESS,
    to_display: "related.eth",
  },
  {
    from: RELATED_ADDRESS,
    from_display: "related.eth",
    to: CHECKED_ADDRESS,
    to_display: "checked.eth",
  },
];

describe("WalletCheckerResults", () => {
  it("renders the loaded delegation and active consolidation states", () => {
    const delegation = createDelegation();

    render(
      <WalletCheckerResults
        fetchedAddress={CHECKED_ADDRESS}
        delegationsLoaded
        delegations={[delegation]}
        subDelegations={[createDelegation({ use_case: 10 })]}
        activeDelegation={delegation}
        consolidationsLoaded
        consolidations={reciprocalConsolidations}
        consolidatedWallets={[
          { address: CHECKED_ADDRESS, display: "checked.eth" },
          { address: RELATED_ADDRESS, display: "related.eth" },
        ]}
        consolidationActions={[]}
      />
    );

    expect(screen.getByText("Delegations (1)")).toBeInTheDocument();
    expect(screen.getByText("Delegation Managers (1)")).toBeInTheDocument();
    expect(screen.getByText("Consolidations (2)")).toBeInTheDocument();
    expect(
      screen.getByText("Active Minting Delegation for The Memes")
    ).toBeInTheDocument();
    expect(screen.getByText("Active Consolidation")).toBeInTheDocument();
    expect(screen.getAllByText("Never").length).toBeGreaterThan(0);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("renders the existing incomplete consolidation recommendation", () => {
    const [incompleteConsolidation] = reciprocalConsolidations;

    render(
      <WalletCheckerResults
        fetchedAddress={CHECKED_ADDRESS}
        delegationsLoaded={false}
        delegations={[]}
        subDelegations={[]}
        activeDelegation={undefined}
        consolidationsLoaded
        consolidations={
          incompleteConsolidation ? [incompleteConsolidation] : []
        }
        consolidatedWallets={[]}
        consolidationActions={
          incompleteConsolidation ? [incompleteConsolidation] : []
        }
      />
    );

    expect(screen.getByText("Incomplete Consolidation")).toBeInTheDocument();
    expect(screen.getByText("Recommended Actions:")).toBeInTheDocument();
    expect(screen.getAllByText("checked.eth").length).toBeGreaterThan(0);
    expect(screen.getAllByText("related.eth").length).toBeGreaterThan(0);
  });

  it("shows a dated expiry as an exact instant in the viewer's zone", () => {
    // A legacy expiry registered as 00:00 UTC on 15 October 2026.
    const delegation = createDelegation({
      expiry: Date.parse("2026-10-15T00:00:00Z") / 1000,
    });

    render(
      <WalletCheckerResults
        fetchedAddress={CHECKED_ADDRESS}
        delegationsLoaded
        delegations={[delegation]}
        subDelegations={[]}
        activeDelegation={delegation}
        consolidationsLoaded={false}
        consolidations={[]}
        consolidatedWallets={[]}
        consolidationActions={[]}
      />
    );

    const expected = "Oct 14, 2026, 5:00 PM PDT";
    const matches = screen.getAllByText(
      (_content, element) =>
        element?.childElementCount === 0 &&
        element.textContent?.replace(/\s/g, " ") === expected
    );
    // The delegations table cell and the active delegation summary.
    expect(matches).toHaveLength(2);
  });

  it("shows a zero expiry as never, not as 1 January 1970", () => {
    render(
      <WalletCheckerResults
        fetchedAddress={CHECKED_ADDRESS}
        delegationsLoaded
        delegations={[createDelegation({ expiry: 0 })]}
        subDelegations={[]}
        activeDelegation={undefined}
        consolidationsLoaded={false}
        consolidations={[]}
        consolidatedWallets={[]}
        consolidationActions={[]}
      />
    );

    const row = screen.getAllByRole("row")[1];
    expect(row).toHaveTextContent("Never");
    expect(row).not.toHaveTextContent("1970");
  });

  it("does not leak a zero expiry value into the active delegation output", () => {
    render(
      <WalletCheckerResults
        fetchedAddress={CHECKED_ADDRESS}
        delegationsLoaded
        delegations={[]}
        subDelegations={[]}
        activeDelegation={createDelegation({ expiry: 0 })}
        consolidationsLoaded={false}
        consolidations={[]}
        consolidatedWallets={[]}
        consolidationActions={[]}
      />
    );

    const activeDelegationHeading = screen.getByText(
      "Active Minting Delegation for The Memes"
    );
    expect(activeDelegationHeading.parentElement).not.toHaveTextContent(
      "Expiry:"
    );
  });
});
