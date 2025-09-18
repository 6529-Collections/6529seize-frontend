import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([http(), http("https://rpc1.6529.io")]),
});
