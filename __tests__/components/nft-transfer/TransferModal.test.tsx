import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import TransferModal from "@/components/nft-transfer/TransferModal";
import { ContractType } from "@/enums";

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
  return MockCircleLoader;
});
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
    mockUseAccount.mockReturnValue({
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    mockUsePublicClient.mockReturnValue({
      simulateContract: jest.fn(),
      waitForTransactionReceipt: jest.fn(),
      chain: {
        blockExplorers: { default: { url: "https://explorer" } },
      },
    });
    mockUseWalletClient.mockReturnValue({ data: { writeContract: jest.fn() } });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const openModal = (onClose = jest.fn()) =>
    render(<TransferModal open onClose={onClose} />);

  it("disables transfer confirmation until a wallet is selected", () => {
    openModal();
    const transferButton = screen.getByRole("button", { name: /^transfer$/i });
    expect(transferButton).toBeDisabled();
  });

  async function selectRecipientFlow() {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          profile_id: "1",
          handle: "recipient",
          display: "Recipient",
          wallet: "0x1111111111111111111111111111111111111111",
          level: 10,
          tdh: 100,
          pfp: null,
        },
      ]),
    });

    openModal();

    const input = screen.getByPlaceholderText(/search by handle/i);
    fireEvent.change(input, { target: { value: "rec" } });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    jest.useRealTimers();

    fireEvent.click(screen.getByRole("button", { name: /recipient/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /recipient\s+0x1111111111111111111111111111111111111111/i,
      })
    );
  }

  it("submits ERC1155 and ERC721 transfers successfully", async () => {
    await selectRecipientFlow();

    const publicClient = mockUsePublicClient.mock.results.at(-1)?.value;
    const walletWrapper = mockUseWalletClient.mock.results.at(-1)?.value;

    if (!publicClient || !walletWrapper?.data) {
      throw new Error("Expected wagmi clients to be initialised");
    }

    const walletClient = walletWrapper.data;

    const simulateContract = publicClient.simulateContract as jest.Mock;
    simulateContract
      .mockResolvedValueOnce({ request: { type: "1155" } })
      .mockResolvedValueOnce({ request: { type: "721" } });

    const writeContract = walletClient.writeContract as jest.Mock;
    writeContract
      .mockResolvedValueOnce("0xhash1155")
      .mockResolvedValueOnce("0xhash721");

    const waitForReceipt = publicClient.waitForTransactionReceipt as jest.Mock;
    waitForReceipt.mockResolvedValue({});

    fireEvent.click(screen.getByRole("button", { name: /^transfer$/i }));

    await waitFor(() => expect(simulateContract).toHaveBeenCalledTimes(2));
    expect(writeContract).toHaveBeenCalledTimes(2);
    expect(waitForReceipt).toHaveBeenCalledTimes(2);

    expect(
      await screen.findByText(/all transfers confirmed/i)
    ).toBeInTheDocument();
  });

  it("shows an error when the wallet client is unavailable", async () => {
    mockUseWalletClient.mockReturnValue({ data: undefined });

    await selectRecipientFlow();

    fireEvent.click(screen.getByRole("button", { name: /^transfer$/i }));

    expect(
      await screen.findByText(/wallet not ready\. please reconnect\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/transfer failed/i)).toBeInTheDocument();
  });
});
