import { zeroAddress, zeroHash, type Address, type Hex } from "viem";

/**
 * Set after deployment: the Sepolia `ProvenanceRegistry` that holds the
 * Museum catalog as 6529 provenance profile v1 records. Until it is set,
 * the route reports the registry as unavailable.
 */
export const ONCHAIN_MUSEUM_REGISTRY_PLACEHOLDER: Address = zeroAddress;

/**
 * Set after the `v1.0.0-rc.2` tag: keccak256 of that build's runtime code.
 * The registry has no immutables, so every deployment of a build shares it.
 */
const ONCHAIN_MUSEUM_CODE_HASH_PLACEHOLDER: Hex = zeroHash;

/**
 * Every trust anchor of the route, in one place. The registry address and
 * owner are published by the Museum; the code hash and interface ID name the
 * unaudited build the registry runs. The expected counts are the release the
 * Museum published to it. This is a test registry on Sepolia, not the
 * Museum's record on mainnet.
 */
export const ONCHAIN_MUSEUM_SOURCE = {
  chainId: 11155111,
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  registry: ONCHAIN_MUSEUM_REGISTRY_PLACEHOLDER,
  owner: "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68" as Address,
  build: {
    tag: "v1.0.0-rc.2",
    runtimeCodeHash: ONCHAIN_MUSEUM_CODE_HASH_PLACEHOLDER,
    interfaceId: "0x5d79f565" as Hex,
  },
  expected: { releases: 1, records: 589 },
} as const;

export const ERC165_INTERFACE_ID: Hex = "0x01ffc9a7";
export const ERC165_INVALID_INTERFACE_ID: Hex = "0xffffffff";

/** Registered canonicalization literals; the ID is keccak256 of the literal. */
export const RFC8785_JCS_LITERAL = "RFC8785_JCS";
/** The literal the previous registry used for LF-normalized text. */
export const LF_NORMALIZED_LITERAL = "LF_NORMALIZED";
/** The profile's literal for text bytes with LF line endings. */
export const RAW_BYTES_LF_LITERAL = "RAW_BYTES_LF";
/** The profile's literal for bytes hashed as served. */
export const RAW_BYTES_LITERAL = "RAW_BYTES";

export const HASH_ALGORITHM_KECCAK256 = 1;
export const HASH_ALGORITHM_SHA256 = 2;

/** The largest byte string the route accepts from an IPFS gateway. */
export const ONCHAIN_MUSEUM_MAX_CONTENT_BYTES = 4 * 1024 * 1024;
