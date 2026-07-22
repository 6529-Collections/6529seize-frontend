const PRODUCTION_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const STAGING_SUFFIX = "staging";

interface AppEnvironment {
  readonly hostname: string;
  readonly isProduction: boolean;
  readonly title: string;
  readonly badge: string | null;
  readonly favicon: string;
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
  hostname,
  port,
}: {
  readonly firstLabel: string;
  readonly hostname: string;
  readonly port: string;
}): string {
  if (LOCAL_HOSTNAMES.has(hostname)) {
    return port ? `LOCAL:${port}` : "LOCAL";
  }

  const normalizedLabel = firstLabel.toLowerCase();
  if (normalizedLabel.endsWith(STAGING_SUFFIX)) {
    const prefix = normalizedLabel.slice(0, -STAGING_SUFFIX.length);
    return `${prefix.toUpperCase()}STG`;
  }

  return normalizedLabel.toUpperCase();
}

export function getAppEnvironment(baseEndpoint: string): AppEnvironment {
  const url = new URL(baseEndpoint);
  const hostname = url.hostname.toLowerCase();
  const isProduction = PRODUCTION_HOSTNAMES.has(hostname);
  const firstLabel = hostname.split(".")[0] ?? hostname;
  const environmentName = LOCAL_HOSTNAMES.has(hostname)
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
          hostname,
          port: url.port,
        }),
    favicon:
      hostname === "staging.6529.io"
        ? "/favicon-staging.ico"
        : isProduction
          ? "/favicon.ico"
          : "/favicon-alt.ico",
  };
}
