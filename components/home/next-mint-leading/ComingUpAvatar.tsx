"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  MEDIA_SIGNATURE_BYTE_COUNT,
  sniffMediaType,
} from "@/helpers/media-signature.helpers";
import { FIRST_PARTY_MEDIA_RESOLVER_HOSTS } from "@/lib/media/decentralized-media";
import Image from "next/image";
import { useEffect, useState } from "react";

const AVATAR_SIZE = 28;

function canResizeSource(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.port || url.username || url.password)
      return false;
    return (
      (url.hostname === "d3lqz0a4bldqgf.cloudfront.net" &&
        url.pathname.startsWith("/pfp/")) ||
      (FIRST_PARTY_MEDIA_RESOLVER_HOSTS.some((host) => host === url.hostname) &&
        /^\/(ipfs|ipns|arweave)\//.test(url.pathname))
    );
  } catch {
    return false;
  }
}

function ComingUpAvatarImage({ src }: { readonly src: string }) {
  const eligible = canResizeSource(src);
  const [optimize, setOptimize] = useState<boolean | null>(
    eligible ? null : false
  );
  const [imageWidth, setImageWidth] = useState(AVATAR_SIZE);

  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => {
      controller.abort();
      setOptimize(false);
    }, 5_000);
    // Extensionless IPFS URLs can also be animated AVIF, which Next does not
    // detect. Read only the signature before choosing the safe resize path.
    void fetch(src, {
      headers: { Range: `bytes=0-${MEDIA_SIGNATURE_BYTE_COUNT - 1}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status !== 206) {
          await response.body?.cancel();
          return false;
        }
        const signature = sniffMediaType(
          new Uint8Array(await response.arrayBuffer())
        );
        // Next passes animated PNG/WebP through intact; other formats keep the
        // existing source rather than risk replacing animation with a still.
        return ["image/jpeg", "image/png", "image/webp"].includes(
          signature?.type ?? ""
        );
      })
      .catch(() => false)
      .then((value) => {
        globalThis.clearTimeout(timeout);
        if (!controller.signal.aborted) setOptimize(value);
      });
    return () => {
      globalThis.clearTimeout(timeout);
      controller.abort();
    };
  }, [eligible, src]);

  if (optimize === null) return null;
  const fallbackSrc = getScaledImageUri(src, ImageScale.W_AUTO_H_50);

  return (
    <Image
      src={optimize ? src : fallbackSrc}
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      sizes={`${imageWidth}px`}
      unoptimized={!optimize}
      loading="eager"
      alt=""
      className="tw-h-full tw-w-full tw-bg-transparent tw-object-cover"
      onError={() => setOptimize(false)}
      onLoad={({ currentTarget: image }) => {
        // A landscape source needs extra width to keep its square cover crop
        // sharp. Learn its ratio from the small response, never the original.
        if (optimize && image.naturalHeight > 0) {
          setImageWidth((currentWidth) =>
            Math.max(
              currentWidth,
              Math.ceil(
                (AVATAR_SIZE * image.naturalWidth) / image.naturalHeight
              )
            )
          );
        }
      }}
    />
  );
}

export default function ComingUpAvatar({
  pfpUrl,
}: {
  readonly pfpUrl: string | null | undefined;
}) {
  const src = pfpUrl ? resolveIpfsUrlSync(pfpUrl) : null;
  return (
    <ProfileAvatar
      pfpUrl={pfpUrl}
      size={ProfileBadgeSize.SMALL}
      alt=""
      imageContent={
        src ? <ComingUpAvatarImage key={src} src={src} /> : undefined
      }
    />
  );
}
