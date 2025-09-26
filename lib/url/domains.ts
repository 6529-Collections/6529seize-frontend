export function matchesDomainOrSubdomain(host: string, domain: string): boolean {
  if (!host || !domain) {
    return false;
  }

  const normalizedHost = host.trim().toLowerCase().replace(/\.+$/, "");
  const normalizedDomain = domain.trim().toLowerCase().replace(/\.+$/, "");

  return (
    normalizedHost === normalizedDomain ||
    normalizedHost.endsWith(`.${normalizedDomain}`)
  );
}
