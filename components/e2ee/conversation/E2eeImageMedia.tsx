"use client";

import { useEffect } from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";
import { LocalImagePreviewContext } from "@/components/drops/view/item/content/media/LocalImagePreviewContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeAttachment } from "@/lib/e2ee/types";
import { useE2eeImageRegistry } from "./E2eeImageGallery";

/** The ordinary image renderer receives only the validated, locally decrypted URL. */
export function E2eeImageMedia({
  url,
  name,
  attachment,
  onRetry,
}: {
  readonly url: string;
  readonly name: string;
  readonly attachment: E2eeAttachment;
  readonly onRetry?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const register = useE2eeImageRegistry();
  useEffect(
    () =>
      register?.(attachment.blob, { src: url, name, mime: attachment.mime }),
    [register, attachment.blob, attachment.mime, url, name]
  );
  return (
    <LocalImagePreviewContext.Provider value={url}>
      <DropListItemContentMediaImage
        src={url}
        alt={t(locale, "e2ee.message.attachment.imageAlt", { name })}
        openPreviewLabel={`${t(locale, "drop.media.openPreview")}: ${name}`}
        downloadFileName={name}
        mimeType={attachment.mime}
        galleryItemId={attachment.blob}
        loadStrategy="eager"
        onRetry={onRetry}
      />
    </LocalImagePreviewContext.Provider>
  );
}
