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
