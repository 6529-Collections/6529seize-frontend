import {
  NEXTGEN_ADMIN_ABI,
  NEXTGEN_CORE_ABI,
  NEXTGEN_MINTER_ABI,
} from "@/abis/abis";
import type { Abi } from "viem";
import {
  NEXTGEN_ADMIN_ADDRESSES,
  NEXTGEN_CORE_ADDRESSES,
  NEXTGEN_MINTER_ADDRESSES,
  type NextGenContractAddresses,
} from "./nextgen_addresses";

export { NEXTGEN_CHAIN_ID } from "./nextgen_addresses";

export interface NextGenContract extends NextGenContractAddresses {
  abi: Abi;
}

export enum FunctionSelectors {
  CREATE_COLLECTION = "0xe1fa8089",
  SET_COLLECTION_DATA = "0x7b5dbac5",
  UPDATE_COLLECTION_INFO = "0x73b40ae9",
  CHANGE_METADATA_VIEW = "0xf6a85dd0",
  CHANGE_TOKEN_DATA = "0x9a8490f3", // not implemented
  UPDATE_IMAGES_AND_ATTRIBUTES = "0xad241020",
  ADD_RANDOMIZER = "0x1aab8d69",
  FREEZE_COLLECTION = "0xbcc405d0", // not implemented
  SET_COLLECTION_COSTS = "0xd2f4302f",
  SET_COLLECTION_PHASES = "0xb85f97a0",
  AIRDROP_TOKENS = "0x5ac57d8b",
  INITIALIZE_BURN = "0x1253e16d",
  SET_FINAL_SUPPLY = "0x366b0ab2",
  SET_PRIMARY_AND_SECONDARY_SPLITS = "0xd418baec",
  PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES = "0x7e04bcb7",
  PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES = "0x1c7a8b22",
  ACCEPT_ADDRESSES_AND_PERCENTAGES = "0xd6516f47",
  PAY_ARTIST = "0x2ebc24b3",
  MINT_AND_AUCTION = "0x46372ba6",
  INITIALIZE_EXTERNAL_BURN_SWAP = "0x4c29c6f2",
}

export const NEXTGEN_CORE: NextGenContract = {
  ...NEXTGEN_CORE_ADDRESSES,
  abi: NEXTGEN_CORE_ABI,
};

export const NEXTGEN_MINTER: NextGenContract = {
  ...NEXTGEN_MINTER_ADDRESSES,
  abi: NEXTGEN_MINTER_ABI,
};

export const NEXTGEN_ADMIN: NextGenContract = {
  ...NEXTGEN_ADMIN_ADDRESSES,
  abi: NEXTGEN_ADMIN_ABI,
};
