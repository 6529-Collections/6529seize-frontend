import FarcasterCard from "@/components/waves/FarcasterCard";
import { isFarcasterHost } from "@/src/services/farcaster/url";

import type { LinkHandler } from "../linkTypes";

const isFarcasterLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    return isFarcasterHost(url.hostname);
  } catch {
    return false;
  }
};

export const createFarcasterHandler = (): LinkHandler => ({
  match: isFarcasterLink,
  render: (href) => <FarcasterCard href={href} />,
  display: "block",
});
