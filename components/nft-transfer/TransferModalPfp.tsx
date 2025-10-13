"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import Image from "next/image";
import { useEffect, useState } from "react";

function getLevelBgColor(level: number) {
  if (level >= 80) return "tw-bg-[#55B075] tw-text-black";
  if (level >= 60) return "tw-bg-[#AABE68] tw-text-black";
  return "tw-bg-[#DA8C60]";
}

export default function TransferModalPfp({
  src,
  alt,
  level,
  size = 40,
}: {
  readonly src?: string | null;
  readonly alt?: string;
  readonly level: number;
  readonly size?: number;
}) {
  const [resolved, setResolved] = useState<string | null>(null);

  const levelColor = getLevelBgColor(level);

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setResolved(null);
      return () => {
        isMounted = false;
      };
    }

    setResolved(null);

    (async () => {
      try {
        const newSrc = await resolveIpfsUrl(src);
        if (isMounted) {
          setResolved(newSrc ?? null);
        }
      } catch {
        if (isMounted) {
          setResolved(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!resolved) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-semibold ${levelColor}`}>
        {level}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-inline-block">
      <Image
        src={resolved}
        alt={alt ?? ""}
        width={size}
        height={size}
        className="tw-rounded-full tw-object-cover"
      />
      <div
        className={`tw-absolute tw-top-[-5px] tw-right-[-5px] tw-h-[18px] tw-w-[18px] tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-[8px] tw-font-semibold ${levelColor}`}>
        {level}
      </div>
    </div>
  );
}
