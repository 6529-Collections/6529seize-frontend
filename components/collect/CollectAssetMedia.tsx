"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Image from "next/image";
import { useState } from "react";

export default function CollectAssetMedia({
  src,
  name,
}: {
  readonly src: string | null;
  readonly name: string;
}) {
  const locale = useBrowserLocale();
  const [failed, setFailed] = useState(false);
  let safeSource: string | null = null;
  try {
    if (src && new URL(src).protocol === "https:") safeSource = src;
  } catch {
    /* Missing or invalid metadata is represented by the artwork title. */
  }
  if (!safeSource || failed)
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-p-5 tw-text-center tw-text-sm tw-text-iron-400">
        {t(locale, "collect.art.unavailable")}
      </div>
    );
  return (
    <Image
      src={safeSource}
      alt={name}
      fill
      unoptimized
      sizes="(min-width: 1024px) 25vw, 50vw"
      className="tw-object-contain"
      onError={() => setFailed(true)}
    />
  );
}
