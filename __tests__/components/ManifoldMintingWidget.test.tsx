import { render, screen } from "@testing-library/react";
import ManifoldMintingWidget from "../../components/manifoldMinting/ManifoldMintingWidget";
import { ManifoldClaimStatus, ManifoldPhase } from "../../hooks/useManifoldClaim";

jest.mock("../../components/manifoldMinting/ManifoldMintingConnect", () => (props: any) => {
  props.onMintFor("0x1");
  return <div />;
});

jest.mock("../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x1" }),
}));

const readContractsData = { data: [] };
jest.mock("wagmi", () => ({
  useReadContract: () => ({ data: 0 }),
  useReadContracts: () => readContractsData,
  useWaitForTransactionReceipt: () => ({ isPending: false, isSuccess: false, error: null }),
  useWriteContract: () => ({ writeContract: jest.fn(), data: null, reset: jest.fn(), isPending: true, error: null }),
}));

describe("ManifoldMintingWidget", () => {
  const claim = {
    instanceId: 1,
    total: 1,
    totalMax: 1,
    remaining: 1,
    cost: 0,
    startDate: 0,
    endDate: 0,
    status: ManifoldClaimStatus.ACTIVE,
    phase: ManifoldPhase.PUBLIC,
    isFetching: false,
    isFinalized: false,
  } as any;

  it("shows seize button and pending text", () => {
    render(
      <ManifoldMintingWidget
        contract="0x"
        proxy="0x"
        abi={[]}
        claim={claim}
        merkleTreeId={1}
        setFee={() => {}}
        setMintForAddress={() => {}}
      />
    );
    expect(screen.getByText(/SEIZE x1/)).toBeInTheDocument();
    expect(screen.getByText(/Confirm in your wallet/)).toBeInTheDocument();
  });
});
