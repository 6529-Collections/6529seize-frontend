import { decryptData } from "@/components/app-wallets/app-wallet-helpers";
import {
  type AppWalletSigningRequest,
  confirmAppWalletSigningRequest,
  describeAppWalletMessage,
  describeAppWalletTransaction,
  describeAppWalletTypedData,
  setAppWalletSigningConfirmationDelegate,
} from "@/wagmiConfig/appWalletSigningConfirmation";
import { createAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";
import {
  http,
  parseEther,
  recoverMessageAddress,
  UserRejectedRequestError,
  type Address,
  type Chain,
  type LocalAccount,
  type Transport,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, polygon } from "viem/chains";

jest.mock("@/components/app-wallets/app-wallet-helpers", () => ({
  decryptData: jest.fn(),
}));

// A well-known local development key; it never holds real funds.
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = privateKeyToAccount(TEST_PRIVATE_KEY);
const RECIPIENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const appWallet = {
  address: signer.address,
  address_hashed: "hashed",
  private_key: "encrypted",
  name: "Test Wallet",
} as Parameters<typeof createAppWalletConnector>[1]["appWallet"];

const mockDecryptData = jest.mocked(decryptData);

type ConnectorInstance = {
  connect: () => Promise<unknown>;
  getClient: () => Promise<WalletClient>;
  icon: string;
};

function setUpConnector(transports?: Record<number, Transport>) {
  const createFn = createAppWalletConnector(
    [mainnet as Chain],
    { appWallet },
    () => Promise.resolve("password")
  );
  const setup = (next?: Record<number, Transport>) =>
    (createFn as unknown as (config: unknown) => ConnectorInstance)({
      chains: [mainnet],
      emitter: { emit: jest.fn(), on: jest.fn(), off: jest.fn() },
      transports: next,
    });
  return { instance: setup(transports), setup };
}

function createInstance(
  transports?: Record<number, Transport>
): ConnectorInstance {
  return setUpConnector(transports).instance;
}

async function connectedAccount(
  transports?: Record<number, Transport>
): Promise<{ client: WalletClient; account: LocalAccount }> {
  const instance = createInstance(transports);
  await instance.connect();
  const client = await instance.getClient();
  return { client, account: client.account as LocalAccount };
}

let unregister: (() => void) | null = null;

function useDelegate(
  answer: (request: AppWalletSigningRequest) => boolean | Promise<boolean>
): jest.Mock {
  const delegate = jest.fn(async (request: AppWalletSigningRequest) =>
    answer(request)
  );
  unregister = setAppWalletSigningConfirmationDelegate(delegate);
  return delegate;
}

beforeEach(() => {
  mockDecryptData.mockImplementation(async (_address, value) =>
    value === "hashed" ? signer.address : TEST_PRIVATE_KEY
  );
});

afterEach(() => {
  unregister?.();
  unregister = null;
  jest.clearAllMocks();
});

describe("app wallet signing confirmation", () => {
  it("signs a message only after the app dialog approves the exact text", async () => {
    const delegate = useDelegate(() => true);
    const { account } = await connectedAccount();

    const signature = await account.signMessage({ message: "Sign in to 6529" });

    expect(delegate).toHaveBeenCalledTimes(1);
    expect(delegate).toHaveBeenCalledWith({
      kind: "message",
      walletAddress: signer.address,
      text: "Sign in to 6529",
      rawHex: null,
      canShowContent: true,
    });
    await expect(
      recoverMessageAddress({ message: "Sign in to 6529", signature })
    ).resolves.toBe(signer.address);
  });

  it("rejects with the standard user-rejected error when cancelled", async () => {
    useDelegate(() => false);
    const { client } = await connectedAccount();

    const result = client.signMessage({
      account: client.account!,
      message: "hello",
    });

    await expect(result).rejects.toBeInstanceOf(UserRejectedRequestError);
    await expect(result).rejects.toMatchObject({ code: 4001 });
  });

  it("rejects every request when no confirmation dialog is mounted", async () => {
    const { account } = await connectedAccount();

    await expect(
      account.signMessage({ message: "hello" })
    ).rejects.toMatchObject({ code: 4001 });
  });

  it("treats a failing dialog as a cancellation", async () => {
    useDelegate(() => Promise.reject(new Error("dialog failed")));
    const { account } = await connectedAccount();

    await expect(
      account.signMessage({ message: "hello" })
    ).rejects.toMatchObject({ code: 4001 });
  });

  it("describes a transaction before signing it", async () => {
    const delegate = useDelegate(() => true);
    const { account } = await connectedAccount();

    const signed = await account.signTransaction({
      chainId: 1,
      to: RECIPIENT,
      value: parseEther("0.06529"),
      data: "0xa9059cbb0000",
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
    });

    expect(signed).toMatch(/^0x02/);
    expect(delegate).toHaveBeenCalledWith({
      kind: "transaction",
      walletAddress: signer.address,
      to: RECIPIENT,
      valueWei: parseEther("0.06529"),
      chainId: 1,
      chainName: "Ethereum",
      nativeCurrency: { symbol: "ETH", decimals: 18 },
      callDataBytes: 6,
      selector: "0xa9059cbb",
      canShowContent: true,
    });
  });

  it("does not sign a cancelled transaction", async () => {
    useDelegate(() => false);
    const { account } = await connectedAccount();

    await expect(
      account.signTransaction({
        chainId: 1,
        to: RECIPIENT,
        value: 1n,
        nonce: 0,
        gas: 21_000n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
      })
    ).rejects.toMatchObject({ code: 4001 });
  });

  it("describes typed data by primary type and domain", async () => {
    const delegate = useDelegate(() => true);
    const { account } = await connectedAccount();

    await account.signTypedData({
      domain: {
        name: "6529",
        version: "1",
        chainId: 1,
        verifyingContract: RECIPIENT,
      },
      types: { Grant: [{ name: "amount", type: "uint256" }] },
      primaryType: "Grant",
      message: { amount: 5n },
    });

    expect(delegate).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "typedData",
        primaryType: "Grant",
        domainName: "6529",
        domainChainId: 1,
        domainChainName: "Ethereum",
        verifyingContract: RECIPIENT,
        messageJson: expect.stringContaining('"amount": "5"'),
      })
    );
  });

  it.each([
    ["a number", 1, 1],
    ["a hex string", "0x1", 1],
    ["a decimal string", "1", 1],
    ["an unparseable string", "mainnet", null],
  ])(
    "reads a typed-data domain chain ID given as %s",
    (_label, chainId, expected) => {
      const request = describeAppWalletTypedData(
        signer.address,
        {
          domain: { name: "6529", chainId },
          types: { Grant: [{ name: "amount", type: "uint256" }] },
          primaryType: "Grant",
          message: { amount: 1n },
        } as never,
        [mainnet as Chain]
      );

      expect(request).toMatchObject({
        domainChainId: expected,
        domainChainName: expected === null ? null : "Ethereum",
      });
    }
  );

  it("shows one request at a time", async () => {
    let releaseFirst: (approved: boolean) => void = () => undefined;
    const delegate = useDelegate((request) =>
      request.kind === "message" && request.text === "first"
        ? new Promise<boolean>((resolve) => {
            releaseFirst = resolve;
          })
        : true
    );
    const { account } = await connectedAccount();

    const first = account.signMessage({ message: "first" });
    const second = account.signMessage({ message: "second" });
    await Promise.resolve();
    await Promise.resolve();
    expect(delegate).toHaveBeenCalledTimes(1);

    releaseFirst(false);
    await expect(first).rejects.toMatchObject({ code: 4001 });
    await expect(second).resolves.toMatch(/^0x/);
    expect(delegate).toHaveBeenCalledTimes(2);
  });

  it("does not expose raw hash signing or account delegation", async () => {
    const { account } = await connectedAccount();

    expect(account.sign).toBeUndefined();
    expect(account.signAuthorization).toBeUndefined();
  });

  it("uses the transport of the wagmi config it is installed on", async () => {
    const configured = http("https://rpc.example.test/");
    const { client } = await connectedAccount({ [mainnet.id]: configured });

    expect(client.transport["url"]).toBe("https://rpc.example.test/");
  });

  it("never falls back to viem's default public RPC", async () => {
    const { client } = await connectedAccount();

    expect(client.transport["url"]).toBe("https://rpc1.6529.io");
  });

  it("uses a locally generated icon", () => {
    expect(createInstance().icon).toMatch(/^data:image\/svg\+xml/);
  });

  it("rebuilds the wallet client when the installing config's transports change", async () => {
    const { instance, setup } = setUpConnector();
    await instance.connect();
    expect((await instance.getClient()).transport["url"]).toBe(
      "https://rpc1.6529.io"
    );

    setup({ [mainnet.id]: http("https://rpc.example.test/") });

    expect((await instance.getClient()).transport["url"]).toBe(
      "https://rpc.example.test/"
    );
  });

  it("labels a transaction with the chain's own native token", () => {
    const request = describeAppWalletTransaction(
      signer.address,
      { chainId: polygon.id, to: RECIPIENT, value: 1n },
      [mainnet, polygon]
    );

    expect(request).toMatchObject({
      chainName: polygon.name,
      nativeCurrency: {
        symbol: polygon.nativeCurrency.symbol,
        decimals: polygon.nativeCurrency.decimals,
      },
    });
    expect(polygon.nativeCurrency.symbol).not.toBe("ETH");
    expect(
      describeAppWalletTransaction(
        signer.address,
        { chainId: 999_999, to: RECIPIENT },
        [mainnet]
      )
    ).toMatchObject({ chainName: null, nativeCurrency: null });
  });

  it.each([
    ["data shorter than 4 bytes", RECIPIENT as Address, "0xa9059c" as const, 3],
    ["contract creation code", undefined, "0x6080604052" as const, 5],
  ])("shows no function selector for %s", (_label, to, data, bytes) => {
    expect(
      describeAppWalletTransaction(signer.address, { chainId: 1, to, data }, [
        mainnet,
      ])
    ).toMatchObject({ to: to ?? null, callDataBytes: bytes, selector: null });
  });

  it("marks typed data and messages it cannot show as not signable", () => {
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;

    expect(
      describeAppWalletTypedData(
        signer.address,
        {
          domain: { name: "6529" },
          types: { Grant: [{ name: "self", type: "string" }] },
          primaryType: "Grant",
          message: circular,
        } as never,
        [mainnet]
      )
    ).toMatchObject({ messageJson: null, canShowContent: false });
    expect(
      describeAppWalletMessage(signer.address, { raw: "not hex" as never })
    ).toMatchObject({ rawHex: null, canShowContent: false });
    expect(
      describeAppWalletMessage(signer.address, { raw: "0x48656c6c6f" })
    ).toMatchObject({ rawHex: "0x48656c6c6f", canShowContent: true });
  });

  it("rejects a request whose host never answers once that host goes away", async () => {
    const hanging = setAppWalletSigningConfirmationDelegate(
      () => new Promise<boolean>(() => undefined)
    );
    const message = describeAppWalletMessage(signer.address, "first");

    const first = confirmAppWalletSigningRequest(message);
    await new Promise((resolve) => setTimeout(resolve, 0));
    hanging();
    await expect(first).rejects.toMatchObject({ code: 4001 });

    const delegate = useDelegate(() => true);
    await expect(
      confirmAppWalletSigningRequest(
        describeAppWalletMessage(signer.address, "second")
      )
    ).resolves.toBeUndefined();
    expect(delegate).toHaveBeenCalledTimes(1);
  });

  it("rejects the open request when a new host takes over", async () => {
    setAppWalletSigningConfirmationDelegate(
      () => new Promise<boolean>(() => undefined)
    );
    const first = confirmAppWalletSigningRequest(
      describeAppWalletMessage(signer.address, "first")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const delegate = useDelegate(() => true);
    await expect(first).rejects.toMatchObject({ code: 4001 });
    await expect(
      confirmAppWalletSigningRequest(
        describeAppWalletMessage(signer.address, "second")
      )
    ).resolves.toBeUndefined();
    expect(delegate).toHaveBeenCalledTimes(1);
  });
});
