import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import {
  DELEGATION_CONTRACT,
  SUBSCRIPTIONS_CHAIN,
  MANIFOLD_NETWORK,
} from "@/constants";
import { Capacitor } from "@capacitor/core";
import { Chain } from "viem";
import { mainnet, sepolia, goerli } from "viem/chains";
import { wagmiConfigCapacitor } from "./wagmiConfigCapacitor";
import { wagmiConfigWeb } from "./wagmiConfigWeb";
import { Config } from "wagmi";

export type WagmiConfig = {
  chains: Chain[];
  config: Config;
};

export function getChains() {
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

const wagmiMetadata = {
  name: "6529.io",
  description: "6529.io",
  url: process.env.BASE_ENDPOINT!,
  icons: [
    "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
  ],
};

export function getWagmiConfig(): WagmiConfig {
  const isCapacitor = Capacitor.isNativePlatform();
  const CONTRACT_CHAINS = getChains();
  const chains = [...CONTRACT_CHAINS] as [Chain, ...Chain[]];
  const config = isCapacitor
    ? wagmiConfigCapacitor(chains, wagmiMetadata)
    : wagmiConfigWeb(chains, wagmiMetadata);
  return {
    chains,
    config,
  };
}
