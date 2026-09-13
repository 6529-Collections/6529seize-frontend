import { getAddress, isAddress } from "viem";

export type CollectContractRole = "nft" | "exchange" | "fee" | "approval";

export interface CollectContractIdentity {
  readonly name:
    | "The Memes"
    | "6529 Gradient"
    | "NextGen"
    | "Seaport 1.6"
    | "OpenSea"
    | null;
  readonly address: string;
  readonly explorerUrl: string | null;
  readonly role: CollectContractRole;
}

// Display identities only. This registry grants no transaction authority.
const MAINNET_IDENTITIES = [
  {
    address: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    role: "nft",
    name: "The Memes",
  },
  {
    address: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
    role: "nft",
    name: "6529 Gradient",
  },
  {
    address: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    role: "nft",
    name: "NextGen",
  },
  {
    address: "0x0000000000000068f116a894984e2db1123eb395",
    role: "exchange",
    name: "Seaport 1.6",
  },
  {
    address: "0x0000a26b00c1f0df003000390027140000faa719",
    role: "fee",
    name: "OpenSea",
  },
] as const;

export function resolveCollectContractIdentity(
  chainId: number | undefined,
  address: string,
  role: CollectContractRole
): CollectContractIdentity {
  if (!isAddress(address, { strict: false })) {
    return { name: null, address, explorerUrl: null, role };
  }

  const checksummedAddress = getAddress(address);
  const mainnet = chainId === 1;
  const identity = mainnet
    ? MAINNET_IDENTITIES.find(
        (entry) =>
          entry.address === address.toLowerCase() && entry.role === role
      )
    : undefined;

  return {
    name: identity?.name ?? null,
    address: checksummedAddress,
    explorerUrl: mainnet
      ? `https://etherscan.io/address/${checksummedAddress}`
      : null,
    role,
  };
}
