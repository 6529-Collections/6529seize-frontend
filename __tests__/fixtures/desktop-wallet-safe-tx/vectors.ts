/**
 * Shared test vectors for 6529 Desktop Safe transactions (SafeTx typed
 * data for a pinned Safe). The website test describes every vector; 6529
 * Desktop dumps the same list (`buildSafeTxVectors()`) and runs each
 * payload through its own request parsing, so both sides accept and refuse
 * the same Safe transactions.
 *
 * The payload is the exact `eth_signTypedData_v4` JSON text. Addresses are
 * the pinned Sepolia Safe and registries, public development accounts and
 * placeholders.
 */

import {
  type AbiFunction,
  concat,
  encodeFunctionData,
  encodePacked,
  type Hex,
  parseAbiItem,
} from "viem";

/** Public development account (Hardhat/Anvil account 1), the signer. */
export const SAFE_TX_SIGNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const SEPOLIA = 11_155_111;
const SAFE = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
const REGISTRY = "0x0e289576c7565D29018134517309668946Ffc912";
const MUSEUM_REGISTRY = "0xee91c45A1893fbb45ce8EeA170eF05d8d85bb850";
const MULTI_SEND = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2";
const OTHER = "0x4444444444444444444444444444444444444444";
const PUBLISHER = "0x5555555555555555555555555555555555555555";
const ZERO = "0x0000000000000000000000000000000000000000";

export type SafeTxVectorExpectation =
  | {
      readonly ok: true;
      readonly risk: "normal" | "high" | "critical";
      /** The governance rule of each call, in order. */
      readonly calls: readonly string[];
    }
  | {
      readonly ok: false;
      readonly problem: "unknown-typed-data" | "safe-tx-rule";
    };

export interface SafeTxVector {
  readonly name: string;
  readonly chainId: number;
  /** The typed data JSON exactly as the app sends it. */
  readonly payload: string;
  readonly expect: SafeTxVectorExpectation;
}

const fn = (signature: string) =>
  parseAbiItem(`function ${signature}`) as AbiFunction;
const HASH_REF = "(uint16 algorithm,bytes32 digest,bytes32 canonicalizationId)";
const ABI = {
  registerCanonicalization: fn(
    "registerCanonicalization(string literal,bytes specCid)"
  ),
  registerRecordType: fn("registerRecordType(string literal)"),
  registerSchema: fn(
    `registerSchema(string literal,${HASH_REF} documentHash,bytes cid,bytes document)`
  ),
  setPublisher: fn("setPublisher(address publisher,bool authorized)"),
  deleteVersion: fn(
    "deleteVersion(bytes32 subjectId,uint32 version,bytes32 reasonDigest)"
  ),
  deleteVersions: fn(
    "deleteVersions(bytes32 subjectId,uint32 fromVersion,uint32 toVersion,bytes32 reasonDigest)"
  ),
  deleteSubject: fn("deleteSubject(bytes32 subjectId,bytes32 reasonDigest)"),
  freeze: fn("freeze()"),
  declareSuccessor: fn("declareSuccessor(address successorRegistry)"),
  transferOwnership: fn("transferOwnership(address newOwner)"),
  acceptOwnership: fn("acceptOwnership()"),
  sealRelease: fn("sealRelease(uint32 releaseId,uint32 expectedRecordCount)"),
  multiSend: fn("multiSend(bytes transactions)"),
} as const;

const call = (name: keyof typeof ABI, args: readonly unknown[] = []): Hex =>
  encodeFunctionData({ abi: [ABI[name]], functionName: ABI[name].name, args });

const word = (byte: string) => `0x${byte.repeat(32)}` as Hex;
const CID = `0x01551220${"ab".repeat(32)}` as Hex;
const hashRef = (algorithm = 2) => ({
  algorithm,
  digest: word("11"),
  canonicalizationId: word("22"),
});

const GOVERNANCE: Readonly<Record<string, Hex>> = {
  registerCanonicalization: call("registerCanonicalization", [
    "RFC8785_JCS",
    CID,
  ]),
  registerRecordType: call("registerRecordType", ["PUBLIC_DOCUMENT"]),
  registerSchema: call("registerSchema", [
    "PUBLIC_DOCUMENT_V1",
    hashRef(),
    CID,
    "0x",
  ]),
  setPublisher: call("setPublisher", [PUBLISHER, false]),
  deleteVersion: call("deleteVersion", [word("a1"), 2, word("d1")]),
  deleteVersions: call("deleteVersions", [word("a1"), 1, 3, word("d1")]),
  deleteSubject: call("deleteSubject", [word("a1"), word("d1")]),
  freeze: call("freeze"),
  declareSuccessor: call("declareSuccessor", [OTHER]),
  transferOwnership: call("transferOwnership", [OTHER]),
  acceptOwnership: call("acceptOwnership"),
};

const CRITICAL = new Set([
  "deleteVersion",
  "deleteVersions",
  "deleteSubject",
  "freeze",
  "declareSuccessor",
  "transferOwnership",
  "acceptOwnership",
]);

interface Inner {
  readonly operation?: number;
  readonly to?: string;
  readonly value?: bigint;
  readonly data: Hex;
}

/** MultiSend's packed transactions (no ABI encoding). */
const packed = (calls: readonly Inner[]): Hex =>
  concat(
    calls.map((inner) =>
      encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [
          inner.operation ?? 0,
          (inner.to ?? REGISTRY) as Hex,
          inner.value ?? 0n,
          BigInt((inner.data.length - 2) / 2),
          inner.data,
        ]
      )
    )
  );
const batch = (calls: readonly Inner[]): Hex =>
  call("multiSend", [packed(calls)]);

const SAFE_TX_TYPES = [
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "data", type: "bytes" },
  { name: "operation", type: "uint8" },
  { name: "safeTxGas", type: "uint256" },
  { name: "baseGas", type: "uint256" },
  { name: "gasPrice", type: "uint256" },
  { name: "gasToken", type: "address" },
  { name: "refundReceiver", type: "address" },
  { name: "nonce", type: "uint256" },
];
const DOMAIN_TYPES = [
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

interface Shape {
  readonly domain?: Readonly<Record<string, unknown>>;
  readonly domainTypes?: readonly unknown[];
  readonly safeTxTypes?: readonly unknown[];
  readonly message?: Readonly<Record<string, unknown>>;
}

/**
 * The typed data JSON in viem's `serializeTypedData` layout (uint256 as
 * decimal strings, `operation` as a number), with `message` fields
 * replaced as given.
 */
function payload(shape: Shape): string {
  return JSON.stringify({
    domain: shape.domain ?? { chainId: SEPOLIA, verifyingContract: SAFE },
    message: {
      to: REGISTRY,
      value: "0",
      data: GOVERNANCE["registerRecordType"],
      operation: 0,
      safeTxGas: "0",
      baseGas: "0",
      gasPrice: "0",
      gasToken: ZERO,
      refundReceiver: ZERO,
      nonce: "7",
      ...shape.message,
    },
    primaryType: "SafeTx",
    types: {
      EIP712Domain: shape.domainTypes ?? DOMAIN_TYPES,
      SafeTx: shape.safeTxTypes ?? SAFE_TX_TYPES,
    },
  });
}

const RULE = { ok: false, problem: "safe-tx-rule" } as const;
const UNKNOWN = { ok: false, problem: "unknown-typed-data" } as const;
const id = (name: string) => `governance.${name}`;

interface Case {
  readonly name: string;
  readonly chainId?: number;
  readonly shape: Shape;
  readonly expect: SafeTxVectorExpectation;
}

function singleCalls(): Case[] {
  return Object.entries(GOVERNANCE).flatMap(([name, data]) =>
    [REGISTRY, MUSEUM_REGISTRY].map((to) => ({
      name: `${id(name)} alone on the ${to === REGISTRY ? "test" : "Museum"} registry`,
      shape: { message: { to, data } },
      expect: {
        ok: true,
        risk: CRITICAL.has(name) ? "critical" : "normal",
        calls: [id(name)],
      } as const,
    }))
  );
}

const registerBatch = (count: number): Inner[] =>
  Array.from({ length: count }, (_, index) => ({
    data: call("registerRecordType", [`TYPE_${index}`]),
  }));

function acceptedCases(): Case[] {
  return [
    ...singleCalls(),
    {
      name: "a lower-case registry address is the same registry",
      shape: { message: { to: REGISTRY.toLowerCase() } },
      expect: { ok: true, risk: "normal", calls: [id("registerRecordType")] },
    },
    {
      name: "granting a publisher key is high impact",
      shape: {
        message: { data: call("setPublisher", [PUBLISHER, true]) },
      },
      expect: { ok: true, risk: "high", calls: [id("setPublisher")] },
    },
    {
      name: "a batch of registrations on both registries",
      shape: {
        message: {
          to: MULTI_SEND,
          operation: 1,
          data: batch([
            { data: GOVERNANCE["registerCanonicalization"]! },
            { data: GOVERNANCE["registerRecordType"]! },
            { to: MUSEUM_REGISTRY, data: GOVERNANCE["registerSchema"]! },
          ]),
        },
      },
      expect: {
        ok: true,
        risk: "normal",
        calls: [
          id("registerCanonicalization"),
          id("registerRecordType"),
          id("registerSchema"),
        ],
      },
    },
    {
      name: "a batch granting a publisher key is high impact",
      shape: {
        message: {
          to: MULTI_SEND,
          operation: 1,
          data: batch([
            { data: call("setPublisher", [PUBLISHER, true]) },
            { data: GOVERNANCE["setPublisher"]! },
          ]),
        },
      },
      expect: {
        ok: true,
        risk: "high",
        calls: [id("setPublisher"), id("setPublisher")],
      },
    },
    {
      name: "a batch of 16 calls",
      shape: {
        message: { to: MULTI_SEND, operation: 1, data: batch(registerBatch(16)) },
      },
      expect: {
        ok: true,
        risk: "normal",
        calls: Array.from({ length: 16 }, () => id("registerRecordType")),
      },
    },
    {
      name: "a queued nonce up to 2^53-1",
      shape: { message: { nonce: "9007199254740991" } },
      expect: { ok: true, risk: "normal", calls: [id("registerRecordType")] },
    },
  ];
}

function domainCases(): Case[] {
  return [
    {
      name: "refuses another Safe",
      shape: { domain: { chainId: SEPOLIA, verifyingContract: OTHER } },
      expect: UNKNOWN,
    },
    {
      name: "refuses the Safe written in lower case (domain is exact)",
      shape: {
        domain: { chainId: SEPOLIA, verifyingContract: SAFE.toLowerCase() },
      },
      expect: UNKNOWN,
    },
    {
      name: "refuses an unpinned chain",
      chainId: 1,
      shape: { domain: { chainId: 1, verifyingContract: SAFE } },
      expect: UNKNOWN,
    },
    {
      name: "refuses a domain with a name",
      shape: {
        domain: { name: "Safe", chainId: SEPOLIA, verifyingContract: SAFE },
        domainTypes: [{ name: "name", type: "string" }, ...DOMAIN_TYPES],
      },
      expect: UNKNOWN,
    },
    {
      name: "refuses another SafeTx struct",
      shape: {
        safeTxTypes: SAFE_TX_TYPES.map((field) =>
          field.name === "nonce" ? { name: "nonce", type: "uint64" } : field
        ),
      },
      expect: UNKNOWN,
    },
  ];
}

function targetCases(): Case[] {
  const two = [
    { data: GOVERNANCE["registerRecordType"]! },
    { data: GOVERNANCE["registerCanonicalization"]! },
  ];
  const op1 = (data: Hex, to = MULTI_SEND) => ({
    message: { to, operation: 1, data },
  });
  return [
    {
      name: "refuses a call to an unpinned registry",
      shape: { message: { to: OTHER } },
      expect: RULE,
    },
    {
      name: "refuses operation 0 to MultiSendCallOnly",
      shape: { message: { to: MULTI_SEND, data: batch(two) } },
      expect: RULE,
    },
    {
      name: "refuses a delegatecall to the registry",
      shape: op1(GOVERNANCE["registerRecordType"]!, REGISTRY),
      expect: RULE,
    },
    {
      name: "refuses a delegatecall to another contract",
      shape: op1(batch(two), OTHER),
      expect: RULE,
    },
    {
      name: "refuses an inner call to another address",
      shape: op1(batch([two[0]!, { to: OTHER, data: two[1]!.data }])),
      expect: RULE,
    },
    {
      name: "refuses an inner call with value",
      shape: op1(batch([two[0]!, { ...two[1]!, value: 1n }])),
      expect: RULE,
    },
    {
      name: "refuses a nested delegatecall",
      shape: op1(
        batch([two[0]!, { operation: 1, to: MULTI_SEND, data: batch(two) }])
      ),
      expect: RULE,
    },
    {
      name: "refuses an inner delegatecall to the registry",
      shape: op1(batch([two[0]!, { ...two[1]!, operation: 1 }])),
      expect: RULE,
    },
    {
      name: "refuses a high-impact call inside a batch",
      shape: op1(batch([two[0]!, { data: GOVERNANCE["freeze"]! }])),
      expect: RULE,
    },
    {
      name: "refuses an ownership transfer inside a batch",
      shape: op1(batch([two[0]!, { data: GOVERNANCE["transferOwnership"]! }])),
      expect: RULE,
    },
    {
      name: "refuses trailing bytes in the packed data",
      shape: op1(call("multiSend", [concat([packed(two), "0x00"])])),
      expect: RULE,
    },
    {
      name: "refuses a packed call longer than the data",
      shape: op1(
        call("multiSend", [
          concat([
            packed([two[0]!]),
            encodePacked(
              ["uint8", "address", "uint256", "uint256"],
              [0, REGISTRY, 0n, 64n]
            ),
            "0x00",
          ]),
        ])
      ),
      expect: RULE,
    },
    {
      name: "refuses non-canonical multiSend call data",
      shape: op1(`${batch(two)}${"00".repeat(32)}` as Hex),
      expect: RULE,
    },
    {
      name: "refuses a batch of one call",
      shape: op1(batch([two[0]!])),
      expect: RULE,
    },
    {
      name: "refuses a batch of 17 calls",
      shape: op1(batch(registerBatch(17))),
      expect: RULE,
    },
    {
      name: "refuses an unknown operation",
      shape: { message: { operation: 2 } },
      expect: RULE,
    },
  ];
}

function fieldCases(): Case[] {
  const with_ = (name: string, message: Readonly<Record<string, unknown>>) => ({
    name,
    shape: { message },
    expect: RULE,
  });
  return [
    with_("refuses value", { value: "1" }),
    with_("refuses safeTxGas", { safeTxGas: "1" }),
    with_("refuses baseGas", { baseGas: "1" }),
    with_("refuses gasPrice", { gasPrice: "1" }),
    with_("refuses a gas token", { gasToken: OTHER }),
    with_("refuses a refund receiver", { refundReceiver: OTHER }),
    with_("refuses a nonce above 2^53-1", { nonce: "9007199254740992" }),
    with_("refuses a nonce with a leading zero", { nonce: "07" }),
    with_("refuses a nonce written as a number", { nonce: 7 }),
    with_("refuses value written as a number", { value: 0 }),
    with_("refuses operation written as a string", { operation: "0" }),
    with_("refuses a publish call (publishing is not governance)", {
      data: call("sealRelease", [3, 4]),
    }),
    with_("refuses trailing bytes in a governance call", {
      data: `${GOVERNANCE["registerRecordType"]}00`,
    }),
    with_("refuses empty call data", { data: "0x" }),
    with_("refuses a schema with its document on chain", {
      data: call("registerSchema", ["DOC_V1", hashRef(), CID, "0x01"]),
    }),
    with_("refuses a schema with an unknown hash algorithm", {
      data: call("registerSchema", ["DOC_V1", hashRef(3), CID, "0x"]),
    }),
    with_("refuses a literal that is not printable ASCII", {
      data: call("registerRecordType", ["TYPEé"]),
    }),
    with_("refuses a zero publisher", {
      data: call("setPublisher", [ZERO, true]),
    }),
    with_("refuses a zero successor", {
      data: call("declareSuccessor", [ZERO]),
    }),
    with_("refuses a zero new owner", {
      data: call("transferOwnership", [ZERO]),
    }),
    with_("refuses dirty padding in a governance call", {
      data: `${GOVERNANCE["setPublisher"]!.slice(0, 10)}ff${GOVERNANCE[
        "setPublisher"
      ]!.slice(12)}`,
    }),
  ];
}

/** Every vector, in a stable order. */
export function buildSafeTxVectors(): SafeTxVector[] {
  return [
    ...acceptedCases(),
    ...domainCases(),
    ...targetCases(),
    ...fieldCases(),
  ].map((item) => ({
    name: item.name,
    chainId: item.chainId ?? SEPOLIA,
    payload: payload(item.shape),
    expect: item.expect,
  }));
}

/** The calldata of a registration batch of `count` calls (size tests). */
export const registrationBatch = (count: number, literalLength: number): Hex =>
  batch(
    Array.from({ length: count }, (_, index) => ({
      data: call("registerSchema", [
        `${String(index).padStart(3, "0")}${"S".repeat(literalLength - 3)}`,
        hashRef(),
        `0x${"cd".repeat(64)}` as Hex,
        "0x",
      ]),
    }))
  );
