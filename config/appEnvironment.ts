const PRODUCTION_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);
// Only loopback hosts are treated as local; custom aliases remain visibly non-production.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const STAGING_SUFFIX = "staging";

interface AppEnvironment {
  readonly hostname: string;
  readonly isProduction: boolean;
  readonly title: string;
  readonly badge: string | null;
  readonly favicon: string;
}

const PRODUCTION_ENVIRONMENT: AppEnvironment = {
  hostname: "6529.io",
  isProduction: true,
  title: "6529.io",
  badge: null,
  favicon: "/favicon.ico",
};

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
    return port ? `LOCAL:${port}` : "LOCAL";
  }

  const normalizedLabel = firstLabel.toLowerCase();
  if (normalizedLabel.endsWith(STAGING_SUFFIX)) {
    const prefix = normalizedLabel.slice(0, -STAGING_SUFFIX.length);
    return `${prefix.toUpperCase()}STG`;
  }

  return normalizedLabel.toUpperCase();
}

function getFavicon(hostname: string, isProduction: boolean): string {
  // The dedicated staging artwork belongs only to the shared staging host.
  // Personal and future non-production hosts intentionally use the alt icon.
  if (hostname === "staging.6529.io") {
    return "/favicon-staging.ico";
  }

  if (isProduction) {
    return "/favicon.ico";
  }

  return "/favicon-alt.ico";
}

export function getAppEnvironment(baseEndpoint: string): AppEnvironment {
  let url: URL;
  try {
    url = new URL(baseEndpoint);
  } catch {
    return PRODUCTION_ENVIRONMENT;
  }

  const hostname = url.hostname.toLowerCase();
  const isProduction = PRODUCTION_HOSTNAMES.has(hostname);
  const isLocal = LOCAL_HOSTNAMES.has(hostname);
  const firstLabel = hostname.split(".")[0] ?? hostname;
  const environmentName = isLocal
    ? "Localhost"
    : getEnvironmentName(firstLabel);

  return {
    hostname,
    isProduction,
    title: isProduction ? "6529.io" : `6529 ${environmentName}`,
    badge: isProduction
      ? null
      : getEnvironmentBadge({
          firstLabel,
          isLocal,
          port: url.port,
        }),
    favicon: getFavicon(hostname, isProduction),
  };
}
