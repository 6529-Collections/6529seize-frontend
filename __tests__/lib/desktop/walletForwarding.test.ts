import {
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
  parseWalletBridgeCapabilities,
  parseWalletBridgeResponse,
  parseWalletBridgeStatus,
  fitsWalletRequestFragment,
  parseWalletRequest,
  parseWalletRequestFragment,
  parseWalletResult,
  readWalletMessageText,
  verifyWalletRequestFragment,
  WALLET_REQUEST_TTL_MS,
  walletRequestCode,
  type WalletRequestEnvelope,
  type WalletRequestInput,
} from "@/lib/desktop/wallet-forwarding";

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
const CHAINS = [1] as const;
const NOW = 1_800_000_000_000;
const ORIGIN = "http://localhost:6529";
const ID = "A".repeat(43);
const SIGNATURE = `0x${"ab".repeat(65)}`;
// A 32-byte value (shaped like a transaction hash): never a valid answer.
const NOT_A_SIGNATURE = `0x${"cd".repeat(32)}`;

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
      "eth_sendTransaction",
      "wallet_sendTransaction",
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

describe("parseWalletRequest: never throws", () => {
  it("refuses arbitrary and hostile input", () => {
    let seed = 6529;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    const atoms: unknown[] = [
      undefined,
      null,
      true,
      0,
      -1,
      Number.NaN,
      1e308,
      10n,
      "",
      "0x",
      "0xzz",
      ADDRESS,
      "__proto__",
      "constructor",
      "toString",
      [],
      {},
      "personal_sign",
      "eth_signTypedData_v4",
      "{",
      "[]",
    ];
    const pick = () => atoms[next() % atoms.length];
    const hostile = new Proxy([], {
      get() {
        throw new Error("getter");
      },
    });
    const inputs: unknown[] = [
      null,
      "x",
      hostile,
      {
        method: "personal_sign",
        params: hostile,
        address: ADDRESS,
        chainId: 1,
      },
      {
        get method() {
          throw new Error("getter");
        },
      },
      ...Array.from({ length: 300 }, () => ({
        method: pick(),
        params: [pick(), pick(), next() % 2 ? pick() : undefined],
        address: pick(),
        chainId: pick(),
      })),
    ];
    for (const value of inputs) {
      expect(() =>
        parseWalletRequest(value as WalletRequestInput, CHAINS)
      ).not.toThrow();
      expect(parseWalletRequest(value as WalletRequestInput, CHAINS).ok).toBe(
        false
      );
    }
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

describe("parseWalletRequest: context", () => {
  const message = toHex("hi");
  const context = JSON.stringify({ kind: "drop" });

  it("keeps a personal_sign request's context text as sent", () => {
    expect(
      parse(input("personal_sign", [message, ADDRESS], { context }))
    ).toEqual({
      ok: true,
      value: {
        method: "personal_sign",
        address: CHECKSUMMED,
        chainId: 1,
        message,
        context,
      },
    });
    // A key that is present but undefined is the same as no context.
    const absent = parse({
      ...input("personal_sign", [message, ADDRESS]),
      context: undefined,
    } as unknown as WalletRequestInput);
    expect(absent.ok && "context" in absent.value).toBe(false);
  });

  it("refuses context that is not text, is empty or is too large", () => {
    for (const value of ["", 1, null, {}, ["x"]]) {
      expect(
        problemOf(
          input("personal_sign", [message, ADDRESS], {
            context: value as never,
          })
        )
      ).toBe("invalid-params");
    }
    // The cap counts UTF-8 bytes: 16 KiB exactly fits, one more does not.
    expect(
      problemOf(
        input("personal_sign", [message, ADDRESS], {
          context: "é".repeat(8 * 1024),
        })
      )
    ).toBeNull();
    expect(
      problemOf(
        input("personal_sign", [message, ADDRESS], {
          context: `${"é".repeat(8 * 1024)}a`,
        })
      )
    ).toBe("too-large");
  });

  it("refuses context on typed data and any other extra key", () => {
    const typed = input(
      "eth_signTypedData_v4",
      [ADDRESS, serializeTypedData(typedData)],
      { context }
    );
    expect(problemOf(typed)).toBe("invalid-params");
    expect(
      problemOf({
        ...input("personal_sign", [message, ADDRESS]),
        label: "x",
      } as WalletRequestInput)
    ).toBe("invalid-params");
  });

  it("counts the context in the fragment size", () => {
    const big = `0x${"61".repeat(8 * 1024)}`;
    expect(problemOf(input("personal_sign", [big, ADDRESS]))).toBeNull();
    expect(
      problemOf(
        input("personal_sign", [big, ADDRESS], {
          context: "a".repeat(16 * 1024),
        })
      )
    ).toBe("too-large");
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

  it("reads domain chain ids exactly, up to 2^53 - 1", () => {
    const withChain = (chainId: unknown) =>
      JSON.stringify({ ...JSON.parse(payload), domain: { chainId } });
    const problemFor = (
      chainId: unknown,
      allowed: readonly number[] = CHAINS
    ) => {
      const result = parseWalletRequest(
        input("eth_signTypedData_v4", [ADDRESS, withChain(chainId)], {
          chainId: allowed[0] ?? 1,
        }),
        allowed
      );
      return result.ok ? null : result.problem;
    };
    const max = Number.MAX_SAFE_INTEGER;
    // The largest id is accepted in every form and still compared exactly.
    for (const chainId of [max, String(max), "0x1fffffffffffff"]) {
      expect(problemFor(chainId, [max])).toBeNull();
      expect(problemFor(chainId)).toBe("wrong-chain");
    }
    // One above it is never rounded down into range.
    for (const chainId of [
      "9007199254740992",
      "0x20000000000000",
      "0x1fffffffffffff1",
      "0x00000000000000001",
      9007199254740992,
      "99999999999999999999",
      "0x",
      "0",
      0,
      -1,
      "01",
      "1e3",
    ]) {
      expect(problemFor(chainId, [max])).toBe("invalid-params");
    }
    // Leading zero hex digits within 16 digits read as the same id.
    expect(problemFor("0x0000000000000001")).toBeNull();
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

  it.each([["toString"], ["constructor"], ["__proto__"], ["hasOwnProperty"]])(
    "refuses an inherited name %s as the primary type",
    (name) => {
      const value = JSON.stringify({
        domain: {},
        types: { Grant: [{ name: "a", type: "uint8" }] },
        primaryType: name,
        message: {},
      });
      expect(problemOf(input("eth_signTypedData_v4", [ADDRESS, value]))).toBe(
        "invalid-params"
      );
    }
  );

  it("keeps a type named __proto__ as an own key", () => {
    const value = JSON.stringify({
      domain: {},
      types: JSON.parse('{"__proto__":[{"name":"a","type":"uint8"}]}'),
      primaryType: "__proto__",
      message: {},
    });
    const result = parse(input("eth_signTypedData_v4", [ADDRESS, value]));
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.method !== "eth_signTypedData_v4") return;
    expect(Object.hasOwn(result.value.typedData.types, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(result.value.typedData.types)).toBeNull();
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

describe("readWalletMessageText", () => {
  it("returns readable text exactly", () => {
    expect(readWalletMessageText(toHex("Line 1\nLine 2 end"))).toBe(
      "Line 1\nLine 2 end"
    );
    expect(readWalletMessageText(toHex("Grüße 6529 你好 🎨"))).toBe(
      "Grüße 6529 你好 🎨"
    );
  });

  it("keeps a byte-order mark instead of hiding it, and refuses it", () => {
    // TextDecoder drops a leading BOM by default; personal_sign signs it.
    expect(readWalletMessageText("0xefbbbf68656c6c6f")).toBeNull();
    expect(readWalletMessageText(toHex("hel﻿lo"))).toBeNull();
  });

  it.each([
    ["empty", "0x"],
    ["not hex", "0xzz"],
    ["invalid UTF-8", "0xff"],
    ["an overlong encoding", "0xc0af"],
    ["a lone surrogate (CESU-8)", "0xeda080"],
    ["only spaces", toHex("   ")],
    ["NUL", toHex("a\u0000b")],
    ["a C1 control", toHex("a\u0085b")],
    ["DEL", toHex("del\u007F")],
    ["a tab", toHex("a\tb")],
    ["a carriage return", toHex("a\r\nb")],
    ["a right-to-left override", toHex("pay ‮evil")],
    ["a bidi isolate", toHex("x⁦y")],
    ["an Arabic letter mark", toHex("x؜y")],
    ["a zero-width space", toHex("pay​me")],
    ["a zero-width joiner", toHex("a‍b")],
    ["a word joiner", toHex("a⁠b")],
    ["a soft hyphen", toHex("pay­me")],
    ["a no-break space", toHex("a b")],
    ["an ideographic space", toHex("a　b")],
    ["a line separator", toHex("a b")],
    ["a variation selector", toHex("a️b")],
    ["a combining grapheme joiner", toHex("a͏b")],
    ["a Hangul filler", toHex("aㅤb")],
    ["a Braille blank", toHex("a⠀b")],
    ["a tag character", toHex("a\u{E0041}b")],
    ["a private-use character", toHex("ab")],
    ["a trailing space", toHex("hello ")],
    ["a space before a line break", toHex("hello \nworld")],
    ["a leading line break", toHex("\nhello")],
    ["a trailing line break", toHex("hello\n")],
  ])("refuses %s", (_label, hex) => {
    expect(readWalletMessageText(hex as `0x${string}`)).toBeNull();
  });

  it("never gives two different byte strings the same preview", () => {
    const base = "Vote 7 for entry";
    const variants = [
      toHex(base),
      `0xefbbbf${toHex(base).slice(2)}`,
      toHex(`${base} `),
      toHex(`${base}\n`),
      toHex(base.replace(" ", "  ")),
      toHex(base.replace(" ", " ")),
      toHex(base.replace(" ", "\t")),
      toHex(base.replace("e", "é")),
      toHex(base.replace("e", "é")),
      toHex(base.replace("7", "7​")),
      toHex(base.replace("o", "о")),
      toHex(base.replace(" ", "\r\n")),
    ] as `0x${string}`[];
    const previews = new Map<string, string>();
    for (const hex of variants) {
      const preview = readWalletMessageText(hex);
      if (preview === null) continue;
      expect(previews.get(preview) ?? hex).toBe(hex);
      previews.set(preview, hex);
      // The preview re-encodes to exactly the signed bytes.
      expect(toHex(preview)).toBe(hex);
    }
    expect(previews.size).toBeGreaterThan(3);
  });
});

describe("request size: accepted only when the browser fragment fits", () => {
  // Every envelope field at its longest, with a valid lifetime.
  const LONG_ORIGIN = "http://localhost:65535";
  const longEnvelope = (
    request: WalletRequestInput
  ): WalletRequestEnvelope => ({
    v: 1,
    id: "A".repeat(43),
    scheme: "stagingcore6529",
    origin: LONG_ORIGIN,
    issuedAt: NOW,
    expiresAt: NOW + WALLET_REQUEST_TTL_MS,
    request,
  });
  const typedRequest = (text: string) =>
    input("eth_signTypedData_v4", [
      ADDRESS,
      JSON.stringify({
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
        message: { text },
      }),
    ]);

  // The longest payload that fits, found by search on the size rule.
  const longestFitting = (char: string) => {
    let low = 0;
    let high = 20_000;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (fitsWalletRequestFragment(typedRequest(char.repeat(mid)))) low = mid;
      else high = mid - 1;
    }
    return low;
  };

  const roundTrip = async (request: WalletRequestInput) => {
    const bytes = encodeWalletRequestEnvelope(longEnvelope(request));
    const fragment = buildWalletRequestFragment(
      bytes,
      await shell.signMessage({ message: { raw: bytes } })
    );
    if (fragment === null) return null;
    const parsed = parseWalletRequestFragment(fragment, {
      origin: LONG_ORIGIN,
      now: NOW + 1000,
      allowedChainIds: CHAINS,
    });
    return parsed.ok ? parsed.value : parsed.problem;
  };

  // A three-byte character, and one that JSON escapes twice (payload, then
  // envelope): both reach the fragment cap before the typed-data cap.
  it.each([["€"], ['"']])(
    "accepts and round-trips at the limit and refuses one more %s",
    async (char) => {
      const n = longestFitting(char);
      expect(n).toBeGreaterThan(1000);

      const atLimit = typedRequest(char.repeat(n));
      expect(parse(atLimit).ok).toBe(true);
      const delivered = await roundTrip(atLimit);
      expect(delivered).not.toBeNull();
      expect(typeof delivered).toBe("object");

      const over = typedRequest(char.repeat(n + 1));
      expect(problemOf(over)).toBe("too-large");
      expect(await roundTrip(over)).toBeNull();
    }
  );

  it("is false for input that cannot be serialized", () => {
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;
    expect(fitsWalletRequestFragment(input("personal_sign", circular))).toBe(
      false
    );
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
    const fragment = buildWalletRequestFragment(bytes, signature);
    if (fragment === null) throw new Error("fragment too large");
    return fragment;
  };

  it("refuses to build a fragment larger than the page accepts", () => {
    const signature = `0x${"11".repeat(65)}` as const;
    expect(
      buildWalletRequestFragment(new Uint8Array(30 * 1024), signature)
    ).toBeNull();
    expect(
      buildWalletRequestFragment(new Uint8Array(24 * 1024), signature)
    ).toBeNull();
    const fits = buildWalletRequestFragment(
      new Uint8Array(20 * 1024).fill(0xfb),
      signature
    );
    expect(fits).not.toBeNull();
    expect(fits!.length).toBeLessThanOrEqual(32 * 1024);
    // Chunked encoding: no padding, URL-safe alphabet.
    expect(fits).toMatch(/^#w=[A-Za-z0-9_-]+&s=0x[0-9a-f]+$/);
  });

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
      buildWalletRequestFragment(tampered, params.get("s") as `0x${string}`) ??
        "",
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
      envelope({ issuedAt: NOW + 50_000, expiresAt: NOW + 40_000 }),
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

describe("verifyWalletRequestFragment", () => {
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
  const context = {
    origin: ORIGIN,
    now: NOW + 1000,
    allowedChainIds: CHAINS,
    signer: shell.address,
  };
  const fragmentFor = async (
    value: WalletRequestEnvelope,
    signer = shell
  ): Promise<string> => {
    const bytes = encodeWalletRequestEnvelope(value);
    const signature = await signer.signMessage({ message: { raw: bytes } });
    return buildWalletRequestFragment(bytes, signature) ?? "";
  };

  it("accepts a request the shell signed", async () => {
    const verified = await verifyWalletRequestFragment(
      await fragmentFor(envelope()),
      context
    );
    expect(verified.ok && verified.value.envelope.id).toBe(ID);
  });

  it("calls a request with past times that the shell did not sign unsigned, not expired", async () => {
    const past = envelope({
      issuedAt: NOW - 600_000,
      expiresAt: NOW - 500_000,
    });
    await expect(
      verifyWalletRequestFragment(await fragmentFor(past, other), context)
    ).resolves.toEqual({ ok: false, problem: "unsigned" });
    await expect(
      verifyWalletRequestFragment(await fragmentFor(past), {
        ...context,
        signer: null,
      })
    ).resolves.toEqual({ ok: false, problem: "unsigned" });
    // Signed by the shell, the same times are simply expired.
    await expect(
      verifyWalletRequestFragment(await fragmentFor(past), context)
    ).resolves.toEqual({ ok: false, problem: "expired" });
  });

  it("checks origin and the request only after the signature", async () => {
    const otherOrigin = envelope({ origin: "http://localhost:6530" });
    await expect(
      verifyWalletRequestFragment(
        await fragmentFor(otherOrigin, other),
        context
      )
    ).resolves.toEqual({ ok: false, problem: "unsigned" });
    await expect(
      verifyWalletRequestFragment(await fragmentFor(otherOrigin), context)
    ).resolves.toEqual({ ok: false, problem: "wrong-origin" });
    await expect(
      verifyWalletRequestFragment("#w=abc&s=0x12", context)
    ).resolves.toEqual({ ok: false, problem: "malformed" });
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
    expect(parseWalletResult(data)).toEqual({
      v: 1,
      id: ID,
      ok: true,
      value: SIGNATURE,
    });
  });

  it("accepts a 65-byte signature only", () => {
    const ok = (value: string) => ({ v: 1, id: ID, ok: true, value });
    expect(
      parseWalletResult(ok(SIGNATURE.toUpperCase().replace("0X", "0x")))
    ).toEqual(ok(SIGNATURE));
    for (const value of [NOT_A_SIGNATURE, `${SIGNATURE}00`, "0x", 42]) {
      expect(parseWalletResult(ok(value as string))).toBeNull();
    }
  });

  it("accepts known failure codes only", () => {
    for (const code of [
      "rejected",
      "failed",
      "wrong-account",
      "wrong-chain",
      "refused",
    ]) {
      expect(parseWalletResult({ v: 1, id: ID, ok: false, code })).toEqual({
        v: 1,
        id: ID,
        ok: false,
        code,
      });
    }
    expect(
      parseWalletResult({ v: 1, id: ID, ok: false, code: "busy" })
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
      { v: 1, id: ID, ok: true, value: SIGNATURE, pad: "x" },
      { v: 1, id: ID, ok: true, value: SIGNATURE, code: "failed" },
      { v: 1, id: ID, ok: false, code: "failed", value: SIGNATURE },
      { v: 1, id: ID, ok: true },
    ]) {
      expect(parseWalletResult(value)).toBeNull();
    }
  });
});

describe("parseWalletBridgeResponse", () => {
  it("passes a valid value and known failures", () => {
    expect(
      parseWalletBridgeResponse({
        ok: true,
        value: SIGNATURE.toUpperCase().replace("0X", "0x"),
      })
    ).toEqual({ ok: true, value: SIGNATURE });
    for (const code of [
      "cancelled",
      "expired",
      "busy",
      "not-signed-in",
      "rejected",
    ]) {
      expect(parseWalletBridgeResponse({ ok: false, code })).toEqual({
        ok: false,
        code,
      });
    }
  });

  it("keeps a fixed diagnostic reason and drops anything else", () => {
    expect(
      parseWalletBridgeResponse({
        ok: false,
        code: "failed",
        reason: "unverified-signature",
      })
    ).toEqual({ ok: false, code: "failed", reason: "unverified-signature" });
    for (const reason of ["Has Spaces", "x".repeat(41), 42, "0x1234"]) {
      expect(
        parseWalletBridgeResponse({ ok: false, code: "failed", reason })
      ).toEqual({ ok: false, code: "failed" });
    }
  });

  it("turns anything unexpected into a failure", () => {
    for (const value of [
      undefined,
      "0x",
      { ok: true, value: NOT_A_SIGNATURE },
      { ok: false, code: "pwned" },
      { ok: false },
    ]) {
      expect(parseWalletBridgeResponse(value)).toEqual({
        ok: false,
        code: "failed",
      });
    }
  });
});

describe("parseWalletBridgeStatus", () => {
  it("passes an open request with its code", () => {
    expect(
      parseWalletBridgeStatus({
        pending: true,
        code: "A1B-2C3",
        method: "personal_sign",
        expiresAt: NOW,
      })
    ).toEqual({
      pending: true,
      requestCode: "A1B-2C3",
      method: "personal_sign",
      expiresAt: NOW,
    });
  });

  it("reads anything unexpected as no open request", () => {
    for (const value of [
      undefined,
      { pending: false, code: "A1B-2C3" },
      {
        pending: true,
        code: "a1b-2c3",
        method: "personal_sign",
        expiresAt: NOW,
      },
      {
        pending: true,
        code: "A1B2C3",
        method: "personal_sign",
        expiresAt: NOW,
      },
      {
        pending: true,
        code: "A1B-2C3",
        method: "eth_sendTransaction",
        expiresAt: NOW,
      },
      {
        pending: true,
        code: "A1B-2C3",
        method: "personal_sign",
        expiresAt: "x",
      },
    ]) {
      expect(parseWalletBridgeStatus(value)).toEqual({ pending: false });
    }
  });
});

describe("parseWalletBridgeCapabilities", () => {
  it("returns the offered methods this website forwards, in its order", () => {
    expect(
      parseWalletBridgeCapabilities({
        version: 1,
        methods: [
          "eth_sendTransaction",
          "eth_signTypedData_v4",
          "personal_sign",
        ],
      })
    ).toEqual(["personal_sign", "eth_signTypedData_v4"]);
    expect(
      parseWalletBridgeCapabilities({ version: 1, methods: ["personal_sign"] })
    ).toEqual(["personal_sign"]);
  });

  it("returns nothing for another version or a malformed answer", () => {
    for (const value of [
      undefined,
      null,
      { version: 2, methods: ["personal_sign"] },
      { version: 1, methods: "personal_sign" },
      { version: 1, methods: ["eth_sendTransaction"] },
    ]) {
      expect(parseWalletBridgeCapabilities(value)).toEqual([]);
    }
  });
});
