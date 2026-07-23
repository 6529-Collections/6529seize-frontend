import ManifoldMintingWidget from "@/components/manifold-minting/ManifoldMintingWidget";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/manifold-minting/ManifoldMintingConnect",
  () =>
    function MockConnect(props: any) {
      const React = require("react");
      const onMintFor = props.onMintFor;
      React.useEffect(() => {
        onMintFor("0x0000000000000000000000000000000000000001");
      }, [onMintFor]);
      return <div />;
    }
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x0000000000000000000000000000000000000001",
  }),
}));

const readContractsData = { data: [] };
const mockWriteContract = jest.fn();
jest.mock("wagmi", () => ({
  useReadContract: () => ({ data: 0n }),
  useReadContracts: () => readContractsData,
  useWaitForTransactionReceipt: () => ({
    isPending: false,
    isSuccess: false,
    error: null,
  }),
  useWriteContract: () => ({
    writeContract: mockWriteContract,
    data: null,
    reset: jest.fn(),
    isPending: false,
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
    costWei: 0n,
    startDate: 0,
    endDate: 0,
    status: ManifoldClaimStatus.ACTIVE,
    phase: ManifoldPhase.PUBLIC,
    isFetching: false,
    isFinalized: false,
  } as any;

  it("shows wallet confirmation in the transaction modal", async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    expect(mockWriteContract).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Confirm in your wallet"
    );
  });
});
