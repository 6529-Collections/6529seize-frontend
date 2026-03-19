import ManifoldMintingWidget from "@/components/manifold-minting/ManifoldMintingWidget";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/manifold-minting/ManifoldMintingConnect",
  () =>
    function MockConnect(props: any) {
      const React = require("react");
      const onMintFor = props.onMintFor;
      React.useEffect(() => {
        onMintFor("0x1");
      }, [onMintFor]);
      return <div />;
    }
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x1" }),
}));

const readContractsData = { data: [] };
jest.mock("wagmi", () => ({
  useReadContract: () => ({ data: 0 }),
  useReadContracts: () => readContractsData,
  useWaitForTransactionReceipt: () => ({
    isPending: false,
    isSuccess: false,
    error: null,
  }),
  useWriteContract: () => ({
    writeContract: jest.fn(),
    data: null,
    reset: jest.fn(),
    isPending: true,
    error: null,
  }),
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
        chain={{ id: 1 } as any}
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
