import { serializeTypedData, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import {
  desktopBrowserWalletConnector,
  type PreparedWalletRequest,
} from "@/wagmiConfig/desktopBrowserWalletConnector";

// Public development key (Hardhat/Anvil account 0); never funded.
const wallet = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const stranger = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

const typedData = {
  domain: { name: "6529", version: "1", chainId: 1 },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    Note: [{ name: "text", type: "string" }],
  },
  primaryType: "Note",
  message: { text: "hello" },
} as const;

function setup(
  address: string | null = wallet.address,
  sendsTransactions = false
) {
  const emit = jest.fn();
  const runRequest = jest.fn();
  const onTransactionRefused = jest.fn();
  const prepare = jest.fn<PreparedWalletRequest | null, [unknown]>(() => ({
    fingerprint: null,
  }));
  const connector = desktopBrowserWalletConnector({
    getAddress: () => address,
    prepare,
    runRequest,
    onTransactionRefused,
    sendsTransactions: () => sendsTransactions,
  })({
    chains: [mainnet, sepolia],
    emitter: { emit },
  } as never);
  return { connector, emit, runRequest, prepare, onTransactionRefused };
}

const request = async (
  connector: ReturnType<typeof setup>["connector"],
  method: string,
  params?: unknown
) => {
  const provider = (await connector.getProvider()) as {
    request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  };
  return provider.request({ method, params });
};

describe("desktopBrowserWalletConnector", () => {
  it("reports the signed-in address and answers chain questions itself", async () => {
    const { connector, runRequest } = setup();
    await expect(connector.connect({})).resolves.toEqual({
      accounts: [wallet.address],
      chainId: 1,
    });
    await expect(connector.getAccounts()).resolves.toEqual([wallet.address]);
    await expect(connector.isAuthorized()).resolves.toBe(true);
    await expect(request(connector, "eth_chainId")).resolves.toBe("0x1");
    await expect(request(connector, "eth_accounts")).resolves.toEqual([
      wallet.address,
    ]);
    expect(runRequest).not.toHaveBeenCalled();
  });

  it("switches only between configured chains, locally", async () => {
    const { connector, emit, runRequest } = setup();
    await expect(
      connector.switchChain?.({ chainId: sepolia.id })
    ).resolves.toBe(sepolia);
    expect(emit).toHaveBeenCalledWith("change", { chainId: sepolia.id });
    await expect(connector.getChainId()).resolves.toBe(sepolia.id);
    await expect(connector.switchChain?.({ chainId: 10 })).rejects.toThrow();
    expect(runRequest).not.toHaveBeenCalled();
  });

  it("is not authorized without a browser-wallet profile", async () => {
    const { connector } = setup(null);
    await expect(connector.isAuthorized()).resolves.toBe(false);
    await expect(connector.connect({})).rejects.toMatchObject({ code: 4100 });
    await expect(
      request(connector, "personal_sign", [toHex("hi"), wallet.address])
    ).rejects.toMatchObject({ code: 4100 });
  });

  it.each([
    "eth_sendTransaction",
    "eth_sign",
    "wallet_sendCalls",
    "eth_signTypedData_v3",
    "wallet_addEthereumChain",
  ])("does not forward %s", async (method) => {
    const { connector, runRequest } = setup();
    await expect(request(connector, method, [])).rejects.toMatchObject({
      code: 4200,
    });
    expect(runRequest).not.toHaveBeenCalled();
  });

  it.each([
    ["eth_sendTransaction", 1],
    ["wallet_sendTransaction", 1],
    ["eth_signTransaction", 1],
    ["wallet_sendCalls", 1],
    ["eth_sign", 0],
    ["wallet_addEthereumChain", 0],
  ])(
    "points %s to the website only when it is a transaction",
    async (method, calls) => {
      const { connector, onTransactionRefused } = setup();
      await expect(request(connector, method, [])).rejects.toMatchObject({
        code: 4200,
      });
      expect(onTransactionRefused).toHaveBeenCalledTimes(calls);
    }
  );

  it("forwards a message and returns the signature only if it is the account's", async () => {
    const { connector, runRequest } = setup();
    const message = toHex("6529 Action");
    const signature = await wallet.signMessage({ message: { raw: message } });
    runRequest.mockResolvedValue({ ok: true, value: signature });
    await expect(
      request(connector, "personal_sign", [message, wallet.address])
    ).resolves.toBe(signature);
    expect(runRequest).toHaveBeenCalledWith(
      {
        method: "personal_sign",
        params: [message, wallet.address],
        address: wallet.address,
        chainId: 1,
      },
      null
    );

    runRequest.mockResolvedValue({
      ok: true,
      value: await stranger.signMessage({ message: { raw: message } }),
    });
    await expect(
      request(connector, "personal_sign", [message, wallet.address])
    ).rejects.toMatchObject({ code: -32603 });
  });

  it("checks a typed-data signature against the exact request", async () => {
    const { connector, runRequest } = setup();
    const params = [wallet.address, serializeTypedData(typedData as never)];
    const { EIP712Domain: _domain, ...types } = typedData.types;
    const signature = await wallet.signTypedData({ ...typedData, types });
    runRequest.mockResolvedValue({ ok: true, value: signature });
    await expect(
      request(connector, "eth_signTypedData_v4", params)
    ).resolves.toBe(signature);

    const other = await wallet.signTypedData({
      ...typedData,
      types,
      message: { text: "other" },
    });
    runRequest.mockResolvedValue({ ok: true, value: other });
    await expect(
      request(connector, "eth_signTypedData_v4", params)
    ).rejects.toMatchObject({ code: -32603 });
  });

  it.each([
    ["address-first personal_sign", (m: string) => [wallet.address, m]],
    ["an extra parameter", (m: string) => [m, wallet.address, "extra"]],
    ["another signer", (m: string) => [m, stranger.address]],
    ["a non-hex message", () => ["hello", wallet.address]],
    ["a non-string message", () => [42, wallet.address]],
    ["no parameters", () => undefined],
  ])("refuses %s without asking the shell", async (_label, makeParams) => {
    const { connector, runRequest } = setup();
    await expect(
      request(connector, "personal_sign", makeParams(toHex("6529 Action")))
    ).rejects.toMatchObject({ code: 4200 });
    expect(runRequest).not.toHaveBeenCalled();
  });

  it("refuses typed data passed as an object, another signer or swapped", async () => {
    const { connector, runRequest } = setup();
    const json = serializeTypedData(typedData as never);
    for (const params of [
      [wallet.address, typedData],
      [stranger.address, json],
      [json, wallet.address],
      [wallet.address, json, "extra"],
    ]) {
      await expect(
        request(connector, "eth_signTypedData_v4", params)
      ).rejects.toMatchObject({ code: 4200 });
    }
    expect(runRequest).not.toHaveBeenCalled();
  });

  it("sends the shell exactly the validated request", async () => {
    const { connector, runRequest } = setup();
    const json = serializeTypedData(typedData as never);
    runRequest.mockResolvedValue({ ok: false, code: "rejected" });
    await expect(
      request(connector, "eth_signTypedData_v4", [
        wallet.address.toLowerCase(),
        json,
      ])
    ).rejects.toMatchObject({ code: 4001 });
    expect(runRequest).toHaveBeenCalledWith(
      {
        method: "eth_signTypedData_v4",
        params: [wallet.address, json],
        address: wallet.address,
        chainId: 1,
      },
      null
    );
  });

  it("adds the prepared context to a message and passes its fingerprint", async () => {
    const { connector, runRequest, prepare } = setup();
    prepare.mockReturnValue({ context: '{"v":1}', fingerprint: "aa…bb" });
    const message = toHex("6529 Action");
    const signature = await wallet.signMessage({ message: { raw: message } });
    runRequest.mockResolvedValue({ ok: true, value: signature });
    await expect(
      request(connector, "personal_sign", [message, wallet.address])
    ).resolves.toBe(signature);
    expect(runRequest).toHaveBeenCalledWith(
      {
        method: "personal_sign",
        params: [message, wallet.address],
        address: wallet.address,
        chainId: 1,
        context: '{"v":1}',
      },
      "aa…bb"
    );

    // Typed data never carries context.
    runRequest.mockClear();
    runRequest.mockResolvedValue({ ok: false, code: "rejected" });
    const json = serializeTypedData(typedData as never);
    await expect(
      request(connector, "eth_signTypedData_v4", [wallet.address, json])
    ).rejects.toMatchObject({ code: 4001 });
    expect(runRequest.mock.calls[0]![0]).not.toHaveProperty("context");
  });

  it("refuses in the app what the browser page would refuse", async () => {
    const { connector, runRequest, prepare } = setup();
    prepare.mockReturnValue(null);
    await expect(
      request(connector, "personal_sign", [toHex("free text"), wallet.address])
    ).rejects.toMatchObject({ code: 4200 });
    expect(runRequest).not.toHaveBeenCalled();
  });

  it.each([
    ["rejected", 4001],
    ["cancelled", 4001],
    ["not-signed-in", 4100],
    ["wrong-account", 4100],
    ["refused", 4200],
    ["unsupported", 4200],
    ["invalid", 4200],
    ["expired", -32603],
    ["busy", -32603],
    ["failed", -32603],
  ])("maps a %s answer to EIP-1193 code %d", async (code, expected) => {
    const { connector, runRequest } = setup();
    runRequest.mockResolvedValue({ ok: false, code });
    await expect(
      request(connector, "personal_sign", [toHex("hi"), wallet.address])
    ).rejects.toMatchObject({ code: expected });
  });

  describe("eth_sendTransaction", () => {
    const HASH = `0x${"cd".repeat(32)}`;
    const TO = "0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be";
    const viemTransaction = (overrides: Record<string, unknown> = {}) => ({
      from: wallet.address,
      to: TO,
      value: "0x0e8f",
      ...overrides,
    });

    it("forwards the canonical transaction and returns the hash", async () => {
      const { connector, runRequest, prepare } = setup(wallet.address, true);
      runRequest.mockResolvedValue({ ok: true, value: HASH });
      await expect(
        request(connector, "eth_sendTransaction", [viemTransaction()])
      ).resolves.toBe(HASH);
      expect(runRequest).toHaveBeenCalledWith(
        {
          method: "eth_sendTransaction",
          params: [
            {
              from: wallet.address.toLowerCase(),
              to: TO.toLowerCase(),
              data: "0x",
              value: "0xe8f",
            },
          ],
          address: wallet.address,
          chainId: 1,
        },
        null
      );
      expect(prepare).toHaveBeenCalledWith(
        expect.objectContaining({ method: "eth_sendTransaction" })
      );
    });

    it("points to the website when this 6529 Desktop sends no transactions", async () => {
      const { connector, runRequest, onTransactionRefused } = setup();
      await expect(
        request(connector, "eth_sendTransaction", [viemTransaction()])
      ).rejects.toMatchObject({ code: 4200 });
      expect(onTransactionRefused).toHaveBeenCalledTimes(1);
      expect(runRequest).not.toHaveBeenCalled();
    });

    it.each([
      ["gas", { gas: "0x5208" }],
      ["fees", { maxFeePerGas: "0x1" }],
      ["another sender", { from: stranger.address }],
      ["no recipient", { to: undefined }],
    ])("refuses a transaction with %s", async (_name, overrides) => {
      const { connector, runRequest, onTransactionRefused } = setup(
        wallet.address,
        true
      );
      await expect(
        request(connector, "eth_sendTransaction", [viemTransaction(overrides)])
      ).rejects.toMatchObject({ code: 4200 });
      expect(onTransactionRefused).toHaveBeenCalledTimes(1);
      expect(runRequest).not.toHaveBeenCalled();
    });

    it("stops when the app's allow-list refuses it", async () => {
      const { connector, runRequest, prepare } = setup(wallet.address, true);
      prepare.mockReturnValue(null);
      await expect(
        request(connector, "eth_sendTransaction", [viemTransaction()])
      ).rejects.toMatchObject({ code: 4200 });
      expect(runRequest).not.toHaveBeenCalled();
    });

    it("reports a transaction the shell could not confirm as an error", async () => {
      const { connector, runRequest } = setup(wallet.address, true);
      runRequest.mockResolvedValue({
        ok: false,
        code: "unverified",
        reason: "transaction-not-visible",
        transactionHash: HASH,
      });
      await expect(
        request(connector, "eth_sendTransaction", [viemTransaction()])
      ).rejects.toMatchObject({ code: -32603 });
    });

    it("never forwards wallet_sendTransaction", async () => {
      const { connector, runRequest } = setup(wallet.address, true);
      await expect(
        request(connector, "wallet_sendTransaction", [viemTransaction()])
      ).rejects.toMatchObject({ code: 4200 });
      expect(runRequest).not.toHaveBeenCalled();
    });
  });
});
