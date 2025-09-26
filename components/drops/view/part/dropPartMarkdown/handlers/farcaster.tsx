import FarcasterCard from "@/components/waves/FarcasterCard";
import { parseFarcasterResource } from "@/src/services/farcaster/url";

import type { LinkHandler } from "../linkTypes";

const parseFarcasterLink = (href: string) => {
  try {
    const url = new URL(href);
    return parseFarcasterResource(url);
  } catch {
    return null;
  }
};

export const createFarcasterHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseFarcasterLink(href)),
  render: (href) => {
    const resource = parseFarcasterLink(href);
    if (!resource) {
      throw new Error("Invalid Farcaster link");
    }

    return <FarcasterCard href={href} />;
  },
  display: "block",
});
