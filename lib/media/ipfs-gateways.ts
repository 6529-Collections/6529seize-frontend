import {
  IPFS_PATH_GATEWAY_HOSTS,
  IPFS_SUBDOMAIN_GATEWAY_SUFFIXES,
  canonicalizeGatewayHostname,
} from "./decentralized-media";

export const IPFS_GATEWAY_CSP_SOURCES = [
  ...IPFS_PATH_GATEWAY_HOSTS.flatMap((hostname) => [
    `https://${hostname}`,
    `https://${hostname}/ipfs/*`,
    `https://${hostname}/ipns/*`,
  ]),
  ...IPFS_SUBDOMAIN_GATEWAY_SUFFIXES.map((suffix) => `https://*${suffix}`),
];

export const IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES = [
  "media.6529.io",
  ...IPFS_PATH_GATEWAY_HOSTS,
  ...IPFS_SUBDOMAIN_GATEWAY_SUFFIXES.map((suffix) => `**${suffix}`),
];

export function getConfiguredIpfsGatewayHost(
  gatewayEndpoint?: string
): string | null {
  if (!gatewayEndpoint) {
    return null;
  }

  try {
    const parsedUrl = new URL(gatewayEndpoint);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    return canonicalizeGatewayHostname(parsedUrl.hostname);
  } catch {
    return null;
  }
}
