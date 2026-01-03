import { publicEnv } from "@/config/env";
import ArtBlocksTokenCard from "@/src/components/waves/ArtBlocksTokenCard";
import {
  parseArtBlocksLink,
  type ArtBlocksTokenIdentifier,
} from "@/src/services/artblocks/url";
import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";

import type { LinkHandler } from "../linkTypes";

const ART_BLOCKS_FLAG_CANDIDATES = [
  "VITE_FEATURE_AB_CARD",
  "NEXT_PUBLIC_VITE_FEATURE_AB_CARD",
  "NEXT_PUBLIC_FEATURE_AB_CARD",
  "FEATURE_AB_CARD",
] as const;

const parseFeatureFlagValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (["1", "true", "on", "yes", "enabled"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "off", "no", "disabled"].includes(normalized)) {
    return false;
  }

  return Boolean(normalized);
};

const isArtBlocksCardEnabled = (): boolean => {
  for (const flagName of ART_BLOCKS_FLAG_CANDIDATES) {
    const value = publicEnv[flagName];
    if (value !== undefined) {
      return parseFeatureFlagValue(value);
    }
  }

  return true;
};

const ArtBlocksPreview = ({
  href,
  tokenId,
}: {
  readonly href: string;
  readonly tokenId: ArtBlocksTokenIdentifier;
}) => (
  <LinkHandlerFrame href={href}>
    <ArtBlocksTokenCard href={href} id={tokenId} />
  </LinkHandlerFrame>
);

export const createArtBlocksHandler = (): LinkHandler => ({
  match: (href) =>
    isArtBlocksCardEnabled() && Boolean(parseArtBlocksLink(href)),
  render: (href) => {
    if (!isArtBlocksCardEnabled()) {
      throw new Error("Art Blocks card disabled");
    }

    const tokenId = parseArtBlocksLink(href);
    if (!tokenId) {
      throw new Error("Invalid Art Blocks link");
    }

    return <ArtBlocksPreview href={href} tokenId={tokenId} />;
  },
  display: "block",
});
