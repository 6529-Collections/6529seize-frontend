import {
  ARWEAVE_GATEWAY_HOSTS,
  ARWEAVE_TX_SUBDOMAIN_SUFFIXES,
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  canonicalizeGatewayHostname,
  parseDecentralizedMediaRef,
} from "./decentralized-media";

const ADDITIONAL_CSP_HOSTS = ["ar.io"] as const;

const dedupe = (values: readonly string[]): string[] =>
  Array.from(new Set(values));

export const canonicalizeArweaveGatewayHostname = (hostname: string): string =>
  canonicalizeGatewayHostname(hostname);

export const ARWEAVE_FALLBACK_HOSTS = [...ARWEAVE_GATEWAY_HOSTS];

const ARWEAVE_GATEWAY_EXACT_HOSTS = dedupe(ARWEAVE_GATEWAY_HOSTS);

const ARWEAVE_GATEWAY_WILDCARD_BASE_HOSTS = dedupe([
  ...ARWEAVE_GATEWAY_HOSTS,
  ...ARWEAVE_TX_SUBDOMAIN_SUFFIXES.map((suffix) => suffix.slice(1)),
]);

export const ARWEAVE_GATEWAY_CSP_SOURCES = dedupe([
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  ...ARWEAVE_GATEWAY_HOSTS.map((hostname) => `https://${hostname}`),
  ...ARWEAVE_GATEWAY_HOSTS.map((hostname) => `https://*.${hostname}`),
  ...ADDITIONAL_CSP_HOSTS.map((hostname) => `https://${hostname}`),
  ...ADDITIONAL_CSP_HOSTS.map((hostname) => `https://*.${hostname}`),
]);

export const ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES = dedupe([
  "media.6529.io",
  ...ARWEAVE_GATEWAY_HOSTS.flatMap((hostname) => [hostname, `**.${hostname}`]),
  ...ADDITIONAL_CSP_HOSTS.flatMap((hostname) => [hostname, `**.${hostname}`]),
]);

export const isArweaveGatewayRuntimeHost = (hostname: string): boolean => {
  const normalized = canonicalizeArweaveGatewayHostname(hostname);
  if (!normalized) {
    return false;
  }

  if (ARWEAVE_GATEWAY_EXACT_HOSTS.includes(normalized)) {
    return true;
  }

  return ARWEAVE_GATEWAY_WILDCARD_BASE_HOSTS.some(
    (baseHost) => normalized === baseHost || normalized.endsWith(`.${baseHost}`)
  );
};

export const stripArweaveGatewayUrlPrefix = (value: string): string => {
  const parsed = parseDecentralizedMediaRef(value);
  if (parsed?.protocol !== "arweave") {
    return value;
  }

  return parsed.path ? `${parsed.id}/${parsed.path}` : parsed.id;
};
