import { getEthereumRpcUrl } from "@/config/ethereumRpcEnv";
import { createServerPublicClient } from "@/lib/ethereum/serverPublicClient";
import { mainnet } from "viem/chains";

const MAINNET_RPC_TIMEOUT_MS = 5_000;

function createEthereumMainnetClient() {
  return createServerPublicClient({
    chain: mainnet,
    rpcUrl: getEthereumRpcUrl(),
    timeoutMs: MAINNET_RPC_TIMEOUT_MS,
  });
}

type EthereumMainnetClient = ReturnType<typeof createEthereumMainnetClient>;

let client: EthereumMainnetClient | undefined;

export function getEthereumMainnetClient(): EthereumMainnetClient {
  client ??= createEthereumMainnetClient();

  return client;
}
