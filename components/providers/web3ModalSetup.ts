import { createWeb3Modal } from "@web3modal/wagmi/react";
import { CW_PROJECT_ID } from "@/constants";
import { Config } from "wagmi";

export function initWeb3Modal(wagmiConfig: Config) {
  createWeb3Modal({
    wagmiConfig,
    projectId: CW_PROJECT_ID,
    enableAnalytics: true,
    themeMode: "dark",
  });
}
