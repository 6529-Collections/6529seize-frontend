const PRODUCTION_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);
// Only loopback hosts are treated as local; custom aliases remain visibly non-production.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
const STAGING_SUFFIX = "staging";

export const PRODUCTION_APP_ORIGIN = "https://6529.io";

export interface AppEnvironment {
  readonly hostname: string;
  readonly host: string;
  readonly isProduction: boolean;
  readonly title: string;
  readonly badge: string | null;
  readonly favicon: string;
  readonly faviconFallback: string;
}

const PRODUCTION_ENVIRONMENT: AppEnvironment = {
  hostname: "6529.io",
  host: "6529.io",
  isProduction: true,
  title: "6529.io",
  badge: null,
  favicon: "/favicon.svg",
  faviconFallback: "/favicon.png",
};

type BrowserOriginReader = () => unknown;

const readBrowserOrigin = (): unknown =>
  (
    globalThis as {
      readonly window?: {
        readonly location?: {
          readonly origin?: unknown;
        };
      };
    }
  ).window?.location?.origin;

function parseEnvironmentUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value);
    if (!SUPPORTED_PROTOCOLS.has(url.protocol) || !url.hostname) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function getEnvironmentName(firstLabel: string): string {
  const normalizedLabel = firstLabel.toLowerCase();

  if (normalizedLabel.endsWith(STAGING_SUFFIX)) {
    const prefix = normalizedLabel.slice(0, -STAGING_SUFFIX.length);
    return `${prefix.toUpperCase()}Staging`;
  }

  return `${normalizedLabel.charAt(0).toUpperCase()}${normalizedLabel.slice(1)}`;
}

function getEnvironmentBadge({
  firstLabel,
  isLocal,
  port,
}: {
  readonly firstLabel: string;
  readonly isLocal: boolean;
  readonly port: string;
}): string {
  if (isLocal) {
    return port ? `LCL:${port}` : "LCL";
  }

  const normalizedLabel = firstLabel.toLowerCase();
  if (normalizedLabel.endsWith(STAGING_SUFFIX)) {
    const prefix = normalizedLabel.slice(0, -STAGING_SUFFIX.length);
    return `${prefix.toUpperCase()}STG`;
  }

  return normalizedLabel.toUpperCase();
}

function getFaviconBasename(hostname: string, isProduction: boolean): string {
  // The dedicated staging artwork belongs only to the shared staging host.
  // Personal and future non-production hosts intentionally use the alt icon.
  if (hostname === "staging.6529.io") {
    return "/favicon-staging";
  }

  if (isProduction) {
    return "/favicon";
  }

  return "/favicon-alt";
}

export function getAppEnvironment(baseEndpoint: string): AppEnvironment {
  const url = parseEnvironmentUrl(baseEndpoint);
  if (url === null) {
    return PRODUCTION_ENVIRONMENT;
  }

  const hostname = url.hostname.toLowerCase();
  const host = url.host.toLowerCase();
  const isProduction = PRODUCTION_HOSTNAMES.has(hostname);
  const isLocal = LOCAL_HOSTNAMES.has(hostname);
  const firstLabel = hostname.split(".")[0] ?? hostname;
  const environmentName = isLocal
    ? "Localhost"
    : getEnvironmentName(firstLabel);
  const faviconBasename = getFaviconBasename(hostname, isProduction);

  return {
    hostname,
    host,
    isProduction,
    title: isProduction ? "6529.io" : `6529 ${environmentName}`,
    badge: isProduction
      ? null
      : getEnvironmentBadge({
          firstLabel,
          isLocal,
          port: url.port,
        }),
    favicon: `${faviconBasename}.svg`,
    faviconFallback: `${faviconBasename}.png`,
  };
}

export function getBrowserOrigin(
  browserOriginReader: BrowserOriginReader = readBrowserOrigin
): string {
  try {
    const url = parseEnvironmentUrl(browserOriginReader());
    return url?.origin ?? PRODUCTION_APP_ORIGIN;
  } catch {
    return PRODUCTION_APP_ORIGIN;
  }
}

export function getBrowserAppEnvironment(
  browserOriginReader?: BrowserOriginReader
): AppEnvironment {
  return getAppEnvironment(getBrowserOrigin(browserOriginReader));
}

export function getProductionAppEnvironment(): AppEnvironment {
  return PRODUCTION_ENVIRONMENT;
}
