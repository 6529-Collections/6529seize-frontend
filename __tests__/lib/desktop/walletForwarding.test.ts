import {
  getAddress,
  getTypesForEIP712Domain,
  serializeTypedData as serializeTypes,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildWalletRequestFragment,
  buildWalletResultDeepLink,
  encodeWalletRequestEnvelope,
  isWalletRequestSignedBy,
  parseWalletBridgeResponse,
  parseWalletRequest,
  parseWalletRequestFragment,
  parseWalletResult,
  readWalletMessageText,
  WALLET_REQUEST_TTL_MS,
  walletRequestCode,
  type WalletRequestEnvelope,
  type WalletRequestInput,
} from "@/lib/desktop/walletForwarding";

// Public development keys (Hardhat/Anvil accounts 0 and 1); never funded.
const SHELL_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const OTHER_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const shell = privateKeyToAccount(SHELL_KEY);
const other = privateKeyToAccount(OTHER_KEY);

const ADDRESS = "0x1111111111111111111111111111111111111111";
const CHECKSUMMED = "0x1111111111111111111111111111111111111111";
const OTHER_ADDRESS = "0x2222222222222222222222222222222222222222";
const CONTRACT = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const CHAINS = [1] as const;
const NOW = 1_800_000_000_000;
const ORIGIN = "http://localhost:6529";
const ID = "A".repeat(43);
const SIGNATURE = `0x${"ab".repeat(65)}`;
const TX_HASH = `0x${"cd".repeat(32)}`;

const typedData = {
  domain: { name: "6529", version: "1", chainId: 1 },
  types: {
    Grant: [
      { name: "wallet", type: "address" },
      { name: "items", type: "uint256[]" },
    ],
  },
  primaryType: "Grant",
  message: { wallet: ADDRESS, items: [1n, 2n] },
} as const;

// What viem's signTypedData action sends for a JSON-RPC account: the domain
// type is added from the domain before serializing.
const serializeTypedData = (value: {
  readonly domain: Record<string, unknown>;
  readonly types: Record<string, readonly { name: string; type: string }[]>;
  readonly primaryType: string;
  readonly message: Record<string, unknown>;
}) =>
  serializeTypes({
    ...value,
    types: {
      EIP712Domain: getTypesForEIP712Domain({ domain: value.domain as never }),
      ...value.types,
    },
  } as never);

const input = (
  method: string,
  params: unknown,
  overrides: Partial<WalletRequestInput> = {}
): WalletRequestInput => ({
  method,
  params,
  address: ADDRESS,
  chainId: 1,
  ...overrides,
});

const parse = (value: WalletRequestInput) => parseWalletRequest(value, CHAINS);
const problemOf = (value: WalletRequestInput) => {
  const result = parse(value);
  return result.ok ? null : result.problem;
};

describe("parseWalletRequest: common rules", () => {
  it("refuses methods that are not forwarded", () => {
    for (const method of [
      "eth_sign",
      "eth_signTypedData",
      "eth_signTypedData_v3",
      "wallet_sendCalls",
      "eth_accounts",
      "",
    ]) {
      expect(problemOf(input(method, []))).toBe("unsupported-method");
    }
  });

  it("refuses an invalid bound address or a chain the app does not use", () => {
    const params = [toHex("hi"), ADDRESS];
    expect(problemOf(input("personal_sign", params, { address: "0x12" }))).toBe(
      "wrong-address"
    );
    for (const chainId of [11155111, 0, 1.5, Number.NaN]) {
      expect(problemOf(input("personal_sign", params, { chainId }))).toBe(
        "wrong-chain"
      );
    }
    expect(
      parseWalletRequest(
        input("personal_sign", params, { chainId: 11155111 }),
        [1, 11155111]
      ).ok
    ).toBe(true);
  });

  it("refuses non-array params and non-object input", () => {
    expect(problemOf(input("personal_sign", { 0: "0x" }))).toBe(
      "invalid-params"
    );
    expect(parseWalletRequest(null as never, CHAINS)).toEqual({
      ok: false,
      problem: "invalid-params",
    });
  });
});

describe("parseWalletRequest: personal_sign", () => {
  it("keeps the exact bytes and checksums the signer", () => {
    const message = toHex("Vote for entry 7");
    expect(
      parse(
        input("personal_sign", [
          message,
          ADDRESS.toUpperCase().replace("0X", "0x"),
        ])
      )
    ).toEqual({
      ok: true,
      value: {
        method: "personal_sign",
        address: CHECKSUMMED,
        chainId: 1,
        message,
      },
    });
  });

  it("refuses another signer, malformed or empty bytes, and big messages", () => {
    const message = toHex("hi");
    expect(problemOf(input("personal_sign", [message, OTHER_ADDRESS]))).toBe(
      "wrong-address"
    );
    for (const params of [
      ["hi", ADDRESS],
      ["0xabc", ADDRESS],
      ["0x", ADDRESS],
      [message],
      [message, ADDRESS, "extra"],
    ]) {
      expect(problemOf(input("personal_sign", params))).toBe("invalid-params");
    }
    const big = `0x${"61".repeat(8 * 1024 + 1)}`;
    expect(problemOf(input("personal_sign", [big, ADDRESS]))).toBe("too-large");
  });
});

describe("parseWalletRequest: eth_signTypedData_v4", () => {
  // Exactly what viem sends for a JSON-RPC account.
  const payload = serializeTypedData(typedData);

  it("accepts viem's serialized typed data", () => {
    const result = parse(input("eth_signTypedData_v4", [ADDRESS, payload]));
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.method !== "eth_signTypedData_v4") return;
    expect(result.value.typedData.primaryType).toBe("Grant");
    expect(result.value.typedData.types["EIP712Domain"]).toBeDefined();
    expect(result.value.typedData.message).toEqual({
      wallet: ADDRESS,
      items: ["1", "2"],
    });
  });

  it("checks the signer, size and domain chain", () => {
    expect(
      problemOf(input("eth_signTypedData_v4", [OTHER_ADDRESS, payload]))
    ).toBe("wrong-address");
    expect(
      problemOf(
        input("eth_signTypedData_v4", [ADDRESS, "x".repeat(16 * 1024 + 1)])
      )
    ).toBe("too-large");
    const sepolia = serializeTypedData({
      ...typedData,
      domain: { ...typedData.domain, chainId: 11155111 },
    });
    expect(problemOf(input("eth_signTypedData_v4", [ADDRESS, sepolia]))).toBe(
      "wrong-chain"
    );
    for (const chainId of ["0x1", "1"]) {
      const value = JSON.stringify({
        ...JSON.parse(payload),
        domain: { chainId },
      });
      expect(parse(input("eth_signTypedData_v4", [ADDRESS, value])).ok).toBe(
        true
      );
    }
  });

  it.each([
    ["not JSON", "{"],
    ["not an object", "[]"],
    [
      "no domain",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        domain: null,
      }),
    ],
    [
      "no message",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        message: "x",
      }),
    ],
    [
      "primary type missing",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        primaryType: "Other",
      }),
    ],
    [
      "primary type is the domain",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        primaryType: "EIP712Domain",
      }),
    ],
    [
      "bad type name",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        types: { "bad name": [] },
      }),
    ],
    [
      "bad field",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        types: { Grant: [{ name: "a", type: "uint256 x" }] },
      }),
    ],
    [
      "fields not a list",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        types: { Grant: {} },
      }),
    ],
    [
      "no types",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        types: {},
      }),
    ],
    [
      "bad domain chain",
      JSON.stringify({
        ...JSON.parse(serializeTypedData(typedData)),
        domain: { chainId: "one" },
      }),
    ],
  ])("refuses %s", (_label, value) => {
    expect(problemOf(input("eth_signTypedData_v4", [ADDRESS, value]))).toBe(
      "invalid-params"
    );
  });

  it("refuses an object payload and too many types or fields", () => {
    expect(problemOf(input("eth_signTypedData_v4", [ADDRESS, typedData]))).toBe(
      "invalid-params"
    );
    const manyTypes = Object.fromEntries(
      Array.from({ length: 33 }, (_, i) => [`T${i}`, []])
    );
    const manyFields = {
      Grant: Array.from({ length: 65 }, (_, i) => ({
        name: `f${i}`,
        type: "uint8",
      })),
    };
    for (const types of [manyTypes, manyFields]) {
      const value = JSON.stringify({
        domain: {},
        types,
        primaryType: "Grant",
        message: {},
      });
      expect(problemOf(input("eth_signTypedData_v4", [ADDRESS, value]))).toBe(
        "invalid-params"
      );
    }
  });
});

describe("parseWalletRequest: eth_sendTransaction", () => {
  const tx = (overrides: Record<string, unknown> = {}) => [
    {
      from: ADDRESS,
      to: CONTRACT,
      value: "0x0",
      data: "0xA9059CBB",
      ...overrides,
    },
  ];

  it("normalizes a contract call and keeps fee fields", () => {
    expect(
      parse(
        input(
          "eth_sendTransaction",
          tx({
            gas: "0x5208",
            maxFeePerGas: "0x3B9ACA00",
            chainId: "0x1",
            type: "0x2",
          })
        )
      )
    ).toEqual({
      ok: true,
      value: {
        method: "eth_sendTransaction",
        address: CHECKSUMMED,
        chainId: 1,
        transaction: {
          to: getAddress(CONTRACT),
          value: "0x0",
          data: "0xa9059cbb",
          gas: "0x5208",
          maxFeePerGas: "0x3b9aca00",
          type: "0x2",
        },
      },
    });
  });

  it("defaults missing call data to empty", () => {
    const result = parse(
      input("eth_sendTransaction", [{ from: ADDRESS, to: CONTRACT }])
    );
    expect(
      result.ok && result.value.method === "eth_sendTransaction"
        ? result.value.transaction
        : null
    ).toEqual({ to: getAddress(CONTRACT), data: "0x" });
  });

  it.each([
    ["another sender", tx({ from: OTHER_ADDRESS }), "wrong-address"],
    ["no sender", tx({ from: undefined }), "wrong-address"],
    ["contract creation", tx({ to: null }), "contract-creation"],
    ["no recipient", tx({ to: undefined }), "contract-creation"],
    ["account delegation", tx({ authorizationList: [] }), "account-delegation"],
    ["another chain", tx({ chainId: 11155111 }), "wrong-chain"],
    ["bad chain", tx({ chainId: "x" }), "invalid-params"],
    ["unknown field", tx({ blobs: [] }), "invalid-params"],
    ["bad recipient", tx({ to: "0x12" }), "invalid-params"],
    ["bad data", tx({ data: "0xabc" }), "invalid-params"],
    ["bad value", tx({ value: "100" }), "invalid-params"],
    ["leading zero quantity", tx({ value: "0x01" }), "invalid-params"],
    ["unknown type", tx({ type: "0x4" }), "invalid-params"],
    ["big data", tx({ data: `0x${"00".repeat(12 * 1024 + 1)}` }), "too-large"],
    ["two transactions", [...tx(), ...tx()], "invalid-params"],
    ["not an object", ["0x"], "invalid-params"],
  ])("refuses %s", (_label, params, problem) => {
    expect(problemOf(input("eth_sendTransaction", params))).toBe(problem);
  });
});

describe("readWalletMessageText", () => {
  it("returns readable text", () => {
    expect(readWalletMessageText(toHex("Line 1\nLine 2\tend"))).toBe(
      "Line 1\nLine 2\tend"
    );
    expect(readWalletMessageText(toHex("Grüße 6529"))).toBe("Grüße 6529");
  });

  it("refuses bytes it cannot show honestly", () => {
    for (const hex of [
      "0x",
      "0xzz",
      "0xff",
      toHex("   "),
      toHex("a\u0000b"),
      toHex("pay ‮evil"),
      toHex("x⁦y"),
      toHex("del\u007F"),
    ] as const) {
      expect(readWalletMessageText(hex as `0x${string}`)).toBeNull();
    }
  });
});

describe("request envelope", () => {
  const envelope = (
    overrides: Partial<WalletRequestEnvelope> = {}
  ): WalletRequestEnvelope => ({
    v: 1,
    id: ID,
    scheme: "core6529",
    origin: ORIGIN,
    issuedAt: NOW,
    expiresAt: NOW + WALLET_REQUEST_TTL_MS,
    request: input("personal_sign", [toHex("hello"), ADDRESS]),
    ...overrides,
  });
  const context = { origin: ORIGIN, now: NOW + 1000, allowedChainIds: CHAINS };

  const signedFragment = async (
    value: WalletRequestEnvelope | Record<string, unknown>,
    signer = shell
  ) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const signature = await signer.signMessage({ message: { raw: bytes } });
    return buildWalletRequestFragment(bytes, signature);
  };

  it("round-trips and verifies against the shell's signer only", async () => {
    const fragment = await signedFragment(envelope());
    expect(fragment.startsWith("#w=")).toBe(true);
    const parsed = parseWalletRequestFragment(fragment, context);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.envelope.id).toBe(ID);
    expect(parsed.value.request.method).toBe("personal_sign");
    expect(parsed.value.envelopeBytes).toEqual(
      encodeWalletRequestEnvelope(envelope())
    );
    await expect(
      isWalletRequestSignedBy(parsed.value, shell.address)
    ).resolves.toBe(true);
    await expect(
      isWalletRequestSignedBy(parsed.value, shell.address.toLowerCase())
    ).resolves.toBe(true);
    await expect(
      isWalletRequestSignedBy(parsed.value, other.address)
    ).resolves.toBe(false);
    await expect(isWalletRequestSignedBy(parsed.value, "nope")).resolves.toBe(
      false
    );
  });

  it("rejects an envelope changed after signing", async () => {
    const fragment = await signedFragment(envelope());
    const params = new URLSearchParams(fragment.slice(1));
    const tampered = new TextEncoder().encode(
      JSON.stringify(
        envelope({ request: input("personal_sign", [toHex("pay"), ADDRESS]) })
      )
    );
    const forged = parseWalletRequestFragment(
      buildWalletRequestFragment(tampered, params.get("s") as `0x${string}`),
      context
    );
    expect(forged.ok).toBe(true);
    if (!forged.ok) return;
    await expect(
      isWalletRequestSignedBy(forged.value, shell.address)
    ).resolves.toBe(false);
  });

  it("returns false for a signature that recovers to nobody", async () => {
    await expect(
      isWalletRequestSignedBy(
        {
          envelopeBytes: new Uint8Array([1]),
          signature: `0x${"00".repeat(65)}`,
        },
        shell.address
      )
    ).resolves.toBe(false);
  });

  it("reports missing and malformed fragments", async () => {
    const good = await signedFragment(envelope());
    const signature = new URLSearchParams(good.slice(1)).get("s") as string;
    const cases: [string, string][] = [
      ["", "missing"],
      ["#w=abc", "missing"],
      [`#s=${signature}`, "missing"],
      [`#w=abc&s=0x12`, "malformed"],
      [`#w=a*b&s=${signature}`, "malformed"],
      [`#w=${"A".repeat(40 * 1024)}&s=${signature}`, "malformed"],
      [`#w=_w&s=${signature}`, "malformed"],
      [`#w=e30&s=${signature}`, "malformed"],
    ];
    for (const [hash, problem] of cases) {
      expect(parseWalletRequestFragment(hash, context)).toEqual({
        ok: false,
        problem,
      });
    }
  });

  it.each([
    ["version", { v: 2 }],
    ["id", { id: "short" }],
    ["scheme", { scheme: "https" }],
    ["origin", { origin: "https://6529.io" }],
    ["issued time", { issuedAt: 1.5 }],
    ["expiry", { expiresAt: "soon" }],
    ["request", { request: null }],
  ])("refuses a bad %s", async (_label, overrides) => {
    const fragment = await signedFragment({ ...envelope(), ...overrides });
    expect(parseWalletRequestFragment(fragment, context)).toEqual({
      ok: false,
      problem: "malformed",
    });
  });

  it("checks origin, lifetime and the request itself", async () => {
    const otherPort = await signedFragment(
      envelope({ origin: "http://localhost:6530" })
    );
    expect(parseWalletRequestFragment(otherPort, context)).toEqual({
      ok: false,
      problem: "wrong-origin",
    });
    for (const value of [
      envelope({ expiresAt: NOW + 1000 }),
      envelope({ issuedAt: NOW + 120_000, expiresAt: NOW + 130_000 }),
      envelope({ expiresAt: NOW + WALLET_REQUEST_TTL_MS + 1 }),
    ]) {
      expect(
        parseWalletRequestFragment(await signedFragment(value), context)
      ).toEqual({ ok: false, problem: "expired" });
    }
    const wrongSigner = await signedFragment(
      envelope({
        request: input("personal_sign", [toHex("hi"), OTHER_ADDRESS]),
      })
    );
    expect(parseWalletRequestFragment(wrongSigner, context)).toEqual({
      ok: false,
      problem: "wrong-address",
    });
  });
});

describe("walletRequestCode", () => {
  it("is short, stable and differs between ids", () => {
    const code = walletRequestCode(ID);
    expect(code).toMatch(/^[0-9A-F]{3}-[0-9A-F]{3}$/);
    expect(walletRequestCode(ID)).toBe(code);
    expect(walletRequestCode("B".repeat(43))).not.toBe(code);
  });
});

describe("wallet results", () => {
  it("builds the return link the shell parses", () => {
    const link = buildWalletResultDeepLink("stagingcore6529", {
      v: 1,
      id: ID,
      ok: true,
      value: SIGNATURE as `0x${string}`,
    });
    expect(link.startsWith("stagingcore6529://wallet?data=")).toBe(true);
    const data = JSON.parse(
      decodeURIComponent(link.slice("stagingcore6529://wallet?data=".length))
    );
    expect(parseWalletResult(data, "personal_sign")).toEqual({
      v: 1,
      id: ID,
      ok: true,
      value: SIGNATURE,
    });
  });

  it("matches the value to the method", () => {
    const ok = (value: string) => ({ v: 1, id: ID, ok: true, value });
    expect(
      parseWalletResult(
        ok(SIGNATURE.toUpperCase().replace("0X", "0x")),
        "eth_signTypedData_v4"
      )
    ).toEqual(ok(SIGNATURE));
    expect(parseWalletResult(ok(TX_HASH), "eth_sendTransaction")).toEqual(
      ok(TX_HASH)
    );
    expect(parseWalletResult(ok(TX_HASH), "personal_sign")).toBeNull();
    expect(parseWalletResult(ok(SIGNATURE), "eth_sendTransaction")).toBeNull();
  });

  it("accepts known failure codes only", () => {
    for (const code of [
      "rejected",
      "failed",
      "wrong-account",
      "wrong-chain",
      "refused",
    ]) {
      expect(
        parseWalletResult({ v: 1, id: ID, ok: false, code }, "personal_sign")
      ).toEqual({ v: 1, id: ID, ok: false, code });
    }
    expect(
      parseWalletResult(
        { v: 1, id: ID, ok: false, code: "busy" },
        "personal_sign"
      )
    ).toBeNull();
  });

  it("refuses malformed results", () => {
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;
    for (const value of [
      null,
      [],
      "x",
      circular,
      { v: 2, id: ID, ok: true, value: SIGNATURE },
      { v: 1, id: "short", ok: true, value: SIGNATURE },
      { v: 1, id: ID, ok: "yes", value: SIGNATURE },
      { v: 1, id: ID, ok: true, value: SIGNATURE, pad: "x".repeat(2000) },
    ]) {
      expect(parseWalletResult(value, "personal_sign")).toBeNull();
    }
  });
});

describe("parseWalletBridgeResponse", () => {
  it("passes a valid value and known failures", () => {
    expect(
      parseWalletBridgeResponse(
        { ok: true, value: TX_HASH },
        "eth_sendTransaction"
      )
    ).toEqual({ ok: true, value: TX_HASH });
    for (const code of [
      "cancelled",
      "expired",
      "busy",
      "not-signed-in",
      "rejected",
    ]) {
      expect(
        parseWalletBridgeResponse({ ok: false, code }, "personal_sign")
      ).toEqual({
        ok: false,
        code,
      });
    }
  });

  it("turns anything unexpected into a failure", () => {
    for (const value of [
      undefined,
      "0x",
      { ok: true, value: TX_HASH },
      { ok: false, code: "pwned" },
      { ok: false },
    ]) {
      expect(parseWalletBridgeResponse(value, "personal_sign")).toEqual({
        ok: false,
        code: "failed",
      });
    }
  });
});
