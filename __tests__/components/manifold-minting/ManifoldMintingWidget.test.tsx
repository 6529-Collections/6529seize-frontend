import ManifoldMintingWidget from "@/components/manifold-minting/ManifoldMintingWidget";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { act, render, screen, waitFor, within } from "@testing-library/react";
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
    function MockConnect(
      props: Readonly<{ onMintFor: (address: string) => void }>
    ) {
      mockOnMintFor = props.onMintFor;
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
let mockOnMintFor: (address: string) => void;

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

  it("shows the current Meme token ID in the wallet confirmation details", async () => {
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

    const dialog = await screen.findByRole("dialog", {
      name: "Confirm in your wallet",
    });
    expect(
      within(dialog).getByRole("heading", { name: "Confirm in your wallet" })
    ).toBeInTheDocument();
    expect(within(dialog).getByText("The Memes #156")).toBeInTheDocument();
  });

  it("shows the collection when the Meme token ID is unavailable", async () => {
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

    const dialog = await screen.findByRole("dialog", {
      name: "Confirm in your wallet",
    });
    expect(within(dialog).getByText("The Memes")).toBeInTheDocument();
  });

  it("uses neutral artwork details for other mint collections", async () => {
    const user = userEvent.setup();
    render(
      <ManifoldMintingWidget
        {...baseProps}
        claim={{ ...baseProps.claim, tokenId: 156 }}
      />
    );

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));

    const dialog = await screen.findByRole("dialog", {
      name: "Confirm in your wallet",
    });
    expect(within(dialog).getByText("Artwork")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("The Memes #156")
    ).not.toBeInTheDocument();
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
      args: ["0xC", 1, 1, [], [], "0x0000000000000000000000000000000000000abc"],
    });
    expect(
      await screen.findByRole("dialog", { name: "Confirm in your wallet" })
    ).toHaveAccessibleDescription(
      "Review the mint details and network fee before confirming."
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

    const dialog = await screen.findByRole("dialog", {
      name: "Mint submitted",
    });
    expect(
      within(dialog).getByRole("heading", { name: "Mint submitted" })
    ).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(
      "Waiting for network confirmation."
    );
    expect(
      within(dialog).getByRole("link", {
        name: "View transaction Opens in a new tab",
      })
    ).toHaveAttribute("href", `https://etherscan.io/tx/${transactionHash}`);
    expect(
      screen.queryByRole("button", { name: "Done" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "SEIZED!" })
    ).not.toBeInTheDocument();
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

    const dialog = await screen.findByRole("dialog", { name: "SEIZED!" });
    expect(dialog).toHaveAccessibleDescription("Your mint is confirmed.");
    expect(
      within(dialog).getByRole("button", { name: "Done" })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", {
        name: "View transaction Opens in a new tab",
      })
    ).toHaveAttribute("href", `https://etherscan.io/tx/${transactionHash}`);
  });

  it("keeps the current transaction submitted while receipt polling becomes idle", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"9".repeat(64)}`;
    const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

    await user.click(screen.getByTestId("connect"));
    await user.click(screen.getByRole("button", { name: "SEIZE x1" }));
    mintWriteState = { ...mintWriteState, data: transactionHash };

    for (const isPending of [false, true, false]) {
      waitMintWriteState = { error: null, isPending, isSuccess: false };
      rerender(<ManifoldMintingWidget {...baseProps} />);

      const dialog = screen.getByRole("dialog", { name: "Mint submitted" });
      expect(
        within(dialog).getByRole("heading", { name: "Mint submitted" })
      ).toBeInTheDocument();
      expect(
        within(dialog).queryByRole("heading", {
          name: "Confirm in your wallet",
        })
      ).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole("link", {
          name: "View transaction Opens in a new tab",
        })
      ).toHaveAttribute("href", `https://etherscan.io/tx/${transactionHash}`);
    }

    waitMintWriteState = { error: null, isPending: false, isSuccess: true };
    rerender(<ManifoldMintingWidget {...baseProps} />);

    expect(screen.getByRole("dialog", { name: "SEIZED!" })).toBeInTheDocument();
    expect(writeContract).toHaveBeenCalledTimes(1);
  });

  it("keeps the submitted quantity, recipient, and artwork when live mint details change", async () => {
    const user = userEvent.setup();
    const transactionHash: `0x${string}` = `0x${"7".repeat(64)}`;
    const originalRecipient = "0x0000000000000000000000000000000000000abc";
    const updatedRecipient = "0x0000000000000000000000000000000000000def";
    const props = {
      ...baseProps,
      contract: MEMES_CONTRACT,
      claim: { ...baseProps.claim, tokenId: 547 },
      artwork: { name: "Original artwork", imageUrl: "/original-artwork.png" },
    };
    const { rerender } = render(<ManifoldMintingWidget {...props} />);

    await user.click(screen.getByTestId("connect"));
    const mintCount = screen.getByRole("spinbutton", { name: "Mint count" });
    await user.clear(mintCount);
    await user.type(mintCount, "3");
    await user.click(screen.getByRole("button", { name: "SEIZE x3" }));
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [MEMES_CONTRACT, 1, 3, [], [], originalRecipient],
      })
    );

    mintWriteState = { ...mintWriteState, data: transactionHash };
    waitMintWriteState = { error: null, isPending: true, isSuccess: false };
    rerender(<ManifoldMintingWidget {...props} />);
    expect(
      screen.getByRole("dialog", { name: "Mint submitted" })
    ).toHaveAccessibleDescription("Waiting for network confirmation.");

    act(() => mockOnMintFor(updatedRecipient));
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [{ result: false }],
    });
    const updatedProps = {
      ...props,
      claim: { ...props.claim, tokenId: 548 },
      artwork: { name: "Next artwork", imageUrl: "/next-artwork.png" },
    };
    rerender(<ManifoldMintingWidget {...updatedProps} />);
    expect(screen.getByRole("spinbutton", { name: "Mint count" })).toHaveValue(
      1
    );

    waitMintWriteState = { error: null, isPending: false, isSuccess: true };
    rerender(<ManifoldMintingWidget {...updatedProps} />);

    const receipt = within(
      await screen.findByRole("dialog", { name: "SEIZED!" })
    );
    expect(receipt.getByText("3")).toBeInTheDocument();
    expect(receipt.getByText(originalRecipient)).toBeInTheDocument();
    expect(receipt.queryByText(updatedRecipient)).not.toBeInTheDocument();
    expect(receipt.getByText("Original artwork")).toBeInTheDocument();
    expect(receipt.getByText("The Memes #547")).toBeInTheDocument();
    expect(receipt.queryByText("Next artwork")).not.toBeInTheDocument();
    expect(receipt.queryByText("The Memes #548")).not.toBeInTheDocument();
  });

  it.each(["Done", "Escape"] as const)(
    "dismisses a confirmed mint with %s and restores focus to the mint button",
    async (dismissAction) => {
      const user = userEvent.setup();
      const { rerender } = render(<ManifoldMintingWidget {...baseProps} />);

      await user.click(screen.getByTestId("connect"));
      const mintButton = screen.getByRole("button", { name: "SEIZE x1" });
      await user.click(mintButton);
      mintWriteState = { ...mintWriteState, data: `0x${"8".repeat(64)}` };
      waitMintWriteState = { error: null, isPending: false, isSuccess: true };
      rerender(<ManifoldMintingWidget {...baseProps} />);

      await screen.findByRole("dialog", { name: "SEIZED!" });
      if (dismissAction === "Done") {
        await user.click(screen.getByRole("button", { name: "Done" }));
      } else {
        await user.keyboard("{Escape}");
      }

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mintButton).toHaveFocus();
      rerender(<ManifoldMintingWidget {...baseProps} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  );

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
    expect(
      await screen.findByRole("dialog", { name: "Confirm in your wallet" })
    ).toBeInTheDocument();

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

    expect(
      await screen.findByRole("dialog", { name: "SEIZED!" })
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Close mint confirmation",
      })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /SEIZE x1/i }));
    expect(
      await screen.findByRole("dialog", { name: "Confirm in your wallet" })
    ).toBeInTheDocument();
  });
});
