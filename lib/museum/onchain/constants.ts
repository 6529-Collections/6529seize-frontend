import type { Address, Hex } from "viem";

/**
 * The Sepolia test registry that holds the 6529 Network Museum publication
 * catalog. Every value here is a trust anchor: the registry address and its
 * owner are published by the Museum, and the code hash and interface ID name
 * the unaudited `v1.0.0-rc.1` build of `ProvenanceRegistry`. This is
 * a test registry, not the Museum's record on mainnet.
 */
export const ONCHAIN_MUSEUM_CHAIN_ID = 11155111;
export const ONCHAIN_MUSEUM_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";
export const ONCHAIN_MUSEUM_REGISTRY: Address =
  "0xee91c45A1893fbb45ce8EeA170eF05d8d85bb850";
export const ONCHAIN_MUSEUM_EXPECTED_OWNER: Address =
  "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
export const ONCHAIN_MUSEUM_EXPECTED_CODE_HASH: Hex =
  "0x82c7eb55636df0586e996047eb6d92cb49de2181258b49eddad199d261af4842";
export const PROVENANCE_REGISTRY_INTERFACE_ID: Hex = "0x5d79f565";
export const ERC165_INTERFACE_ID: Hex = "0x01ffc9a7";
export const ERC165_INVALID_INTERFACE_ID: Hex = "0xffffffff";

/** Registered canonicalization literals; the ID is keccak256 of the literal. */
export const RFC8785_JCS_LITERAL = "RFC8785_JCS";
/** The canonicalization release 2 registered for LF-normalized text. */
export const LF_NORMALIZED_LITERAL = "LF_NORMALIZED";
/** `RAW_BYTES_LF` is the design-record name for the same byte mode. */
export const RAW_BYTES_LF_LITERAL = "RAW_BYTES_LF";

export const HASH_ALGORITHM_KECCAK256 = 1;
export const HASH_ALGORITHM_SHA256 = 2;

/** Subject IDs of release 2 documents: keccak256(prefix + repository path). */
export const PUBLIC_DOCUMENT_SUBJECT_PREFIX =
  "6529networkmuseum.subject.public_document.v1:";

/** The largest byte string the route accepts from an IPFS gateway. */
export const ONCHAIN_MUSEUM_MAX_CONTENT_BYTES = 4 * 1024 * 1024;
