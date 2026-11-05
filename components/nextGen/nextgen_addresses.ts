import { publicEnv } from "@/config/env";
import { goerli, mainnet, sepolia } from "viem/chains";

// NextGen contract addresses without their ABIs. Code that only compares or
// links an address imports from here; `nextgen_contracts.ts` attaches the
// ABIs (~60 KB minified) for code that reads or writes the contracts.

export interface NextGenContractAddresses {
  [goerli.id]: string;
  [sepolia.id]: string;
  [mainnet.id]: string;
}

function getNextGenChainId() {
  // The public env schema coerces NEXTGEN_CHAIN_ID to a number.
  const chainId = publicEnv.NEXTGEN_CHAIN_ID;
  if (chainId === sepolia.id) {
    return sepolia.id;
  }
  if (chainId === goerli.id) {
    return goerli.id;
  }
  return mainnet.id;
}

export const NEXTGEN_CHAIN_ID = getNextGenChainId();

export const NEXTGEN_CORE_ADDRESSES: NextGenContractAddresses = {
  [goerli.id]: "0x25a972f1bf3c816061ceaea59d2bb3fe4c130766",
  [sepolia.id]: "0x60671e59a349589Ad74bE6cd643003a0Abb38cC3",
  [mainnet.id]: "0x45882f9bc325E14FBb298a1Df930C43a874B83ae",
};

export const NEXTGEN_MINTER_ADDRESSES: NextGenContractAddresses = {
  [goerli.id]: "0x1a7040a7d4baf44f136c50626a4e8f4ae5ca170f",
  [sepolia.id]: "0xaDA9027EaF134038d3731f677241c4351b799Eb4",
  [mainnet.id]: "0x6113fd2c91514e84e6149c6ede47f2e09545253a",
};

export const NEXTGEN_ADMIN_ADDRESSES: NextGenContractAddresses = {
  [goerli.id]: "0x1bAe1D145Dd61fBBB62C85f8A6d7B6eDe0D150f5",
  [sepolia.id]: "0xdA8d7A00D222b223e6152B22fFe97cA1778E5f38",
  [mainnet.id]: "0x26ad9c64930bf5e057cb895a183436b30ad140f8",
};
