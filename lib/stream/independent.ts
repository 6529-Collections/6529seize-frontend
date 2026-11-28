import { economicsAbi, independentRegistryAbi } from "./abis";
import {
  bytesToHex,
  encodeAbiParameters,
  keccak256,
  toBytes,
  type Address,
  type Hex,
} from "viem";

import { getStreamClient, STREAM_CHAIN } from "./client";
import { getStreamInstance } from "./instances";

const PRODUCT_INDEPENDENT = keccak256(toBytes("PRODUCT_INDEPENDENT"));
/** IIndependentStreamRegistry.Form */
export const FORM = { ERC721: 0, ERC1155: 1 } as const;
/** IIndependentStreamRegistry.Status: NONE, ACTIVE, ... */
export const LISTING_ACTIVE = 1;

/** The profile identifiers an account is registered with (as the rehearsal flows derive them). */
export function profileIdOf(account: Address): Hex {
  return keccak256(encodeAbiParameters([{ type: "string" }, { type: "address" }], ["6529 profile", account]));
}

export function profileDocHashOf(account: Address): Hex {
  return keccak256(
    encodeAbiParameters([{ type: "string" }, { type: "address" }], ["6529 profile document", account])
  );
}

/** Deploy config of an artist's own 1/1 contract. */
export function independent721Config(args: {
  readonly name: string;
  readonly symbol: string;
  readonly artist: Address;
}): Hex {
  const instance = getStreamInstance();
  return encodeAbiParameters(
    [
      { type: "string" },
      { type: "string" },
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "address" },
      { type: "address" },
    ],
    [
      args.name,
      args.symbol,
      instance.addresses.workFacts,
      instance.addresses.streamDirectory,
      BigInt(args.artist),
      args.artist,
      instance.addresses.renderer,
    ]
  );
}

/** Deploy config of the editions contract that partners an artist's 1/1 contract. */
export function independentEditionsConfig(args: {
  readonly name: string;
  readonly symbol: string;
  readonly master: Address;
  readonly artist: Address;
}): Hex {
  const instance = getStreamInstance();
  return encodeAbiParameters(
    [
      { type: "string" },
      { type: "string" },
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "address" },
    ],
    [
      args.name,
      args.symbol,
      args.master,
      instance.addresses.streamDirectory,
      BigInt(args.artist),
      args.artist,
    ]
  );
}

/** A short ticker from a collection name: letters only, upper case, at most 8. */
export function symbolFromName(name: string): string {
  const letters = name.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return letters.slice(0, 8) || "STREAM";
}

export function randomSalt(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function accountsDomain() {
  return {
    name: getStreamInstance().naming.artistRegistryDomain,
    version: "1",
    chainId: STREAM_CHAIN.id,
    verifyingContract: getStreamInstance().addresses.accounts,
  } as const;
}

/** EIP-712: the account agrees to the identity the Independent Stream module creates for it. */
export function registrationTypedData(account: Address, deadline: bigint) {
  return {
    domain: accountsDomain(),
    types: {
      ArtistRegistration: [
        { name: "account", type: "address" },
        { name: "profileId", type: "bytes32" },
        { name: "profileDocHash", type: "bytes32" },
        { name: "deadline", type: "uint64" },
      ],
    },
    primaryType: "ArtistRegistration",
    message: {
      account,
      profileId: profileIdOf(account),
      profileDocHash: profileDocHashOf(account),
      deadline,
    },
  } as const;
}

/** EIP-712: the account consents to `what` for the Independent Stream module. */
export function consentTypedData(what: Hex) {
  return {
    domain: accountsDomain(),
    types: {
      Consent: [
        { name: "subject", type: "address" },
        { name: "what", type: "bytes32" },
      ],
    },
    primaryType: "Consent",
    message: { subject: getStreamInstance().addresses.independentRegistry, what },
  } as const;
}

/** What a listing consent covers: the contract, its form, its partner, the network's share and a deadline. */
export async function listingSubject(args: {
  readonly token: Address;
  readonly form: number;
  readonly partner: Address;
  readonly deadline: bigint;
}): Promise<{ subject: Hex; feeShare: number }> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const economics = await client.readContract({
    address: instance.addresses.economics,
    abi: economicsAbi,
    functionName: "economics",
    args: [PRODUCT_INDEPENDENT],
  });
  const subject = await client.readContract({
    address: instance.addresses.independentRegistry,
    abi: independentRegistryAbi,
    functionName: "listingSubject",
    args: [args.token, args.form, args.partner, economics.feeShare, args.deadline],
  });
  return { subject, feeShare: economics.feeShare };
}

/** `abi.encodePacked(wallet, signature)`: the proof form the accounts module reads. */
export function walletProof(wallet: Address, signature: Hex): Hex {
  return `${wallet.toLowerCase()}${signature.slice(2)}` as Hex;
}
