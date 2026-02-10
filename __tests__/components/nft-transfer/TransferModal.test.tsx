import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TransferModal from "@/components/nft-transfer/TransferModal";
import { ContractType } from "@/types/enums";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/components/nft-transfer/TransferState", () => ({
  useTransfer: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(),
}));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => {
  const MockTransferModalPfp = () => <div data-testid="pfp" />;
  MockTransferModalPfp.displayName = "MockTransferModalPfp";
  return MockTransferModalPfp;
});
jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => {
  const MockCircleLoader = () => <div data-testid="loader" />;
  MockCircleLoader.displayName = "MockCircleLoader";

  return {
    __esModule: true,
    default: MockCircleLoader,
    CircleLoaderSize: {
      MEDIUM: "MEDIUM",
    },
  };
});
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(),
}));
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
  usePublicClient: jest.fn(),
  useWalletClient: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt = "", src, ...rest }: any) => {
    const { fill, ...other } = rest;
    return <img src={src} alt={alt} {...other} />;
  },
}));

const mockUseTransfer = require("@/components/nft-transfer/TransferState")
  .useTransfer as jest.Mock;
const mockUseIdentity = require("@/hooks/useIdentity").useIdentity as jest.Mock;
const mockCommonApiFetch = require("@/services/api/common-api")
  .commonApiFetch as jest.Mock;
const mockGetUserProfile = require("@/helpers/server.helpers")
  .getUserProfile as jest.Mock;
const mockUseAccount = require("wagmi").useAccount as jest.Mock;
const mockUsePublicClient = require("wagmi").usePublicClient as jest.Mock;
const mockUseWalletClient = require("wagmi").useWalletClient as jest.Mock;

describe("TransferModal", () => {
  const selectedItems = new Map([
    [
      "MEMES:10",
      {
        key: "MEMES:10",
        contract: "0x1155",
        contractType: ContractType.ERC1155,
        tokenId: 10,
        qty: 2,
        max: 5,
        title: "Memes 10",
        thumbUrl: "https://example.com/thumb-10.png",
        label: "MEMES #10",
      },
    ],
    [
      "POSTER:7",
      {
        key: "POSTER:7",
        contract: "0x721",
        contractType: ContractType.ERC721,
        tokenId: 7,
        qty: 1,
        max: 1,
        title: "Poster 7",
        thumbUrl: "https://example.com/thumb-7.png",
        label: "POSTER #7",
      },
    ],
  ]);

  const identityResult = {
    profile: {
      wallets: [
        {
          wallet: "0x1111111111111111111111111111111111111111",
          display: "Recipient",
          tdh: 1,
        },
        {
          wallet: "0x2222222222222222222222222222222222222222",
          display: "Alt",
          tdh: 2,
        },
      ],
    },
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTransfer.mockReturnValue({
      selected: selectedItems,
      totalQty: 3,
    });

    mockUseIdentity.mockImplementation(
      ({ handleOrWallet }: { handleOrWallet: string }) => {
        if (!handleOrWallet) {
          return { profile: null, isLoading: false };
        }
        return identityResult;
      }
    );

    mockCommonApiFetch.mockResolvedValue([
      {
        profile_id: "1",
        handle: "recipient",
        display: "Recipient",
        wallet: "0x1111111111111111111111111111111111111111",
        level: 10,
        tdh: 100,
        pfp: null,
      },
    ]);
    mockGetUserProfile.mockResolvedValue({
      id: "1",
      handle: "recipient",
      normalised_handle: "recipient",
      primary_wallet: "0x1111111111111111111111111111111111111111",
      pfp: null,
      tdh: 100,
      level: 10,
      cic: 0,
    });

    mockUseAccount.mockReturnValue({
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    mockUsePublicClient.mockReturnValue({
      simulateContract: jest.fn(),
      waitForTransactionReceipt: jest.fn(),
      readContract: jest.fn(),
      chain: {
        blockExplorers: { default: { url: "https://explorer" } },
      },
    });

    mockUseWalletClient.mockReturnValue({
      data: { writeContract: jest.fn() },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const openModal = (onClose = jest.fn()) => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TransferModal open onClose={onClose} />
      </QueryClientProvider>
    );
  };

  const selectRecipientFlow = async () => {
    const user = userEvent.setup();
    openModal();

    const input = screen.getByPlaceholderText(/search by handle/i);
    await user.type(input, "rec");

    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalled());

    const recipientBtn = await screen.findByRole("button", {
      name: /recipient/i,
    });
    await user.click(recipientBtn);
    const walletBtn = await screen.findByRole("button", {
      name: /0x1111111111111111111111111111111111111111/i,
    });
    await user.click(walletBtn);
  };

  it("disables transfer confirmation until a wallet is selected", () => {
    openModal();
    const transferButton = screen.getByRole("button", { name: /^transfer$/i });
    expect(transferButton).toBeDisabled();
  });

  it("submits ERC1155 (batch) and ERC721 transfers successfully and shows completion UI", async () => {
    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    if (!publicClient || !walletWrapper?.data) {
      throw new Error("Expected wagmi clients to be initialised");
    }

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const readContract = publicClient.readContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    // groupByContractAndOriginator will call readContract for 1155 origin key
    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000abc"
    );

    simulateContract
      .mockResolvedValueOnce({ request: { type: "1155" } }) // 1155 batch
      .mockResolvedValueOnce({ request: { type: "721" } }); // 721 single

    writeContract
      .mockResolvedValueOnce("0xhash1155")
      .mockResolvedValueOnce("0xhash721");

    waitForReceipt
      .mockResolvedValueOnce({ status: "success" })
      .mockResolvedValueOnce({ status: "success" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    await waitFor(() => {
      expect(simulateContract.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(() => {
      expect(writeContract.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await screen.findByText(/all 2 transactions successful/i);

    await waitFor(
      () => {
        expect(waitForReceipt.mock.calls.length).toBeGreaterThanOrEqual(2);
      },
      { timeout: 3000 }
    );

    // Each tx card should show "Successful" (exact match; exclude header text)
    const successBadges = await screen.findAllByText(/^Successful$/i);
    expect(successBadges.length).toBe(2);
  });

  it("handles a single ERC721 success and shows 'Transfer Successful'", async () => {
    // Override selected to a single ERC721
    const singleSelected = new Map([
      [
        "POSTER:7",
        {
          key: "POSTER:7",
          contract: "0x721",
          contractType: ContractType.ERC721,
          tokenId: 7,
          qty: 1,
          max: 1,
          title: "Poster 7",
          thumbUrl: "https://example.com/thumb-7.png",
          label: "POSTER #7",
        },
      ],
    ]);
    // Ensure the mocked selection stays consistent across all renders
    mockUseTransfer.mockReset();
    mockUseTransfer.mockReturnValue({
      selected: singleSelected,
      totalQty: 1,
    });

    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const readContract = publicClient.readContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    // 721 path does not require origin read, but keep it safe
    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000abc"
    );
    simulateContract.mockResolvedValueOnce({ request: { type: "721" } });
    writeContract.mockResolvedValueOnce("0xhash721");
    waitForReceipt.mockResolvedValueOnce({ status: "success" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    await screen.findByText(/transfer successful/i);
    const successBadges = await screen.findAllByText(/^successful$/i);
    expect(successBadges.length).toBe(1);
  });

  it("handles a single ERC721 failure and shows 'Transfer Failed'", async () => {
    // Override selected to a single ERC721
    const singleSelected = new Map([
      [
        "POSTER:8",
        {
          key: "POSTER:8",
          contract: "0x721",
          contractType: ContractType.ERC721,
          tokenId: 8,
          qty: 1,
          max: 1,
          title: "Poster 8",
          thumbUrl: "https://example.com/thumb-8.png",
          label: "POSTER #8",
        },
      ],
    ]);
    // Ensure the mocked selection stays consistent across all renders
    mockUseTransfer.mockReset();
    mockUseTransfer.mockReturnValue({
      selected: singleSelected,
      totalQty: 1,
    });

    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const readContract = publicClient.readContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000abc"
    );
    simulateContract.mockResolvedValueOnce({ request: { type: "721" } });
    writeContract.mockResolvedValueOnce("0xhash721");
    // Force failure on receipt
    waitForReceipt.mockResolvedValueOnce({ status: "error" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    await screen.findByText(/transfer failed/i);
    const errorBadges = await screen.findAllByText(/error/i);
    expect(errorBadges.length).toBeGreaterThan(0);
  });

  it("shows mixed results summary when one succeeds and one fails", async () => {
    // Use default selected (1155 + 721)
    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const readContract = publicClient.readContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000abc"
    );

    simulateContract
      .mockResolvedValueOnce({ request: { type: "1155" } }) // 1155 batch
      .mockResolvedValueOnce({ request: { type: "721" } }); // 721 single

    writeContract
      .mockResolvedValueOnce("0xhash1155")
      .mockResolvedValueOnce("0xhash721");

    // Make first succeed, second fail
    waitForReceipt
      .mockResolvedValueOnce({ status: "success" })
      .mockResolvedValueOnce({ status: "error" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    await screen.findByText(/transfer complete: 1 successful, 1 failed/i);

    const successBadges = await screen.findAllByText(/^successful$/i);
    expect(successBadges.length).toBe(1);
    const errorBadges = await screen.findAllByText(/error/i);
    expect(errorBadges.length).toBeGreaterThan(0);
  });

  it("shows a client not ready error when no public client is available", async () => {
    // Make public client undefined for this test
    mockUsePublicClient.mockReset();
    mockUsePublicClient.mockReturnValue(undefined);

    await selectRecipientFlow();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    expect(
      await screen.findByText(/client not ready\. please reconnect\./i)
    ).toBeInTheDocument();
  });

  it("shows an error when the wallet client is unavailable", async () => {
    mockUseWalletClient.mockReturnValue({ data: undefined });

    await selectRecipientFlow();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    expect(
      await screen.findByText(/wallet not ready\. please reconnect\./i)
    ).toBeInTheDocument();

    await waitFor(() => {
      const anyErrorMatches = screen.queryAllByText(
        /invalid destination wallet|wallet not ready|client not ready|error/i
      );
      expect(anyErrorMatches.length).toBeGreaterThan(0);
    });
  });

  it("groups ERC1155 by extension origin and sorts tokenIds in the batch label", async () => {
    const singleContract = "0x1155";

    const selected = new Map([
      [
        "MEMES:5",
        {
          key: "MEMES:5",
          contract: singleContract,
          contractType: ContractType.ERC1155,
          tokenId: 5,
          qty: 0, // will clamp to 1
          max: 1,
          title: "Memes 5",
          thumbUrl: "https://example.com/thumb-5.png",
          label: "MEMES #5",
        },
      ],
      [
        "MEMES:3",
        {
          key: "MEMES:3",
          contract: singleContract,
          contractType: ContractType.ERC1155,
          tokenId: 3,
          qty: 10, // will clamp to 2 via max
          max: 2,
          title: "Memes 3",
          thumbUrl: "https://example.com/thumb-3.png",
          label: "MEMES #3",
        },
      ],
    ]);

    mockUseTransfer.mockReset();
    mockUseTransfer.mockReturnValue({ selected, totalQty: 2 });

    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const readContract = publicClient.readContract as jest.Mock;
    const simulateContract = publicClient.simulateContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    // Same extension for both tokens -> 1 batch group. The address is lowercased in code
    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000AbC"
    );

    simulateContract.mockResolvedValueOnce({ request: { type: "1155" } });
    writeContract.mockResolvedValueOnce("0xhash1155batch");
    waitForReceipt.mockResolvedValueOnce({ status: "success" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    // Batch label should be sorted ascending by tokenId and clamped quantities: #3(x2) then #5(x1)
    await screen.findByText(/MEMES #3\(x2\) - #5\(x1\)/i);

    // Origin key should reflect the extension address (lowercased)
    await screen.findByText(
      /Originator: ext:0x0000000000000000000000000000000000000abc/i
    );
  });

  it("creates separate ERC1155 batches when origin extensions differ", async () => {
    const singleContract = "0x1155";

    const selected = new Map([
      [
        "MEMES:1",
        {
          key: "MEMES:1",
          contract: singleContract,
          contractType: ContractType.ERC1155,
          tokenId: 1,
          qty: 1,
          max: 5,
          title: "Memes 1",
          thumbUrl: "https://example.com/thumb-1.png",
          label: "MEMES #1",
        },
      ],
      [
        "MEMES:2",
        {
          key: "MEMES:2",
          contract: singleContract,
          contractType: ContractType.ERC1155,
          tokenId: 2,
          qty: 1,
          max: 5,
          title: "Memes 2",
          thumbUrl: "https://example.com/thumb-2.png",
          label: "MEMES #2",
        },
      ],
    ]);

    mockUseTransfer.mockReset();
    mockUseTransfer.mockReturnValue({ selected, totalQty: 2 });

    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const readContract = publicClient.readContract as jest.Mock;
    const simulateContract = publicClient.simulateContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    // Different extensions -> two separate groups/batches
    readContract
      .mockResolvedValueOnce("0x0000000000000000000000000000000000000abc")
      .mockResolvedValueOnce("0x0000000000000000000000000000000000000def");

    simulateContract
      .mockResolvedValueOnce({ request: { type: "1155" } })
      .mockResolvedValueOnce({ request: { type: "1155" } });

    writeContract
      .mockResolvedValueOnce("0xhash1155a")
      .mockResolvedValueOnce("0xhash1155b");

    waitForReceipt
      .mockResolvedValueOnce({ status: "success" })
      .mockResolvedValueOnce({ status: "success" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    // Two cards rendered — one per origin group
    const cards = await screen.findAllByText(/Originator: ext:/i);
    expect(cards.length).toBe(2);
  });

  it("creates individual entries for ERC721 and uses 'erc721' origin key", async () => {
    const selected = new Map([
      [
        "POSTER:9",
        {
          key: "POSTER:9",
          contract: "0x721",
          contractType: ContractType.ERC721,
          tokenId: 9,
          qty: 1,
          max: 1,
          title: "Poster 9",
          thumbUrl: "https://example.com/thumb-9.png",
          label: "POSTER #9",
        },
      ],
      [
        "POSTER:7",
        {
          key: "POSTER:7",
          contract: "0x721",
          contractType: ContractType.ERC721,
          tokenId: 7,
          qty: 1,
          max: 1,
          title: "Poster 7",
          thumbUrl: "https://example.com/thumb-7.png",
          label: "POSTER #7",
        },
      ],
    ]);

    mockUseTransfer.mockReset();
    mockUseTransfer.mockReturnValue({ selected, totalQty: 2 });

    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    simulateContract
      .mockResolvedValueOnce({ request: { type: "721" } })
      .mockResolvedValueOnce({ request: { type: "721" } });

    writeContract
      .mockResolvedValueOnce("0xhash721a")
      .mockResolvedValueOnce("0xhash721b");

    waitForReceipt
      .mockResolvedValueOnce({ status: "success" })
      .mockResolvedValueOnce({ status: "success" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    // Two separate entries should render with labels for each token
    await screen.findByText(/POSTER #7/i);
    await screen.findByText(/POSTER #9/i);

    // And origin should be erc721
    const erc721Origins = await screen.findAllByText(/Originator: erc721/i);
    expect(erc721Origins.length).toBe(2);
  });

  it("displays warning banner when transactions are pending", async () => {
    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    const readContract = publicClient.readContract as jest.Mock;
    const writeContract = walletWrapper.data.writeContract as jest.Mock;
    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;

    readContract.mockResolvedValue(
      "0x0000000000000000000000000000000000000abc"
    );

    simulateContract
      .mockResolvedValueOnce({ request: { type: "1155" } })
      .mockResolvedValueOnce({ request: { type: "721" } });

    writeContract
      .mockResolvedValueOnce("0xhash1155")
      .mockResolvedValueOnce("0xhash721");

    waitForReceipt.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Double-check the recipient address and token details before/i
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /NFT transfers are irreversible once submitted on-chain/i
      )
    ).toBeInTheDocument();
  });
});
