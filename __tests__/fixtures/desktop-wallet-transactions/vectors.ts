/**
 * Shared test vectors for 6529 Desktop wallet transactions. The website
 * test checks every vector against `checkWalletTransaction`; 6529 Desktop
 * dumps the same list (`buildWalletTransactionVectors()`) and checks its
 * own rules against it, so both sides accept and refuse the same calls.
 *
 * Addresses are public development accounts and placeholders; nothing here
 * is a real user's data.
 */

import {
  type AbiFunction,
  encodeFunctionData,
  type Hex,
  numberToHex,
  parseAbiItem,
} from "viem";

/** Public development account (Hardhat/Anvil account 0), the sender. */
export const VECTOR_FROM = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const OTHER = "0x1111111111111111111111111111111111111111";
const DELEGATE = "0x2222222222222222222222222222222222222222";
const ZERO = "0x0000000000000000000000000000000000000000";

const MAINNET = 1;
const SEPOLIA = 11_155_111;
const DELEGATION = "0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d";
const LAZY_CLAIM = "0x26bbea7803dcac346d5f5f135b57cf2c752a02be";
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const MEMES_SEPOLIA = "0xb84170c1073c7292ed108c3f0d1d2a1f304caa2c";
const ANY_COLLECTION = "0x8888888888888888888888888888888888888888";
const NEXTGEN_MINTER = "0x6113fd2c91514e84e6149c6ede47f2e09545253a";
const NEXTGEN_MINTER_SEPOLIA = "0xada9027eaf134038d3731f677241c4351b799eb4";
const SUBSCRIPTIONS = "0xcaac2b43b1b40edbfaddb5aebde9a90a27e1a3be";
const NEVER = 64_060_588_800n;
const ETH = 10n ** 18n;
const PROOF_HASH = `0x${"ab".repeat(32)}` as Hex;

export type VectorExpectation =
  | {
      readonly ok: true;
      readonly ruleId: string;
      readonly risk: "normal" | "high";
    }
  | {
      readonly ok: false;
      readonly problem: "unknown-transaction" | "transaction-rule";
    };

export interface WalletTransactionVector {
  readonly name: string;
  readonly chainId: number;
  /** Canonical transaction: lower-case hex, value as a hex quantity. */
  readonly transaction: {
    readonly from: string;
    readonly to: string;
    readonly data: Hex;
    readonly value: Hex;
  };
  readonly expect: VectorExpectation;
}

const fn = (signature: string) =>
  parseAbiItem(`function ${signature}`) as AbiFunction;

const ABI = {
  register: fn(
    "registerDelegationAddress(address _collectionAddress,address _delegationAddress,uint256 _expiryDate,uint256 _useCase,bool _allTokens,uint256 _tokenId)"
  ),
  registerAsManager: fn(
    "registerDelegationAddressUsingSubDelegation(address _delegatorAddress,address _collectionAddress,address _delegationAddress,uint256 _expiryDate,uint256 _useCase,bool _allTokens,uint256 _tokenId)"
  ),
  update: fn(
    "updateDelegationAddress(address _collectionAddress,address _olddelegationAddress,address _newdelegationAddress,uint256 _expiryDate,uint256 _useCase,bool _allTokens,uint256 _tokenId)"
  ),
  batchRegister: fn(
    "batchDelegations(address[] _collectionAddresses,address[] _delegationAddresses,uint256[] _expiryDates,uint256[] _useCases,bool[] _allTokens,uint256[] _tokenIds)"
  ),
  revoke: fn(
    "revokeDelegationAddress(address _collectionAddress,address _delegationAddress,uint256 _useCase)"
  ),
  revokeAsManager: fn(
    "revokeDelegationAddressUsingSubdelegation(address _delegatorAddress,address _collectionAddress,address _delegationAddress,uint256 _useCase)"
  ),
  batchRevoke: fn(
    "batchRevocations(address[] _collectionAddresses,address[] _delegationAddresses,uint256[] _useCases)"
  ),
  lockCollection: fn(
    "setCollectionLock(address _collectionAddress,bool _status)"
  ),
  lockUseCase: fn(
    "setCollectionUsecaseLock(address _collectionAddress,uint256 _useCase,bool _status)"
  ),
  memesMint: fn(
    "mint(address creatorContractAddress,uint256 instanceId,uint32 mintIndex,bytes32[] merkleProof,address mintFor)"
  ),
  memesMintBatch: fn(
    "mintBatch(address creatorContractAddress,uint256 instanceId,uint16 mintCount,uint32[] mintIndices,bytes32[][] merkleProofs,address mintFor)"
  ),
  memesMintProxy: fn(
    "mintProxy(address creatorContractAddress,uint256 instanceId,uint16 mintCount,uint32[] mintIndices,bytes32[][] merkleProofs,address mintFor)"
  ),
  nextgenMint: fn(
    "mint(uint256 _collectionID,uint256 _numberOfTokens,uint256 _maxAllowance,string _tokenData,address _mintTo,bytes32[] merkleProof,address _delegator,uint256 _saltfun_o)"
  ),
  /** Not on the allow-list: an approval on the Memes contract. */
  setApprovalForAll: fn("setApprovalForAll(address operator,bool approved)"),
} as const;

type AbiName = keyof typeof ABI;

const encode = (name: AbiName, args: readonly unknown[]): Hex =>
  encodeFunctionData({
    abi: [ABI[name]],
    functionName: ABI[name].name,
    args,
  });

/** One 32-byte word of the call data (after the selector), replaced. */
function replaceWord(data: Hex, index: number, word: string): Hex {
  const start = 10 + index * 64;
  return `${data.slice(0, start)}${word}${data.slice(start + 64)}` as Hex;
}

/** Sets the top byte of a word, keeping its low bytes. */
function dirtyWord(data: Hex, index: number): Hex {
  const start = 10 + index * 64;
  return `${data.slice(0, start)}ff${data.slice(start + 2)}` as Hex;
}

/**
 * The Memes `mint` call with its proof array moved one word further (offset
 * 0xc0 instead of 0xa0, an unused zero word before it): it decodes to the
 * same values but is not the canonical encoding.
 */
function nonCanonicalProofOffset(data: Hex): Hex {
  const head = data.slice(0, 10 + 5 * 64);
  const tail = data.slice(10 + 5 * 64);
  const withOffset = replaceWord(head as Hex, 3, "c0".padStart(64, "0"));
  return `${withOffset}${"0".repeat(64)}${tail}` as Hex;
}

interface Case {
  readonly name: string;
  readonly chainId?: number;
  readonly to: string;
  readonly data: Hex;
  readonly value?: bigint;
  readonly from?: string;
  readonly expect: VectorExpectation;
}

const ok = (ruleId: string, risk: "normal" | "high" = "normal") =>
  ({ ok: true, ruleId, risk }) as const;
const RULE = { ok: false, problem: "transaction-rule" } as const;
const UNKNOWN = { ok: false, problem: "unknown-transaction" } as const;

function delegationCases(): Case[] {
  const reg = (
    collection: string,
    delegate: string,
    expiry: bigint,
    useCase: bigint,
    allTokens: boolean,
    tokenId: bigint
  ) =>
    encode("register", [
      collection,
      delegate,
      expiry,
      useCase,
      allTokens,
      tokenId,
    ]);
  const valid = reg(MEMES, DELEGATE, NEVER, 4n, true, 0n);
  const d = (name: string, data: Hex, expect: VectorExpectation, value = 0n) =>
    ({ name, to: DELEGATION, data, value, expect }) as Case;
  return [
    d("delegation.register accepts", valid, ok("delegation.register")),
    d(
      "delegation.register use case 1 is high impact",
      reg(ANY_COLLECTION, DELEGATE, NEVER, 1n, true, 0n),
      ok("delegation.register", "high")
    ),
    d(
      "delegation.register primary address is high impact",
      reg(ANY_COLLECTION, DELEGATE, NEVER, 997n, true, 0n),
      ok("delegation.register", "high")
    ),
    d(
      "delegation.register one token",
      reg(MEMES, DELEGATE, 0n, 5n, false, 412n),
      ok("delegation.register")
    ),
    d(
      "delegation.register refuses an unknown collection",
      reg(OTHER, DELEGATE, NEVER, 4n, true, 0n),
      RULE
    ),
    d(
      "delegation.register refuses a zero delegate",
      reg(MEMES, ZERO, NEVER, 4n, true, 0n),
      RULE
    ),
    d(
      "delegation.register refuses delegating to the sender",
      reg(MEMES, VECTOR_FROM, NEVER, 4n, true, 0n),
      RULE
    ),
    d(
      "delegation.register refuses an expiry past never",
      reg(MEMES, DELEGATE, NEVER + 1n, 4n, true, 0n),
      RULE
    ),
    d(
      "delegation.register refuses an unknown use case",
      reg(MEMES, DELEGATE, NEVER, 18n, true, 0n),
      RULE
    ),
    d(
      "delegation.register refuses a token id with all tokens",
      reg(MEMES, DELEGATE, NEVER, 4n, true, 1n),
      RULE
    ),
    d("delegation.register refuses value", valid, RULE, 1n),
    d(
      "delegation.register refuses dirty address padding",
      dirtyWord(valid, 1),
      RULE
    ),
    d(
      "delegation.register refuses a bool other than 0 or 1",
      replaceWord(valid, 4, "2".padStart(64, "0")),
      RULE
    ),
    d("delegation.register refuses trailing bytes", `${valid}00` as Hex, RULE),
    d(
      "delegation.register refuses missing bytes",
      valid.slice(0, -64) as Hex,
      RULE
    ),
    d(
      "delegation.registerAsManager accepts and is high impact",
      encode("registerAsManager", [
        OTHER,
        MEMES,
        DELEGATE,
        NEVER,
        4n,
        true,
        0n,
      ]),
      ok("delegation.registerAsManager", "high")
    ),
    d(
      "delegation.registerAsManager refuses the sender as delegator",
      encode("registerAsManager", [
        VECTOR_FROM,
        MEMES,
        DELEGATE,
        NEVER,
        4n,
        true,
        0n,
      ]),
      RULE
    ),
    d(
      "delegation.registerAsManager refuses a zero delegator",
      encode("registerAsManager", [ZERO, MEMES, DELEGATE, NEVER, 4n, true, 0n]),
      RULE
    ),
    d(
      "delegation.update accepts",
      encode("update", [MEMES, OTHER, DELEGATE, NEVER, 4n, true, 0n]),
      ok("delegation.update")
    ),
    d(
      "delegation.update refuses a zero old delegate",
      encode("update", [MEMES, ZERO, DELEGATE, NEVER, 4n, true, 0n]),
      RULE
    ),
    d(
      "delegation.update refuses the sender as new delegate",
      encode("update", [MEMES, OTHER, VECTOR_FROM, NEVER, 4n, true, 0n]),
      RULE
    ),
    d(
      "delegation.batchRegister accepts consolidation and is high impact",
      encode("batchRegister", [
        [ANY_COLLECTION, ANY_COLLECTION],
        [OTHER, DELEGATE],
        [NEVER, NEVER],
        [999n, 999n],
        [true, true],
        [0n, 0n],
      ]),
      ok("delegation.batchRegister", "high")
    ),
    d(
      "delegation.batchRegister normal use cases",
      encode("batchRegister", [
        [MEMES],
        [DELEGATE],
        [NEVER],
        [4n],
        [false],
        [7n],
      ]),
      ok("delegation.batchRegister")
    ),
    d(
      "delegation.batchRegister refuses arrays of different lengths",
      encode("batchRegister", [
        [MEMES, MEMES],
        [DELEGATE],
        [NEVER, NEVER],
        [4n, 4n],
        [true, true],
        [0n, 0n],
      ]),
      RULE
    ),
    d(
      "delegation.batchRegister refuses an empty batch",
      encode("batchRegister", [[], [], [], [], [], []]),
      RULE
    ),
    d(
      "delegation.batchRegister refuses more than five",
      encode("batchRegister", [
        Array(6).fill(MEMES),
        Array(6).fill(DELEGATE),
        Array(6).fill(NEVER),
        Array(6).fill(4n),
        Array(6).fill(true),
        Array(6).fill(0n),
      ]),
      RULE
    ),
    d(
      "delegation.batchRegister refuses a token id with all tokens at the same index",
      encode("batchRegister", [
        [MEMES, MEMES],
        [DELEGATE, OTHER],
        [NEVER, NEVER],
        [4n, 4n],
        [false, true],
        [3n, 3n],
      ]),
      RULE
    ),
    d(
      "delegation.batchRegister refuses delegating to the sender",
      encode("batchRegister", [
        [MEMES],
        [VECTOR_FROM],
        [NEVER],
        [4n],
        [true],
        [0n],
      ]),
      RULE
    ),
    d(
      "delegation.revoke accepts",
      encode("revoke", [MEMES, DELEGATE, 4n]),
      ok("delegation.revoke")
    ),
    d(
      "delegation.revoke refuses an unknown use case",
      encode("revoke", [MEMES, DELEGATE, 996n]),
      RULE
    ),
    d(
      "delegation.revoke refuses an unknown collection",
      encode("revoke", [OTHER, DELEGATE, 4n]),
      RULE
    ),
    d(
      "delegation.revokeAsManager accepts",
      encode("revokeAsManager", [OTHER, MEMES, DELEGATE, 4n]),
      ok("delegation.revokeAsManager")
    ),
    d(
      "delegation.revokeAsManager refuses the sender as delegator",
      encode("revokeAsManager", [VECTOR_FROM, MEMES, DELEGATE, 4n]),
      RULE
    ),
    d(
      "delegation.batchRevoke accepts",
      encode("batchRevoke", [
        [MEMES, ANY_COLLECTION],
        [DELEGATE, OTHER],
        [4n, 999n],
      ]),
      ok("delegation.batchRevoke")
    ),
    d(
      "delegation.batchRevoke refuses arrays of different lengths",
      encode("batchRevoke", [[MEMES], [DELEGATE, OTHER], [4n]]),
      RULE
    ),
    d(
      "delegation.lockCollection accepts",
      encode("lockCollection", [MEMES, true]),
      ok("delegation.lockCollection")
    ),
    d(
      "delegation.lockCollection refuses an unknown collection",
      encode("lockCollection", [OTHER, true]),
      RULE
    ),
    d(
      "delegation.lockUseCase accepts",
      encode("lockUseCase", [MEMES, 2n, false]),
      ok("delegation.lockUseCase")
    ),
    d(
      "delegation.lockUseCase refuses an unknown use case",
      encode("lockUseCase", [MEMES, 0n, false]),
      RULE
    ),
    {
      name: "delegation.register refuses another chain",
      chainId: SEPOLIA,
      to: DELEGATION,
      data: valid,
      expect: UNKNOWN,
    },
    d(
      "delegation refuses an unknown selector",
      encode("setApprovalForAll", [DELEGATE, true]),
      UNKNOWN
    ),
    {
      name: "delegation.register refuses another contract",
      to: OTHER,
      data: valid,
      expect: UNKNOWN,
    },
    d("delegation refuses empty data", "0x", UNKNOWN),
    d("delegation refuses a short selector", "0x2a243c", UNKNOWN),
  ];
}

function memesCases(chainId: number, creator: string): Case[] {
  const suffix = chainId === MAINNET ? "" : " on Sepolia";
  const m = (
    name: string,
    data: Hex,
    value: bigint,
    expect: VectorExpectation
  ) =>
    ({
      name: `${name}${suffix}`,
      chainId,
      to: LAZY_CLAIM,
      data,
      value,
      expect,
    }) as Case;
  const single = (mintFor: string, proof: readonly Hex[] = [PROOF_HASH]) =>
    encode("memesMint", [creator, 7n, 3, proof, mintFor]);
  const batch = (
    name: "memesMintBatch" | "memesMintProxy",
    count: number,
    indices: readonly number[],
    proofs: readonly (readonly Hex[])[],
    mintFor: string,
    creatorContract = creator
  ) => encode(name, [creatorContract, 7n, count, indices, proofs, mintFor]);
  const price = ETH / 20n;
  const cap = ETH / 5n;
  return [
    m("memes.mint accepts", single(VECTOR_FROM), price, ok("memes.mint")),
    m(
      "memes.mint at the per-card cap",
      single(VECTOR_FROM),
      cap,
      ok("memes.mint")
    ),
    m(
      "memes.mint for another wallet is high impact",
      single(OTHER),
      price,
      ok("memes.mint", "high")
    ),
    m("memes.mint refuses no value", single(VECTOR_FROM), 0n, RULE),
    m(
      "memes.mint refuses more than the cap",
      single(VECTOR_FROM),
      cap + 1n,
      RULE
    ),
    m("memes.mint refuses a zero recipient", single(ZERO), price, RULE),
    m(
      "memes.mint refuses another creator contract",
      encode("memesMint", [OTHER, 7n, 3, [], VECTOR_FROM]),
      price,
      RULE
    ),
    m(
      "memes.mint refuses a proof longer than 32",
      single(VECTOR_FROM, Array(33).fill(PROOF_HASH)),
      price,
      RULE
    ),
    m(
      "memes.mint refuses an out-of-range uint32",
      // mintIndex = 2^32, one past the largest uint32.
      replaceWord(single(VECTOR_FROM), 2, "100000000".padStart(64, "0")),
      price,
      RULE
    ),
    m(
      "memes.mint refuses a non-canonical offset",
      nonCanonicalProofOffset(single(VECTOR_FROM)),
      price,
      RULE
    ),
    m(
      "memes.mintBatch public phase accepts",
      batch("memesMintBatch", 3, [], [], VECTOR_FROM),
      3n * price,
      ok("memes.mintBatch")
    ),
    m(
      "memes.mintBatch allowlist accepts",
      batch(
        "memesMintBatch",
        2,
        [1, 2],
        [[PROOF_HASH], [PROOF_HASH]],
        VECTOR_FROM
      ),
      2n * price,
      ok("memes.mintBatch")
    ),
    m(
      "memes.mintBatch refuses more than count times the cap",
      batch("memesMintBatch", 2, [], [], VECTOR_FROM),
      2n * cap + 1n,
      RULE
    ),
    m(
      "memes.mintBatch refuses a zero count",
      batch("memesMintBatch", 0, [], [], VECTOR_FROM),
      1n,
      RULE
    ),
    m(
      "memes.mintBatch refuses more than 100",
      batch("memesMintBatch", 101, [], [], VECTOR_FROM),
      price,
      RULE
    ),
    m(
      "memes.mintBatch refuses indices and proofs of different lengths",
      batch("memesMintBatch", 2, [1, 2], [[PROOF_HASH]], VECTOR_FROM),
      2n * price,
      RULE
    ),
    m(
      "memes.mintBatch refuses another creator contract",
      batch("memesMintBatch", 2, [], [], VECTOR_FROM, OTHER),
      2n * price,
      RULE
    ),
    m(
      "memes.mintProxy accepts and is high impact",
      batch("memesMintProxy", 1, [], [], OTHER),
      price,
      ok("memes.mintProxy", "high")
    ),
    m(
      "memes.mintProxy refuses the sender as recipient",
      batch("memesMintProxy", 1, [], [], VECTOR_FROM),
      price,
      RULE
    ),
  ];
}

function nextgenCases(chainId: number, minter: string): Case[] {
  const suffix = chainId === MAINNET ? "" : " on Sepolia";
  const mint = (
    count: bigint,
    tokenData: string,
    mintTo: string,
    delegator = ZERO,
    proof: readonly Hex[] = []
  ) =>
    encode("nextgenMint", [
      1n,
      count,
      0n,
      tokenData,
      mintTo,
      proof,
      delegator,
      0n,
    ]);
  const n = (
    name: string,
    data: Hex,
    value: bigint,
    expect: VectorExpectation
  ) =>
    ({
      name: `${name}${suffix}`,
      chainId,
      to: minter,
      data,
      value,
      expect,
    }) as Case;
  return [
    n(
      "nextgen.mint accepts",
      mint(2n, "", VECTOR_FROM),
      2n * (ETH / 10n),
      ok("nextgen.mint")
    ),
    n(
      "nextgen.mint free mint",
      mint(1n, "", VECTOR_FROM),
      0n,
      ok("nextgen.mint")
    ),
    n(
      "nextgen.mint with allowlist data",
      mint(1n, '{"tier":"a"}', VECTOR_FROM, ZERO, [PROOF_HASH]),
      ETH / 10n,
      ok("nextgen.mint")
    ),
    n(
      "nextgen.mint to another wallet is high impact",
      mint(1n, "", OTHER),
      ETH / 10n,
      ok("nextgen.mint", "high")
    ),
    n(
      "nextgen.mint as a delegate is high impact",
      mint(1n, "", VECTOR_FROM, OTHER),
      ETH / 10n,
      ok("nextgen.mint", "high")
    ),
    n(
      "nextgen.mint keeps hex-like token data as text",
      mint(1n, "0xAB", VECTOR_FROM),
      0n,
      ok("nextgen.mint")
    ),
    n("nextgen.mint refuses zero tokens", mint(0n, "", VECTOR_FROM), 0n, RULE),
    n(
      "nextgen.mint refuses more than 100 tokens",
      mint(101n, "", VECTOR_FROM),
      0n,
      RULE
    ),
    n(
      "nextgen.mint refuses more than one ether per token",
      mint(2n, "", VECTOR_FROM),
      2n * ETH + 1n,
      RULE
    ),
    n("nextgen.mint refuses a zero recipient", mint(1n, "", ZERO), 0n, RULE),
    n(
      "nextgen.mint refuses unreadable token data",
      mint(1n, "a​b", VECTOR_FROM),
      0n,
      RULE
    ),
    n(
      "nextgen.mint refuses token data over 1024 bytes",
      mint(1n, "a".repeat(1025), VECTOR_FROM),
      0n,
      RULE
    ),
  ];
}

function subscriptionCases(): Case[] {
  const s = (
    name: string,
    value: bigint,
    expect: VectorExpectation,
    data: Hex = "0x"
  ) => ({ name, to: SUBSCRIPTIONS, data, value, expect }) as Case;
  return [
    s(
      "subscriptions.topUp accepts",
      65_290_000_000_000_000n,
      ok("subscriptions.topUp")
    ),
    s("subscriptions.topUp at one ether", ETH, ok("subscriptions.topUp")),
    s(
      "subscriptions.topUp above one ether is high impact",
      ETH + 1n,
      ok("subscriptions.topUp", "high")
    ),
    s(
      "subscriptions.topUp at the cap",
      10n * ETH,
      ok("subscriptions.topUp", "high")
    ),
    s("subscriptions.topUp refuses above the cap", 10n * ETH + 1n, RULE),
    s("subscriptions.topUp refuses no value", 0n, RULE),
    s(
      "subscriptions.topUp refuses call data",
      ETH,
      UNKNOWN,
      encode("setApprovalForAll", [DELEGATE, true])
    ),
    {
      name: "subscriptions.topUp refuses Sepolia",
      chainId: SEPOLIA,
      to: SUBSCRIPTIONS,
      data: "0x",
      value: ETH,
      expect: UNKNOWN,
    },
  ];
}

function otherCases(): Case[] {
  return [
    {
      name: "refuses an approval on the Memes contract",
      to: MEMES,
      data: encode("setApprovalForAll", [DELEGATE, true]),
      expect: UNKNOWN,
    },
    {
      name: "refuses a plain send to another address",
      to: OTHER,
      data: "0x",
      value: 1n,
      expect: UNKNOWN,
    },
  ];
}

/** Every vector, in a stable order. */
export function buildWalletTransactionVectors(): WalletTransactionVector[] {
  return [
    ...delegationCases(),
    ...memesCases(MAINNET, MEMES),
    ...memesCases(SEPOLIA, MEMES_SEPOLIA),
    ...nextgenCases(MAINNET, NEXTGEN_MINTER),
    ...nextgenCases(SEPOLIA, NEXTGEN_MINTER_SEPOLIA),
    ...subscriptionCases(),
    ...otherCases(),
  ].map((item) => ({
    name: item.name,
    chainId: item.chainId ?? MAINNET,
    transaction: {
      from: item.from ?? VECTOR_FROM,
      to: item.to,
      data: item.data.toLowerCase() as Hex,
      value: numberToHex(item.value ?? 0n),
    },
    expect: item.expect,
  }));
}
