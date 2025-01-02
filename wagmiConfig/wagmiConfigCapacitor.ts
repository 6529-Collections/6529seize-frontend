import { Chain, fallback, http } from "viem";
import { mainnet, sepolia, goerli } from "viem/chains";
import { createConfig } from "wagmi";
import { walletConnect, coinbaseWallet, injected } from "wagmi/connectors";
import { CW_PROJECT_ID } from "../constants";

export const wagmiConfigCapacitor = (
  chains: [Chain, ...Chain[]],
  metadata: any
) => {
  return createConfig({
    chains,
    connectors: [
      walletConnect({
        projectId: CW_PROJECT_ID,
        metadata,
        showQrModal: false,
      }),
      coinbaseWallet({
        appName: "6529 CORE",
        appLogoUrl:
          "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
        enableMobileWalletLink: true,
        version: "3",
      }),
      injected(),
    ],
    transports: {
      [mainnet.id]: fallback([http(), http("https://rpc1.6529.io")], {
        retryCount: 3,
      }),
      [sepolia.id]: fallback([http(), http("https://rpc1.6529.io")], {
        retryCount: 3,
      }),
      [goerli.id]: fallback([http(), http("https://rpc1.6529.io")], {
        retryCount: 3,
      }),
    },
  });
};
