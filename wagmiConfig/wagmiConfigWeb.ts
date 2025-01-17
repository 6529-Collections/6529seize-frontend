import { defaultWagmiConfig } from "@web3modal/wagmi";
import { CW_PROJECT_ID } from "../constants";
import { Chain } from "viem";

export const wagmiConfigWeb = (chains: [Chain, ...Chain[]], metadata: any) => {
  return defaultWagmiConfig({
    chains,
    projectId: CW_PROJECT_ID,
    metadata,
    enableCoinbase: true,
    coinbasePreference: "all",
    auth: {
      email: false,
      socials: [],
    },
  });
};
