import CompoundPreview from "@/components/waves/CompoundPreview";

import type { LinkHandler } from "../linkTypes";

const matchesDomainOrSubdomain = (host: string, domain: string): boolean => {
  return host === domain || host.endsWith(`.${domain}`);
};

const isCompoundLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (matchesDomainOrSubdomain(hostname, "app.compound.finance")) {
      return true;
    }

    if (matchesDomainOrSubdomain(hostname, "etherscan.io")) {
      return pathname.startsWith("/tx/") || pathname.startsWith("/address/");
    }

    return false;
  } catch {
    return false;
  }
};

export const createCompoundHandler = (): LinkHandler => ({
  match: isCompoundLink,
  render: (href) => <CompoundPreview href={href} />,
  display: "block",
});

export type CompoundHandler = ReturnType<typeof createCompoundHandler>;
