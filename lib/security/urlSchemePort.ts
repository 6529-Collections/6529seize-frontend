/** Scheme and port limits applied by the URL guard on every hop. */
export interface UrlSchemePortOptions {
  /**
   * Schemes accepted on every hop, redirects included (for example
   * `["https:"]`). When omitted, any scheme the fetch can follow is accepted.
   */
  readonly allowedProtocols?: readonly string[] | undefined;
  /**
   * Ports accepted on every hop, redirects included. A URL without an
   * explicit port uses its scheme's default (80 for http, 443 for https).
   * When omitted, any port is accepted.
   */
  readonly allowedPorts?: readonly number[] | undefined;
}

type SchemePortRefusal = {
  readonly kind: "unsupported-protocol" | "host-not-allowed";
  readonly message: string;
};

const DEFAULT_PORTS: ReadonlyMap<string, number> = new Map([
  ["http:", 80],
  ["https:", 443],
]);

function getEffectivePort(url: URL): number | null {
  if (url.port) {
    return Number(url.port);
  }
  return DEFAULT_PORTS.get(url.protocol.toLowerCase()) ?? null;
}

/** Why `url` is outside the allowed schemes or ports, or null when it is not. */
export function findSchemeOrPortRefusal(
  url: URL,
  { allowedProtocols, allowedPorts }: UrlSchemePortOptions
): SchemePortRefusal | null {
  if (
    allowedProtocols &&
    !allowedProtocols.includes(url.protocol.toLowerCase())
  ) {
    return {
      kind: "unsupported-protocol",
      message: "URL scheme is not allowed.",
    };
  }

  if (allowedPorts) {
    const port = getEffectivePort(url);
    if (port === null || !allowedPorts.includes(port)) {
      return { kind: "host-not-allowed", message: "URL port is not allowed." };
    }
  }
  return null;
}
