"use client";

import { useResolvedIpfsUrl } from "@/hooks/useResolvedIpfsUrl";
import Image from "next/image";

type TransferModalPfpSize = 40 | 56;

const PFP_SIZE_CLASSES: Record<TransferModalPfpSize, string> = {
  40: "tw-size-10",
  56: "tw-size-14",
};

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
  readonly src?: string | null | undefined;
  readonly alt?: string | undefined;
  readonly level: number;
  readonly size?: TransferModalPfpSize | undefined;
}) {
  const { data: resolved } = useResolvedIpfsUrl(src);

  const levelColor = getLevelBgColor(level);
  const sizeClass = PFP_SIZE_CLASSES[size] ?? PFP_SIZE_CLASSES[40];

  if (!resolved) {
    return (
      <div
        className={`${sizeClass} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-sm tw-font-semibold ${levelColor}`}
      >
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
        className={`tw-absolute -tw-right-[5px] -tw-top-[5px] tw-flex tw-h-[18px] tw-w-[18px] tw-items-center tw-justify-center tw-rounded-full tw-text-[8px] tw-font-semibold ${levelColor}`}
      >
        {level}
      </div>
    </div>
  );
}
