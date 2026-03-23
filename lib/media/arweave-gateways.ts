// Ordered list: the array order defines the Arweave fallback retry order.
const ARWEAVE_GATEWAY_HOSTS = [
  "arweave.net",
  "ardrive.net",
  "gateway.arweave.net",
  "gateway.ar.io",
] as const;

const dedupe = (values: readonly string[]): string[] =>
  Array.from(new Set(values));

export const canonicalizeArweaveGatewayHostname = (hostname: string): string =>
  hostname.trim().toLowerCase().replace(/\.+$/, "");

export const ARWEAVE_FALLBACK_HOSTS = [...ARWEAVE_GATEWAY_HOSTS];

const ARWEAVE_GATEWAY_EXACT_HOSTS = dedupe(ARWEAVE_GATEWAY_HOSTS);

const ARWEAVE_GATEWAY_WILDCARD_BASE_HOSTS = dedupe(ARWEAVE_GATEWAY_HOSTS);

export const ARWEAVE_GATEWAY_CSP_SOURCES = dedupe(
  ARWEAVE_GATEWAY_HOSTS.flatMap((hostname) => [
    `https://${hostname}`,
    `https://*.${hostname}`,
  ])
);

export const ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES = dedupe(
  ARWEAVE_GATEWAY_HOSTS.flatMap((hostname) => [hostname, `**.${hostname}`])
);

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
  try {
    const parsed = new URL(value);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return value;
    }

    if (!isArweaveGatewayRuntimeHost(parsed.hostname)) {
      return value;
    }

    const strippedValue = `${parsed.pathname}${parsed.search}${parsed.hash}`.replace(
      /^\/+/,
      ""
    );

    if (!strippedValue) {
      return value;
    }

    return strippedValue;
  } catch {
    return value;
  }
};
