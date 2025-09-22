import { isFarcasterHost } from "@/src/services/farcaster/url";

import FarcasterCard from "@/components/waves/FarcasterCard";
import type { LinkHandler } from "../linkTypes";

const matchFarcasterLink = (href: string): URL | null => {
  try {
    const url = new URL(href);
    return isFarcasterHost(url.hostname) ? url : null;
  } catch {
    return null;
  }
};

export const createFarcasterHandler = (): LinkHandler<URL> => ({
  match: matchFarcasterLink,
  render: (_payload, context) => (
    <FarcasterCard
      href={context.href}
      renderFallback={() => context.renderOpenGraph()}
    />
  ),
  display: "block",
});

export type FarcasterHandler = ReturnType<typeof createFarcasterHandler>;
