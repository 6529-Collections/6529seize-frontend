"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WavePicturePreview({ file }: { readonly file: File }) {
  const locale = useBrowserLocale();
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <Image
      src={url}
      alt={t(locale, "waves.information.picturePreview")}
      width={640}
      height={640}
      unoptimized
      className="tw-aspect-square tw-h-auto tw-w-full tw-object-contain"
    />
  );
}
