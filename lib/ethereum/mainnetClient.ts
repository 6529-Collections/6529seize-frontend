import { getEthereumRpcUrl } from "@/config/ethereumRpcEnv";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const MAINNET_RPC_TIMEOUT_MS = 5_000;

function createEthereumMainnetClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(getEthereumRpcUrl(), {
      retryCount: 0,
      timeout: MAINNET_RPC_TIMEOUT_MS,
    }),
  });
}

type EthereumMainnetClient = ReturnType<typeof createEthereumMainnetClient>;

let client: EthereumMainnetClient | undefined;

export function getEthereumMainnetClient(): EthereumMainnetClient {
  client ??= createEthereumMainnetClient();

  return client;
}
