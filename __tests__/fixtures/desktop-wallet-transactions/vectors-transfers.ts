/**
 * Shared vectors for 6529 Desktop NFT transfers (part of
 * `buildWalletTransactionVectors`). Every transfer rule (each contract on
 * each chain) gets an accepting vector and its refusals.
 */

import {
  type AbiFunction,
  encodeFunctionData,
  type Hex,
  parseAbiItem,
} from "viem";
import type { Case, VectorExpectation } from "./vectors";

const FROM = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const RECIPIENT = "0x3333333333333333333333333333333333333333";
const OTHER = "0x1111111111111111111111111111111111111111";
const ZERO = "0x0000000000000000000000000000000000000000";
const BURN = "0x000000000000000000000000000000000000dead";
const MAINNET = 1;
const SEPOLIA = 11_155_111;

const ERC721: readonly (readonly [string, number, string])[] = [
  ["Gradient", MAINNET, "0x0c58ef43ff3032005e472cb5709f8908acb00205"],
  ["NextGen", MAINNET, "0x45882f9bc325e14fbb298a1df930c43a874b83ae"],
  ["NextGen Sepolia", SEPOLIA, "0x60671e59a349589ad74be6cd643003a0abb38cc3"],
];
const ERC1155: readonly (readonly [string, number, string])[] = [
  ["Memes", MAINNET, "0x33fd426905f149f8376e227d0c9d3340aad17af1"],
  ["Meme Lab", MAINNET, "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb"],
  ["drop forge Sepolia", SEPOLIA, "0xb84170c1073c7292ed108c3f0d1d2a1f304caa2c"],
];

const fn = (signature: string) =>
  parseAbiItem(`function ${signature}`) as AbiFunction;
const ABI = {
  transfer721: fn("safeTransferFrom(address from,address to,uint256 tokenId)"),
  transfer1155: fn(
    "safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes data)"
  ),
  batch1155: fn(
    "safeBatchTransferFrom(address from,address to,uint256[] ids,uint256[] amounts,bytes data)"
  ),
  transferFrom: fn("transferFrom(address from,address to,uint256 tokenId)"),
  approve: fn("approve(address to,uint256 tokenId)"),
  setApprovalForAll: fn("setApprovalForAll(address operator,bool approved)"),
} as const;

const encode = (name: keyof typeof ABI, args: readonly unknown[]): Hex =>
  encodeFunctionData({ abi: [ABI[name]], functionName: ABI[name].name, args });

const ok = { ok: true, risk: "transfer" } as const;
const RULE: VectorExpectation = { ok: false, problem: "transaction-rule" };
const UNKNOWN: VectorExpectation = {
  ok: false,
  problem: "unknown-transaction",
};

/** Sets the top byte of a word (after the selector): dirty padding. */
const dirtyWord = (data: Hex, index: number): Hex => {
  const start = 10 + index * 64;
  return `${data.slice(0, start)}ff${data.slice(start + 2)}` as Hex;
};

/** The refusals every transfer rule shares, for call data `build(to, from)`. */
function recipientCases(
  label: string,
  chainId: number,
  contract: string,
  build: (to: string, from?: string) => Hex
): Case[] {
  const c = (name: string, data: Hex, expect: VectorExpectation): Case => ({
    name: `${label} ${name}`,
    chainId,
    to: contract,
    data,
    expect,
  });
  return [
    c("refuses the zero address as recipient", build(ZERO), RULE),
    c("refuses the sender as recipient", build(FROM), RULE),
    c("refuses the burn address as recipient", build(BURN), RULE),
    c("refuses the token contract as recipient", build(contract), RULE),
    c("refuses another sender", build(RECIPIENT, OTHER), RULE),
    c("refuses dirty address padding", dirtyWord(build(RECIPIENT), 1), RULE),
    c("refuses trailing bytes", `${build(RECIPIENT)}00` as Hex, RULE),
    {
      name: `${label} refuses value`,
      chainId,
      to: contract,
      data: build(RECIPIENT),
      value: 1n,
      expect: RULE,
    },
    {
      name: `${label} refuses another chain`,
      chainId: chainId === MAINNET ? SEPOLIA : MAINNET,
      to: contract,
      data: build(RECIPIENT),
      expect: UNKNOWN,
    },
  ];
}

function erc721Cases(name: string, chainId: number, contract: string): Case[] {
  const id = "nft.transfer721";
  const build = (to: string, from = FROM) =>
    encode("transfer721", [from, to, 412n]);
  const c = (title: string, data: Hex, expect: VectorExpectation): Case => ({
    name: `${id} ${name} ${title}`,
    chainId,
    to: contract,
    data,
    expect,
  });
  return [
    c("accepts", build(RECIPIENT), { ...ok, ruleId: id }),
    ...recipientCases(`${id} ${name}`, chainId, contract, build),
    c(
      "refuses transferFrom",
      encode("transferFrom", [FROM, RECIPIENT, 412n]),
      UNKNOWN
    ),
    c("refuses an approval", encode("approve", [RECIPIENT, 412n]), UNKNOWN),
    c(
      "refuses the ERC-1155 transfer",
      encode("transfer1155", [FROM, RECIPIENT, 412n, 1n, "0x"]),
      UNKNOWN
    ),
  ];
}

function erc1155Cases(name: string, chainId: number, contract: string): Case[] {
  const single = "nft.transfer1155";
  const batch = "nft.batchTransfer1155";
  const one = (to: string, from = FROM, amount = 1n, data: Hex = "0x") =>
    encode("transfer1155", [from, to, 412n, amount, data]);
  const many = (
    ids: readonly bigint[],
    amounts: readonly bigint[],
    to = RECIPIENT,
    from = FROM,
    data: Hex = "0x"
  ) => encode("batch1155", [from, to, ids, amounts, data]);
  const range = (n: number) =>
    Array.from({ length: n }, (_, i) => BigInt(i + 1));
  const c = (title: string, data: Hex, expect: VectorExpectation): Case => ({
    name: title.replace(" ", ` ${name} `),
    chainId,
    to: contract,
    data,
    expect,
  });
  return [
    c(`${single} accepts`, one(RECIPIENT), { ...ok, ruleId: single }),
    c(`${single} accepts many copies`, one(RECIPIENT, FROM, 10_000n), {
      ...ok,
      ruleId: single,
    }),
    ...recipientCases(`${single} ${name}`, chainId, contract, (to, from) =>
      one(to, from)
    ),
    c(`${single} refuses no copies`, one(RECIPIENT, FROM, 0n), RULE),
    c(
      `${single} refuses more than 10000 copies`,
      one(RECIPIENT, FROM, 10_001n),
      RULE
    ),
    c(
      `${single} refuses call data for the receiver`,
      one(RECIPIENT, FROM, 1n, "0x01"),
      RULE
    ),
    c(`${batch} accepts`, many([412n, 413n], [1n, 2n]), {
      ...ok,
      ruleId: batch,
    }),
    c(`${batch} accepts 50 tokens`, many(range(50), range(50)), {
      ...ok,
      ruleId: batch,
    }),
    ...recipientCases(`${batch} ${name}`, chainId, contract, (to, from) =>
      many([412n], [1n], to, from)
    ),
    c(`${batch} refuses 51 tokens`, many(range(51), range(51)), RULE),
    c(`${batch} refuses no tokens`, many([], []), RULE),
    c(`${batch} refuses unequal lists`, many([412n, 413n], [1n]), RULE),
    c(`${batch} refuses no copies`, many([412n, 413n], [1n, 0n]), RULE),
    c(
      `${batch} refuses call data for the receiver`,
      many([412n], [1n], RECIPIENT, FROM, "0xab"),
      RULE
    ),
    c(
      `${batch} refuses the ERC-721 transfer`,
      encode("transfer721", [FROM, RECIPIENT, 412n]),
      UNKNOWN
    ),
    c(
      `${batch} refuses an approval for all`,
      encode("setApprovalForAll", [RECIPIENT, true]),
      UNKNOWN
    ),
  ];
}

export function transferCases(): Case[] {
  return [
    ...ERC721.flatMap(([name, chainId, contract]) =>
      erc721Cases(name, chainId, contract)
    ),
    ...ERC1155.flatMap(([name, chainId, contract]) =>
      erc1155Cases(name, chainId, contract)
    ),
    {
      name: "nft.transfer721 refuses a contract outside the table",
      to: OTHER,
      data: encode("transfer721", [FROM, RECIPIENT, 412n]),
      expect: UNKNOWN,
    },
    {
      name: "nft.batchTransfer1155 refuses a contract outside the table",
      to: OTHER,
      data: encode("batch1155", [FROM, RECIPIENT, [1n], [1n], "0x"]),
      expect: UNKNOWN,
    },
  ];
}
