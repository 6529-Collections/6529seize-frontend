import ManifoldPreview from "@/components/waves/ManifoldPreview";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import type { LinkHandler } from "../linkTypes";

const MANIFOLD_LISTING_PATH_PATTERN = /^\/@[^/]+\/id\/[^/?#]+\/?$/i;

const isManifoldListingLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();

    if (!matchesDomainOrSubdomain(hostname, "manifold.xyz")) {
      return false;
    }

    return MANIFOLD_LISTING_PATH_PATTERN.test(url.pathname);
  } catch {
    return false;
  }
};

export const createManifoldHandler = (): LinkHandler => ({
  match: isManifoldListingLink,
  render: (href) => <ManifoldPreview href={href} />,
  display: "block",
});
