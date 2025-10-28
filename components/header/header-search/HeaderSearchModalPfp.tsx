"use client";

import { useResolvedIpfsUrl } from "@/hooks/useResolvedIpfsUrl";
import Image from "next/image";

function getLevelBgColor(level: number) {
  if (level >= 80) return "tw-bg-[#55B075] tw-text-black";
  if (level >= 60) return "tw-bg-[#AABE68] tw-text-black";
  return "tw-bg-[#DA8C60] tw-text-white";
}

export default function HeaderSearchModalPfp({
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
  const { data: resolved } = useResolvedIpfsUrl(src);

  const levelColor = getLevelBgColor(level);

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
