import {
  NEXTGEN_ADMIN_ABI,
  NEXTGEN_CORE_ABI,
  NEXTGEN_MINTER_ABI,
} from "@/abis";
import { publicEnv } from "@/config/env";
import { goerli, mainnet, sepolia } from "viem/chains";

export interface NextGenContract {
  [goerli.id]: string;
  [sepolia.id]: string;
  [mainnet.id]: string;
  abi: any;
}

function getNextGenChainId() {
  if (publicEnv.NEXTGEN_CHAIN_ID) {
    const chainId = publicEnv.NEXTGEN_CHAIN_ID;
    if (chainId == sepolia.id) {
      return sepolia.id;
    }
    if (chainId == goerli.id) {
      return goerli.id;
    }
  }
  return mainnet.id;
}

export const NEXTGEN_CHAIN_ID = getNextGenChainId();

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
  [goerli.id]: "0x25a972f1bf3c816061ceaea59d2bb3fe4c130766",
  [sepolia.id]: "0x60671e59a349589Ad74bE6cd643003a0Abb38cC3",
  [mainnet.id]: "0x45882f9bc325E14FBb298a1Df930C43a874B83ae",
  abi: NEXTGEN_CORE_ABI,
};

export const NEXTGEN_MINTER: NextGenContract = {
  [goerli.id]: "0x1a7040a7d4baf44f136c50626a4e8f4ae5ca170f",
  [sepolia.id]: "0xaDA9027EaF134038d3731f677241c4351b799Eb4",
  [mainnet.id]: "0x6113fd2c91514e84e6149c6ede47f2e09545253a",
  abi: NEXTGEN_MINTER_ABI,
};

export const NEXTGEN_ADMIN: NextGenContract = {
  [goerli.id]: "0x1bAe1D145Dd61fBBB62C85f8A6d7B6eDe0D150f5",
  [sepolia.id]: "0xdA8d7A00D222b223e6152B22fFe97cA1778E5f38",
  [mainnet.id]: "0x26ad9c64930bf5e057cb895a183436b30ad140f8",
  abi: NEXTGEN_ADMIN_ABI,
};
