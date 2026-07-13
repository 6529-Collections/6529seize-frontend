import { PhotoIcon } from "@heroicons/react/24/outline";
import { memo } from "react";

import { FallbackImage } from "@/components/common/FallbackImage";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { publicEnv } from "@/config/env";
import { ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "@/lib/media/arweave-gateways";
import { getMediaResolverHostname } from "@/lib/media/decentralized-media";
import { IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "@/lib/media/ipfs-gateways";

import type { NFTSearchResult } from "./HeaderSearchModalItem";

interface HeaderSearchModalItemMediaProps {
  readonly nft?: NFTSearchResult | undefined;
  readonly src?: string | null | undefined;
  readonly alt?: string | undefined;
  readonly roundedFull?: boolean | undefined;
}

const STATIC_ALLOWED_IMAGE_HOSTS = new Set([
  "6529.io",
  "seize.io",
  "staging.6529.io",
  "media.generator.seize.io",
  "d3lqz0a4bldqgf.cloudfront.net",
  "img.youtube.com",
  "i.seadn.io",
  "i2.seadn.io",
  "i2c.seadn.io",
  "i.ytimg.com",
  "res.cloudinary.com",
  "ipfs.6529.io",
  "ipfs.io",
  ...ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES,
  ...IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES,
]);

const getSafeImageSource = (source: string): string | null => {
  const resolvedSource = resolveIpfsUrlSync(source.trim());

  if (!resolvedSource || resolvedSource.startsWith("//")) {
    return null;
  }
  if (resolvedSource.startsWith("/")) {
    return resolvedSource;
  }
  if (!resolvedSource.includes(":")) {
    return `/${resolvedSource}`;
  }

  try {
    const parsed = new URL(resolvedSource);
    const hostname = parsed.hostname.toLowerCase();
    const resolverHostname = getMediaResolverHostname(
      publicEnv.MEDIA_RESOLVER_ENDPOINT
    ).toLowerCase();
    const isLocalDevelopmentImage =
      parsed.protocol === "http:" && hostname === "localhost";
    const isAllowedHttpsImage =
      parsed.protocol === "https:" &&
      (STATIC_ALLOWED_IMAGE_HOSTS.has(hostname) ||
        hostname === resolverHostname);

    return isLocalDevelopmentImage || isAllowedHttpsImage
      ? resolvedSource
      : null;
  } catch {
    return null;
  }
};

const HeaderSearchModalItemMedia = memo(
  ({
    nft,
    src,
    alt = "",
    roundedFull = false,
  }: HeaderSearchModalItemMediaProps) => {
    const nftSources = nft
      ? [nft.icon_url, nft.thumbnail_url, nft.image_url]
      : [];
    const nftSource = nft
      ? nftSources
          .find((value) => typeof value === "string" && value.trim().length > 0)
          ?.trim()
      : undefined;
    const candidateSrc = src ?? nftSource ?? null;
    let altText = alt;
    if (nft) {
      const rawName: unknown = nft.name;
      altText =
        typeof rawName === "string" && rawName.length > 0
          ? rawName
          : `#${nft.id}`;
    }
    const imgSrc = candidateSrc ? getSafeImageSource(candidateSrc) : null;

    if (!imgSrc) {
      return (
        <div
          className={`${
            roundedFull ? "tw-rounded-full" : "tw-rounded-md"
          } tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-bg-iron-900 tw-text-iron-500 tw-ring-1 tw-ring-white/10`}
          role={altText ? "img" : undefined}
          aria-label={altText || undefined}
          aria-hidden={altText ? undefined : "true"}
        >
          <PhotoIcon className="tw-size-4" />
        </div>
      );
    }

    return (
      <div className="tw-flex-shrink-0">
        <FallbackImage
          primarySrc={imgSrc}
          fallbackSrc="/Seize_Logo_Glasses.png"
          optimize={false}
          width={40}
          height={40}
          className={`${
            roundedFull ? "tw-rounded-full" : "tw-rounded-md"
          } tw-h-10 tw-w-10 tw-bg-iron-900 tw-object-cover tw-ring-1 tw-ring-white/10`}
          alt={altText}
        />
      </div>
    );
  }
);

HeaderSearchModalItemMedia.displayName = "HeaderSearchModalItemMedia";

export default HeaderSearchModalItemMedia;
