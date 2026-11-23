/**
 * Wallet transactions for 6529 Desktop: NFT transfers (data only).
 *
 * The sender moves its own 6529 NFTs with the token standard's safe
 * transfer, never `transferFrom` or an approval, and only on the 6529
 * contracts listed here. No plain ETH sends. The recipient is any address
 * except the zero address, the burn address, the sender and the token
 * contract; the browser page shows it in full and asks the user to confirm
 * it before Send.
 */

import { type ArgRule, FROM, type TransactionRule } from "./types";

const MAINNET = 1;
const SEPOLIA = 11_155_111;

/** ERC-721: 6529 Gradient and NextGen. */
const ERC721_CONTRACTS: readonly (readonly [number, string])[] = [
  [MAINNET, "0x0c58ef43ff3032005e472cb5709f8908acb00205"],
  [MAINNET, "0x45882f9bc325e14fbb298a1df930c43a874b83ae"],
  [SEPOLIA, "0x60671e59a349589ad74be6cd643003a0abb38cc3"],
];

/** ERC-1155: The Memes, Meme Lab, and the drop forge test contract. */
const ERC1155_CONTRACTS: readonly (readonly [number, string])[] = [
  [MAINNET, "0x33fd426905f149f8376e227d0c9d3340aad17af1"],
  [MAINNET, "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb"],
  [SEPOLIA, "0xb84170c1073c7292ed108c3f0d1d2a1f304caa2c"],
];

const BURN_ADDRESS = "0x000000000000000000000000000000000000dead";
/**
 * Copies in one entry of a transfer (a sanity cap per amount; the token
 * contract enforces the balance).
 */
const MAX_AMOUNT = "10000";
/** Different tokens in one batch transfer. */
const MAX_BATCH_TOKENS = 50;
const ZERO_VALUE = { min: "0", max: "0" } as const;

const sender: ArgRule = { equals: FROM };
const recipient = (contract: string): ArgRule => ({
  notZero: true,
  noneOf: [FROM, BURN_ADDRESS, contract],
});
const amount: ArgRule = { uintMin: "1", uintMax: MAX_AMOUNT };

function erc721Rule(chainId: number, to: string): TransactionRule {
  return {
    id: "nft.transfer721",
    chainId,
    to,
    selector: "0x42842e0e",
    signature: "safeTransferFrom(address,address,uint256)",
    args: [
      { name: "from", type: "address", rule: sender },
      { name: "to", type: "address", rule: recipient(to) },
      { name: "tokenId", type: "uint256", rule: { any: true } },
    ],
    value: ZERO_VALUE,
    risk: "transfer",
  };
}

function erc1155Rules(chainId: number, to: string): TransactionRule[] {
  return [
    {
      id: "nft.transfer1155",
      chainId,
      to,
      selector: "0xf242432a",
      signature: "safeTransferFrom(address,address,uint256,uint256,bytes)",
      args: [
        { name: "from", type: "address", rule: sender },
        { name: "to", type: "address", rule: recipient(to) },
        { name: "id", type: "uint256", rule: { any: true } },
        { name: "amount", type: "uint256", rule: amount },
        { name: "data", type: "bytes", rule: { emptyBytes: true } },
      ],
      value: ZERO_VALUE,
      risk: "transfer",
    },
    {
      id: "nft.batchTransfer1155",
      chainId,
      to,
      selector: "0x2eb2c2d6",
      signature:
        "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
      args: [
        { name: "from", type: "address", rule: sender },
        { name: "to", type: "address", rule: recipient(to) },
        {
          name: "ids",
          type: "uint256[]",
          rule: {
            lenMin: 1,
            lenMax: MAX_BATCH_TOKENS,
            sameLength: ["amounts"],
          },
        },
        { name: "amounts", type: "uint256[]", rule: { each: amount } },
        { name: "data", type: "bytes", rule: { emptyBytes: true } },
      ],
      value: ZERO_VALUE,
      risk: "transfer",
    },
  ];
}

/** Most different tokens of one contract that one batch transfer may move. */
export const MAX_TRANSFER_BATCH_TOKENS = MAX_BATCH_TOKENS;
/** Most copies one transfer entry may move. */
export const MAX_TRANSFER_AMOUNT = Number(MAX_AMOUNT);
/** Recipients refused for every contract (besides the sender and contract). */
export const TRANSFER_RECIPIENT_EXCLUDED: readonly string[] = [
  `0x${"0".repeat(40)}`,
  BURN_ADDRESS,
];

export const TRANSFER_RULES: readonly TransactionRule[] = [
  ...ERC721_CONTRACTS.map(([chainId, to]) => erc721Rule(chainId, to)),
  ...ERC1155_CONTRACTS.flatMap(([chainId, to]) => erc1155Rules(chainId, to)),
];
