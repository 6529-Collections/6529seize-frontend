import { getConfiguredAppOrigin } from "./appEnvironment";

/**
 * Presentation only: never use this request-derived origin for authorization.
 * Prerendered pages (`dynamic = "force-static"`) receive empty request headers
 * and use the deployment's configured base URL instead.
 */
export function getRequestOrigin(
  headers: Pick<Headers, "get">,
  configuredBaseUrl: string
): string {
  const forwardedProtocol = headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";

  for (const name of ["x-forwarded-host", "host"]) {
    const host = headers.get(name)?.split(",")[0]?.trim();
    if (!host || /[\s/@\\?#]/u.test(host)) continue;
    try {
      return new URL(`${protocol}://${host}`).origin;
    } catch {
      // An invalid forwarded host may still have a usable Host header.
    }
  }
  return getConfiguredAppOrigin(configuredBaseUrl);
}
