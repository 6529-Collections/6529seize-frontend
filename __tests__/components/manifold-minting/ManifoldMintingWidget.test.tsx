import ManifoldMintingWidget from "@/components/manifold-minting/ManifoldMintingWidget";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mainnet } from "viem/chains";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

jest.mock("wagmi");

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
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
const seizeConnect = jest.fn();
const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);

interface MockMintWriteState {
  readonly writeContract: typeof writeContract;
  readonly reset: typeof reset;
  readonly data: `0x${string}` | undefined;
  readonly error: Error | null;
  readonly isPending: boolean;
}

interface MockWaitMintWriteState {
  readonly error: Error | null;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
}

let mintWriteState: MockMintWriteState;
let waitMintWriteState: MockWaitMintWriteState;

function createConnectionState({
  canSignActiveWallet,
}: Readonly<{
  canSignActiveWallet: boolean;
}>): ReturnType<typeof useSeizeConnectContext> {
  return {
    address: "0x1",
    canSignActiveWallet,
    seizeConnect,
    seizeConnectOpen: false,
  } as unknown as ReturnType<typeof useSeizeConnectContext>;
}

const baseProps = {
  contract: "0xC",
  chain: mainnet,
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
  local_timezone: false,
  setFee: jest.fn(),
  setMintForAddress: jest.fn(),
};

describe("ManifoldMintingWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSeizeConnectContextMock.mockReturnValue(
      createConnectionState({
        canSignActiveWallet: true,
      })
    );
    mintWriteState = {
      writeContract,
      reset,
      data: undefined,
      error: null,
      isPending: false,
    };
    waitMintWriteState = {
      error: null,
      isPending: false,
      isSuccess: false,
    };
    (useWriteContract as jest.Mock).mockImplementation(() => mintWriteState);
    (useWaitForTransactionReceipt as jest.Mock).mockImplementation(
      () => waitMintWriteState
    );
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

  it("includes the current Meme token ID in the transaction modal title", async () => {
    const user = userEvent.setup();
    render(
      <ManifoldMintingWidget
        {...baseProps}
        contract={MEMES_CONTRACT}
        claim={{ ...baseProps.claim, tokenId: 156 }}
      />
    );

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    expect(
      await screen.findByRole("dialog", {
        name: "Mint: The Memes #156",
      })
    ).toBeInTheDocument();
  });

  it("uses the existing title when the Meme token ID is unavailable", async () => {
    const user = userEvent.setup();
    render(
      <ManifoldMintingWidget
        {...baseProps}
        contract={MEMES_CONTRACT}
        claim={{ ...baseProps.claim, tokenId: undefined }}
      />
    );

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    expect(
      await screen.findByRole("dialog", { name: "Mint The Memes" })
    ).toBeInTheDocument();
  });

  it("preserves the existing title for other mint collections", async () => {
    const user = userEvent.setup();
    render(
      <ManifoldMintingWidget
        {...baseProps}
        claim={{ ...baseProps.claim, tokenId: 156 }}
      />
    );

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    expect(
      await screen.findByRole("dialog", { name: "Mint The Memes" })
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
    expect(reset).toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalled();
  });

  it("connects and then continues the intended mint", async () => {
    const user = userEvent.setup();
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    expect(seizeConnect).toHaveBeenCalledTimes(1);
    expect(writeContract).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    await waitFor(() => expect(writeContract).toHaveBeenCalledTimes(1));
    expect(writeContract).toHaveBeenCalledWith({
      address: "0x26bbea7803dcac346d5f5f135b57cf2c752a02be",
      abi: [],
      chainId: 1,
      value: 1n,
      functionName: "mintProxy",
      args: [
        "0xC",
        1,
        1,
        [],
        [],
        "0x0000000000000000000000000000000000000abc",
      ],
    });
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Confirm in your wallet"
    );
  });

  it("aborts a delayed mint when its transaction details change", async () => {
    const user = userEvent.setup();
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const changedProps = {
      ...baseProps,
      claim: {
        ...baseProps.claim,
        costWei: 2n,
      },
    };
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    rerender(<ManifoldMintingWidget {...changedProps} />);
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender(<ManifoldMintingWidget {...changedProps} />);
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
    };
    rerender(<ManifoldMintingWidget {...changedProps} />);

    await waitFor(() => {
      expect(writeContract).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          "Mint details changed while connecting. Review and try again."
        )
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a submitted transaction in the onchain modal", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"a".repeat(64)}`;
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    mintWriteState = {
      ...mintWriteState,
      data: transactionHash,
    };
    waitMintWriteState = {
      error: null,
      isPending: true,
      isSuccess: false,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Transaction Submitted - SEIZING");
    expect(screen.getByRole("link", { name: "View Tx" })).toBeInTheDocument();
  });

  it("shows a successful transaction in the onchain modal", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"b".repeat(64)}`;
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    mintWriteState = {
      ...mintWriteState,
      data: transactionHash,
    };
    waitMintWriteState = {
      error: null,
      isPending: false,
      isSuccess: true,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    expect(await screen.findByRole("dialog")).toHaveTextContent("SEIZED!");
  });

  it("shows a transaction error in the onchain modal", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    mintWriteState = {
      ...mintWriteState,
      error: new Error("Wallet rejected. Request Arguments"),
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    await screen.findByRole("dialog");
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Wallet rejected");
    expect(
      screen.queryByText("Wallet rejected", { selector: "div" })
    ).toBeNull();
  });

  it("shows a receipt error in the onchain modal", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"c".repeat(64)}`;
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    mintWriteState = {
      ...mintWriteState,
      data: transactionHash,
    };
    waitMintWriteState = {
      error: new Error("Receipt polling failed. Request Arguments"),
      isPending: false,
      isSuccess: false,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    await screen.findByRole("dialog");
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Receipt polling failed");
  });

  it("keeps the full receipt error when its parsed snippet is too short", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"d".repeat(64)}`;
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    mintWriteState = {
      ...mintWriteState,
      data: transactionHash,
    };
    waitMintWriteState = {
      error: new Error("RPC. Request Arguments"),
      isPending: false,
      isSuccess: false,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    await screen.findByRole("dialog");
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("RPC. Request Arguments");
  });

  it("does not auto-open cached transaction state and starts a remint at wallet confirmation", async () => {
    const user = userEvent.setup();
    const previousTransactionHash: `0x${string}` = `0x${"e".repeat(64)}`;
    mintWriteState = {
      ...mintWriteState,
      data: previousTransactionHash,
    };
    waitMintWriteState = {
      error: null,
      isPending: false,
      isSuccess: true,
    };
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Confirm in your wallet"
    );

    mintWriteState = {
      ...mintWriteState,
      data: `0x${"f".repeat(64)}`,
    };
    waitMintWriteState = {
      error: null,
      isPending: false,
      isSuccess: true,
    };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    expect(await screen.findByRole("dialog")).toHaveTextContent("SEIZED!");
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Confirm in your wallet"
    );
  });
});
