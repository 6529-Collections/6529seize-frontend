import { Chain, goerli, mainnet, sepolia } from "wagmi/chains";
import {
  DELEGATION_CONTRACT,
  SUBSCRIPTIONS_CHAIN,
} from "../constants"; // Assuming constants are one level up from utils
import { NEXTGEN_CHAIN_ID } from "../components/nextGen/nextgen_contracts";
import { MANIFOLD_NETWORK } from "../hooks/useManifoldClaim";

export function getChains(): Chain[] {
  const chains: Chain[] = [mainnet];
  if (
    DELEGATION_CONTRACT.chain_id === sepolia.id ||
    (NEXTGEN_CHAIN_ID as number) === sepolia.id ||
    SUBSCRIPTIONS_CHAIN.id.toString() === sepolia.id.toString() ||
    MANIFOLD_NETWORK.id.toString() === sepolia.id.toString()
  ) {
    chains.push(sepolia);
  }
  if (
    DELEGATION_CONTRACT.chain_id === goerli.id ||
    (NEXTGEN_CHAIN_ID as number) === goerli.id
  ) {
    chains.push(goerli);
  }
  return chains;
}

export const wagmiMetadata = {
  name: "6529.io",
  description: "6529.io",
  url: process.env.BASE_ENDPOINT!,
  icons: [
    "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
  ],
}; 
