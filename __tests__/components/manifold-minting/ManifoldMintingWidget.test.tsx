import ManifoldMintingWidget from "@/components/manifold-minting/ManifoldMintingWidget";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

jest.mock("wagmi");

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({ address: "0x1" })),
}));

jest.mock(
  "@/components/manifold-minting/ManifoldMintingConnect",
  () =>
    function MockConnect(props: any) {
      return (
        <button
          data-testid="connect"
          onClick={() =>
            props.onMintFor("0x0000000000000000000000000000000000000abc")
          }
        >
          connect
        </button>
      );
    }
);

const writeContract = jest.fn();
const reset = jest.fn();

const baseProps = {
  contract: "0xC",
  chain: { id: 1 },
  proxy: "0xP",
  abi: [],
  claim: {
    status: ManifoldClaimStatus.ACTIVE,
    phase: ManifoldPhase.PUBLIC,
    instanceId: 1,
    cost: 1,
    costWei: 1n,
    startDate: 0,
    isFinalized: false,
  } as any,
  merkleTreeId: 1,
  setFee: jest.fn(),
  setMintForAddress: jest.fn(),
};

describe("ManifoldMintingWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract,
      reset,
      data: undefined,
      error: null,
      isPending: false,
    });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      error: null,
      isPending: false,
      isSuccess: false,
    });
    (useReadContract as jest.Mock).mockReturnValue({ data: 0n });
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [{ result: false }],
    });
  });

  it("shows mint button after address provided", async () => {
    const user = userEvent.setup();
    render(<ManifoldMintingWidget {...baseProps} />);
    await user.click(screen.getByTestId("connect"));
    expect(
      screen.getByRole("button", { name: /SEIZE x1/i })
    ).toBeInTheDocument();
  });

  it("allows minting when address provided", async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      claim: {
        ...baseProps.claim,
        status: ManifoldClaimStatus.ACTIVE,
        phase: ManifoldPhase.PUBLIC,
      },
    };
    render(<ManifoldMintingWidget {...props} />);
    // simulate setting address via connect component
    await user.click(screen.getByTestId("connect"));
    // button should now show seize text
    const btn = await screen.findByRole("button", { name: /SEIZE x1/i });
    expect(btn).toBeTruthy();
    await user.click(btn);
    expect(writeContract).toHaveBeenCalled();
  });

  it("shows a submitted transaction in the onchain modal", async () => {
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract,
      reset,
      data: `0x${"a".repeat(64)}`,
      error: null,
      isPending: false,
    });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      error: null,
      isPending: true,
      isSuccess: false,
    });

    render(<ManifoldMintingWidget {...baseProps} />);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Transaction Submitted - SEIZING");
    expect(screen.getByRole("link", { name: "View Tx" })).toBeInTheDocument();
  });

  it("shows a successful transaction in the onchain modal", async () => {
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract,
      reset,
      data: `0x${"b".repeat(64)}`,
      error: null,
      isPending: false,
    });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      error: null,
      isPending: false,
      isSuccess: true,
    });

    render(<ManifoldMintingWidget {...baseProps} />);

    expect(await screen.findByRole("dialog")).toHaveTextContent("SEIZED!");
  });

  it("shows a transaction error in the onchain modal", async () => {
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract,
      reset,
      data: undefined,
      error: new Error("Wallet rejected. Request Arguments"),
      isPending: false,
    });

    render(<ManifoldMintingWidget {...baseProps} />);

    await screen.findByRole("dialog");
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Wallet rejected");
    expect(
      screen.queryByText("Wallet rejected", { selector: "div" })
    ).toBeNull();
  });
});
