import { publicEnv } from "@/config/env";
import { canonicalizeArweaveGatewayHostname } from "@/lib/media/arweave-gateways";

export function getConfiguredIpfsGatewayHost(
  gatewayEndpoint: string | undefined = publicEnv.IPFS_GATEWAY_ENDPOINT
): string | null {
  if (!gatewayEndpoint) {
    return null;
  }

  try {
    const parsedUrl = new URL(gatewayEndpoint);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    return canonicalizeArweaveGatewayHostname(parsedUrl.hostname);
  } catch {
    return null;
  }
}
