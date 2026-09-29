"use client";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function WaveDropAdditionalInfoVideo({
  src,
  preload,
  layout,
}: {
  readonly src: string;
  readonly preload: "metadata" | "none";
  readonly layout: "prominent" | "fill";
}) {
  const locale = useBrowserLocale();
  const { downloadMedia, isDownloading, openMedia, openLabel } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: t(locale, "drop.additionalInfo.saveVideo"),
      mimeType: "video",
      labels: {
        openInBrowser: t(locale, "theMemes.detail.art.media.openInBrowser"),
        openInNewTab: t(locale, "theMemes.detail.art.media.openInNewTab"),
      },
    });

  return (
    <SeizeVideoPlayer
      src={src}
      template="watch-media"
      preload={preload}
      layout={layout}
      align="center"
      locale={locale}
      onDownload={downloadMedia}
      onOpen={openMedia}
      openLabel={openLabel}
      isDownloading={isDownloading}
    />
  );
}
