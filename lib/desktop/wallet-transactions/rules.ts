/**
 * Wallet transactions for 6529 Desktop: the allow-list.
 *
 * Data only (no imports from the app), so 6529 Desktop can dump it and
 * mirror it. Addresses are lower-case; amounts are wei as decimal strings.
 * The table is grouped by product so later groups can be appended to
 * `WALLET_TRANSACTION_RULES` without changing the existing ones.
 */

import { PROVENANCE_RULES } from "./provenance-rules";
import { TRANSFER_RULES } from "./transfer-rules";
import { type ArgRule, FROM, type TransactionRule } from "./types";

const MAINNET = 1;
const SEPOLIA = 11_155_111;

const DELEGATION = "0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d";
const MANIFOLD_LAZY_CLAIM = "0x26bbea7803dcac346d5f5f135b57cf2c752a02be";
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
/** The drop forge test creator contract on Sepolia. */
const MEMES_SEPOLIA = "0xb84170c1073c7292ed108c3f0d1d2a1f304caa2c";
const NEXTGEN_MINTER = "0x6113fd2c91514e84e6149c6ede47f2e09545253a";
const NEXTGEN_MINTER_SEPOLIA = "0xada9027eaf134038d3731f677241c4351b799eb4";
const SUBSCRIPTIONS = "0xcaac2b43b1b40edbfaddb5aebde9a90a27e1a3be";

/** Collections a delegation can name: all, The Memes, Meme Lab, 6529 Gradient. */
const DELEGATION_COLLECTIONS = [
  "0x8888888888888888888888888888888888888888",
  MEMES,
  "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
  "0x0c58ef43ff3032005e472cb5709f8908acb00205",
];

/** Use cases 1-17, primary address (997), management (998), consolidation (999). */
const DELEGATION_USE_CASES = [
  ...Array.from({ length: 17 }, (_, index) => String(index + 1)),
  "997",
  "998",
  "999",
];

/** All, minting, airdrops, mint to address, primary, management, consolidation. */
const HIGH_IMPACT_USE_CASES = ["1", "2", "3", "17", "997", "998", "999"];

/** The "never expires" expiry the website writes. */
const NEVER_EXPIRES = "64060588800";

const ETH = 1_000_000_000_000_000_000n;
const wei = (amount: bigint) => amount.toString();
const ZERO_VALUE = { min: "0", max: "0" } as const;

const collection: ArgRule = { oneOf: DELEGATION_COLLECTIONS };
const useCase: ArgRule = { oneOf: DELEGATION_USE_CASES };
const delegate: ArgRule = { notZero: true, notEqual: FROM };
const expiry: ArgRule = { uintMax: NEVER_EXPIRES };
const tokenIdForAllTokens: ArgRule = {
  zeroIf: { arg: "_allTokens", equals: true },
};
const highUseCase = {
  highIf: [{ arg: "_useCase", is: { oneOf: HIGH_IMPACT_USE_CASES } }],
} as const;

const DELEGATION_RULES: readonly TransactionRule[] = [
  {
    id: "delegation.register",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x2a243ce7",
    signature:
      "registerDelegationAddress(address,address,uint256,uint256,bool,uint256)",
    args: [
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_delegationAddress", type: "address", rule: delegate },
      { name: "_expiryDate", type: "uint256", rule: expiry },
      { name: "_useCase", type: "uint256", rule: useCase },
      { name: "_allTokens", type: "bool", rule: { any: true } },
      { name: "_tokenId", type: "uint256", rule: tokenIdForAllTokens },
    ],
    value: ZERO_VALUE,
    risk: highUseCase,
  },
  {
    id: "delegation.registerAsManager",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x4b402f27",
    signature:
      "registerDelegationAddressUsingSubDelegation(address,address,address,uint256,uint256,bool,uint256)",
    args: [
      { name: "_delegatorAddress", type: "address", rule: delegate },
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_delegationAddress", type: "address", rule: delegate },
      { name: "_expiryDate", type: "uint256", rule: expiry },
      { name: "_useCase", type: "uint256", rule: useCase },
      { name: "_allTokens", type: "bool", rule: { any: true } },
      { name: "_tokenId", type: "uint256", rule: tokenIdForAllTokens },
    ],
    value: ZERO_VALUE,
    risk: "high",
  },
  {
    id: "delegation.update",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x850e8e06",
    signature:
      "updateDelegationAddress(address,address,address,uint256,uint256,bool,uint256)",
    args: [
      { name: "_collectionAddress", type: "address", rule: collection },
      {
        name: "_olddelegationAddress",
        type: "address",
        rule: { notZero: true },
      },
      { name: "_newdelegationAddress", type: "address", rule: delegate },
      { name: "_expiryDate", type: "uint256", rule: expiry },
      { name: "_useCase", type: "uint256", rule: useCase },
      { name: "_allTokens", type: "bool", rule: { any: true } },
      { name: "_tokenId", type: "uint256", rule: tokenIdForAllTokens },
    ],
    value: ZERO_VALUE,
    risk: highUseCase,
  },
  {
    id: "delegation.batchRegister",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x9bccd56c",
    signature:
      "batchDelegations(address[],address[],uint256[],uint256[],bool[],uint256[])",
    args: [
      {
        name: "_collectionAddresses",
        type: "address[]",
        rule: {
          lenMin: 1,
          lenMax: 5,
          sameLength: [
            "_delegationAddresses",
            "_expiryDates",
            "_useCases",
            "_allTokens",
            "_tokenIds",
          ],
          each: collection,
        },
      },
      {
        name: "_delegationAddresses",
        type: "address[]",
        rule: { each: delegate },
      },
      { name: "_expiryDates", type: "uint256[]", rule: { each: expiry } },
      { name: "_useCases", type: "uint256[]", rule: { each: useCase } },
      { name: "_allTokens", type: "bool[]", rule: { any: true } },
      {
        name: "_tokenIds",
        type: "uint256[]",
        rule: { each: tokenIdForAllTokens },
      },
    ],
    value: ZERO_VALUE,
    risk: {
      highIf: [{ arg: "_useCases", is: { oneOf: HIGH_IMPACT_USE_CASES } }],
    },
  },
  {
    id: "delegation.revoke",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x66ff484d",
    signature: "revokeDelegationAddress(address,address,uint256)",
    args: [
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_delegationAddress", type: "address", rule: { any: true } },
      { name: "_useCase", type: "uint256", rule: useCase },
    ],
    value: ZERO_VALUE,
    risk: "normal",
  },
  {
    id: "delegation.revokeAsManager",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0x7ed01e12",
    signature:
      "revokeDelegationAddressUsingSubdelegation(address,address,address,uint256)",
    args: [
      { name: "_delegatorAddress", type: "address", rule: delegate },
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_delegationAddress", type: "address", rule: { any: true } },
      { name: "_useCase", type: "uint256", rule: useCase },
    ],
    value: ZERO_VALUE,
    risk: "normal",
  },
  {
    id: "delegation.batchRevoke",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0xf793b96e",
    signature: "batchRevocations(address[],address[],uint256[])",
    args: [
      {
        name: "_collectionAddresses",
        type: "address[]",
        rule: {
          lenMin: 1,
          lenMax: 5,
          sameLength: ["_delegationAddresses", "_useCases"],
          each: collection,
        },
      },
      { name: "_delegationAddresses", type: "address[]", rule: { any: true } },
      { name: "_useCases", type: "uint256[]", rule: { each: useCase } },
    ],
    value: ZERO_VALUE,
    risk: "normal",
  },
  {
    id: "delegation.lockCollection",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0xd6a0a3d5",
    signature: "setCollectionLock(address,bool)",
    args: [
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_status", type: "bool", rule: { any: true } },
    ],
    value: ZERO_VALUE,
    risk: "normal",
  },
  {
    id: "delegation.lockUseCase",
    chainId: MAINNET,
    to: DELEGATION,
    selector: "0xa4fa0303",
    signature: "setCollectionUsecaseLock(address,uint256,bool)",
    args: [
      { name: "_collectionAddress", type: "address", rule: collection },
      { name: "_useCase", type: "uint256", rule: useCase },
      { name: "_status", type: "bool", rule: { any: true } },
    ],
    value: ZERO_VALUE,
    risk: "normal",
  },
];

/** At most this much per minted card, in wei (a sanity cap, not a price). */
const MEMES_MAX_PER_CARD = wei(ETH / 5n);
const PROOF: ArgRule = { lenMax: 32 };
const recipientIsNotSender = {
  highIf: [{ arg: "mintFor", is: { notEqual: FROM } }],
} as const;

function memesMintRules(
  chainId: number,
  creatorContract: string
): readonly TransactionRule[] {
  const creator = {
    name: "creatorContractAddress",
    type: "address",
    rule: { equals: creatorContract },
  } as const;
  const instance = {
    name: "instanceId",
    type: "uint256",
    rule: { any: true },
  } as const;
  const batchArgs = (mintFor: ArgRule) =>
    [
      creator,
      instance,
      {
        name: "mintCount",
        type: "uint16",
        rule: { uintMin: "1", uintMax: "100" },
      },
      {
        name: "mintIndices",
        type: "uint32[]",
        rule: { lenMax: 100, sameLength: ["merkleProofs"] },
      },
      {
        name: "merkleProofs",
        type: "bytes32[][]",
        rule: { lenMax: 100, each: PROOF },
      },
      { name: "mintFor", type: "address", rule: mintFor },
    ] as const;
  const batchValue = {
    min: "1",
    maxPerUnit: MEMES_MAX_PER_CARD,
    unitsArg: "mintCount",
  } as const;
  return [
    {
      id: "memes.mint",
      chainId,
      to: MANIFOLD_LAZY_CLAIM,
      selector: "0xfa2b068f",
      signature: "mint(address,uint256,uint32,bytes32[],address)",
      args: [
        creator,
        instance,
        { name: "mintIndex", type: "uint32", rule: { any: true } },
        { name: "merkleProof", type: "bytes32[]", rule: PROOF },
        { name: "mintFor", type: "address", rule: { notZero: true } },
      ],
      value: { min: "1", max: MEMES_MAX_PER_CARD },
      risk: recipientIsNotSender,
    },
    {
      id: "memes.mintBatch",
      chainId,
      to: MANIFOLD_LAZY_CLAIM,
      selector: "0x26c858a4",
      signature:
        "mintBatch(address,uint256,uint16,uint32[],bytes32[][],address)",
      args: batchArgs({ notZero: true }),
      value: batchValue,
      risk: recipientIsNotSender,
    },
    {
      id: "memes.mintProxy",
      chainId,
      to: MANIFOLD_LAZY_CLAIM,
      selector: "0x07591acc",
      signature:
        "mintProxy(address,uint256,uint16,uint32[],bytes32[][],address)",
      args: batchArgs({ notZero: true, notEqual: FROM }),
      value: batchValue,
      risk: "high",
    },
  ];
}

function nextgenMintRule(chainId: number, minter: string): TransactionRule {
  return {
    id: "nextgen.mint",
    chainId,
    to: minter,
    selector: "0xb047168f",
    signature:
      "mint(uint256,uint256,uint256,string,address,bytes32[],address,uint256)",
    args: [
      { name: "_collectionID", type: "uint256", rule: { any: true } },
      {
        name: "_numberOfTokens",
        type: "uint256",
        rule: { uintMin: "1", uintMax: "100" },
      },
      { name: "_maxAllowance", type: "uint256", rule: { any: true } },
      {
        name: "_tokenData",
        type: "string",
        rule: { readableText: true, lenMax: 1024 },
      },
      { name: "_mintTo", type: "address", rule: { notZero: true } },
      { name: "merkleProof", type: "bytes32[]", rule: PROOF },
      { name: "_delegator", type: "address", rule: { any: true } },
      { name: "_saltfun_o", type: "uint256", rule: { any: true } },
    ],
    value: {
      min: "0",
      maxPerUnit: wei(ETH),
      unitsArg: "_numberOfTokens",
    },
    risk: {
      highIf: [
        { arg: "_mintTo", is: { notEqual: FROM } },
        { arg: "_delegator", is: { notZero: true } },
      ],
    },
  };
}

const SUBSCRIPTION_RULES: readonly TransactionRule[] = [
  {
    id: "subscriptions.topUp",
    chainId: MAINNET,
    to: SUBSCRIPTIONS,
    selector: null,
    signature: null,
    args: [],
    value: { min: "1", max: wei(10n * ETH) },
    risk: { highIf: [{ valueAbove: wei(ETH) }] },
  },
];

/** Every transaction 6529 Desktop forwards to the browser wallet. */
export const WALLET_TRANSACTION_RULES: readonly TransactionRule[] = [
  ...DELEGATION_RULES,
  ...memesMintRules(MAINNET, MEMES),
  ...memesMintRules(SEPOLIA, MEMES_SEPOLIA),
  nextgenMintRule(MAINNET, NEXTGEN_MINTER),
  nextgenMintRule(SEPOLIA, NEXTGEN_MINTER_SEPOLIA),
  ...SUBSCRIPTION_RULES,
  ...TRANSFER_RULES,
  ...PROVENANCE_RULES,
];
