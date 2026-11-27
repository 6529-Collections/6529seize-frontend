/**
 * @jest-environment-options {"url": "http://localhost:6529/browser-connector"}
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { encodeFunctionData, type Hex, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import BrowserWalletRequestPanel from "@/components/desktop/BrowserWalletRequestPanel";
import {
  buildWalletRequestFragment,
  type WalletRequestEnvelope,
} from "@/lib/desktop/wallet-forwarding";

// Public development key (Hardhat/Anvil account 0); never funded.
const shell = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

const ADDRESS = "0x1111111111111111111111111111111111111111";
const RECIPIENT = "0xab5801a7d398351b8be11c439e05c5b3259aec9b";
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const REGISTRY = "0x0e289576c7565d29018134517309668946ffc912";
const SEPOLIA = 11_155_111;
const ID = "Q".repeat(43);

let account: { isConnected: boolean; address?: string; chainId?: number } = {
  isConnected: true,
  address: ADDRESS,
  chainId: 1,
};
const call = jest.fn();
const getCode = jest.fn();
const readContract = jest.fn();
const publicClient = { call, getCode, readContract };
const commonApiFetch = jest.fn();

jest.mock("wagmi", () => ({
  useAccount: () => account,
  useConfig: () => ({ chains: [{ id: 1 }, { id: 11_155_111 }] }),
  useSignMessage: () => ({ signMessageAsync: jest.fn() }),
  useSignTypedData: () => ({ signTypedDataAsync: jest.fn() }),
  useSwitchChain: () => ({ switchChainAsync: jest.fn() }),
  useSendTransaction: () => ({ sendTransactionAsync: jest.fn() }),
  usePublicClient: () => publicClient,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/helpers/desktop-navigation", () => ({
  loadDesktopUrlInPlace: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetch(...args),
  getStructuredApiErrorStatus: (error: { status?: number }) => error.status,
}));

const batchTransfer = encodeFunctionData({
  abi: [
    parseAbiItem(
      "function safeBatchTransferFrom(address from,address to,uint256[] ids,uint256[] amounts,bytes data)"
    ),
  ],
  args: [ADDRESS, RECIPIENT, [412n, 413n], [1n, 2n], "0x"],
});

const HASH_REF = "(uint16 algorithm,bytes32 digest,bytes32 canonicalizationId)";
const word = (byte: string) => `0x${byte.repeat(32)}` as Hex;
const publish = encodeFunctionData({
  abi: [
    parseAbiItem(
      `function publish(uint32 releaseId,(bytes32 subjectId,bytes32 recordType,bytes32 schemaId,${HASH_REF} contentHash,uint64 effectiveAt,bytes cid,bytes32 arweaveId,string label,uint32 expectedVersion)[] records)`
    ),
  ],
  args: [
    7,
    [
      {
        subjectId: word("a1"),
        recordType: word("b2"),
        schemaId: word("c3"),
        contentHash: {
          algorithm: 2,
          digest: word("11"),
          canonicalizationId: word("22"),
        },
        effectiveAt: 1_795_000_000n,
        cid: `0x01551220${"ab".repeat(32)}`,
        arweaveId: word("00"),
        label: "First record",
        expectedVersion: 0,
      },
      {
        subjectId: word("a2"),
        recordType: word("b2"),
        schemaId: word("c3"),
        contentHash: {
          algorithm: 1,
          digest: word("33"),
          canonicalizationId: word("22"),
        },
        effectiveAt: 1_795_000_000n,
        cid: "0x",
        arweaveId: word("ee"),
        label: "",
        expectedVersion: 3,
      },
    ],
  ],
});

const envelope = (
  to: string,
  data: Hex,
  chainId: number
): WalletRequestEnvelope => {
  const issuedAt = Date.now();
  return {
    v: 1,
    id: ID,
    scheme: "localcore6529",
    origin: globalThis.location.origin,
    issuedAt,
    expiresAt: issuedAt + 300_000,
    request: {
      method: "eth_sendTransaction",
      params: [{ from: ADDRESS, to, data, value: "0x0" }],
      address: ADDRESS,
      chainId,
    },
  };
};

async function fragmentFor(value: WalletRequestEnvelope): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const fragment = buildWalletRequestFragment(
    bytes,
    await shell.signMessage({ message: { raw: bytes } })
  );
  if (fragment === null) throw new Error("fragment too large");
  return fragment;
}

const sendButton = () => screen.getByRole("button", { name: "Send in wallet" });

beforeEach(() => {
  jest.clearAllMocks();
  account = { isConnected: true, address: ADDRESS, chainId: 1 };
  globalThis.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ signer: shell.address }),
  })) as unknown as typeof fetch;
  call.mockResolvedValue({ data: "0x" });
  getCode.mockResolvedValue(undefined);
  commonApiFetch.mockResolvedValue({ handle: "recipient6529" });
});

describe("BrowserWalletRequestPanel: NFT transfers", () => {
  it("shows the recipient in groups with its 6529 profile and needs the box", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(MEMES, batchTransfer, 1))}
      />
    );
    expect(
      await screen.findByText("Transfer several NFTs")
    ).toBeInTheDocument();
    const address = screen.getByLabelText(
      "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
    );
    expect(within(address).getByText("Ab58")).toBeInTheDocument();
    expect(within(address).getByText("eC9B")).toBeInTheDocument();
    expect(
      await screen.findByText("6529 profile: recipient6529")
    ).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `identities/${RECIPIENT}`,
    });
    expect(screen.getByText(/not part of the transaction/)).toBeInTheDocument();
    expect(screen.getByText("Number")).toBeInTheDocument();
    await screen.findByText("Checked: this transaction would go through now.");
    expect(sendButton()).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "I checked that this is the right recipient. Transfers cannot be undone.",
      })
    );
    expect(sendButton()).toBeEnabled();
    expect(screen.queryByText(/This address is a contract/)).toBeNull();
  });

  it("warns when the recipient is a contract and says when no profile exists", async () => {
    getCode.mockResolvedValue("0x6080");
    commonApiFetch.mockRejectedValue({ status: 404 });
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(MEMES, batchTransfer, 1))}
      />
    );
    expect(
      await screen.findByText(/This address is a contract/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No 6529 profile was found for this address.")
    ).toBeInTheDocument();
  });
});

describe("BrowserWalletRequestPanel: provenance publishing", () => {
  beforeEach(() => {
    account = { isConnected: true, address: ADDRESS, chainId: SEPOLIA };
  });

  it("shows every record and sends once the sender may publish", async () => {
    readContract.mockImplementation(
      async ({ functionName }: { functionName: string }) =>
        functionName === "owner"
          ? "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68"
          : true
    );
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(REGISTRY, publish, SEPOLIA))}
      />
    );
    expect(
      await screen.findByText("Publish records to 6529 Provenance")
    ).toBeInTheDocument();
    expect(screen.getByText("Record 1")).toBeInTheDocument();
    expect(screen.getByText("Record 2")).toBeInTheDocument();
    expect(screen.getByText("0 (a new subject)")).toBeInTheDocument();
    expect(screen.getByText(word("a2"))).toBeInTheDocument();
    expect(screen.getByText(`SHA-256 ${word("11")}`)).toBeInTheDocument();
    expect(screen.getByText(`Keccak-256 ${word("33")}`)).toBeInTheDocument();
    expect(screen.getByText(/^bafkrei/)).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Checked: this wallet may publish to this registry."
      )
    ).toBeInTheDocument();
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "isPublisher",
        args: ["0x1111111111111111111111111111111111111111"],
      })
    );
    await waitFor(() => expect(sendButton()).toBeEnabled());
  });

  it("blocks a sender that is neither a publisher nor the owner", async () => {
    readContract.mockImplementation(
      async ({ functionName }: { functionName: string }) =>
        functionName === "owner"
          ? "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68"
          : false
    );
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(REGISTRY, publish, SEPOLIA))}
      />
    );
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("alert")
          .some((element) =>
            /neither a publisher nor the owner/.test(element.textContent ?? "")
          )
      ).toBe(true)
    );
    expect(sendButton()).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Send anyway" })
    ).not.toBeInTheDocument();
  });

  it("accepts the registry owner as sender", async () => {
    readContract.mockImplementation(
      async ({ functionName }: { functionName: string }) =>
        functionName === "owner" ? ADDRESS : false
    );
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(REGISTRY, publish, SEPOLIA))}
      />
    );
    expect(
      await screen.findByText(
        "Checked: this wallet may publish to this registry."
      )
    ).toBeInTheDocument();
  });
});
