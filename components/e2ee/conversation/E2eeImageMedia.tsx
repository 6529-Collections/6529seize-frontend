"use client";

import { useRef, useState } from "react";
import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "@/components/drops/view/item/content/media/ImageMediaModal";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { LocalImagePreviewContext } from "@/components/drops/view/item/content/media/LocalImagePreviewContext";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeAttachment } from "@/lib/e2ee/types";

/** Shared media controls, using only the validated, locally decrypted object URL. */
export function E2eeImageMedia({
  url,
  name,
  attachment,
}: {
  readonly url: string;
  readonly name: string;
  readonly attachment: E2eeAttachment;
}) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const media = useMediaActions({
    url,
    fallbackFileName: name,
    mimeType: attachment.mime,
    dialogTitle: t(locale, "drop.media.saveDialogTitle"),
  });
  // A blob URL belongs to this WebView and cannot be opened in an external browser.
  const openMedia = isCapacitor ? undefined : media.openMedia;
  const fullscreen = () => {
    const image = expanded ? modalImageRef.current : imageRef.current;
    if (image) requestCenteredImageFullscreen(image);
  };
  const close = () => {
    setExpanded(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  return (
    <LocalImagePreviewContext.Provider value={url}>
      <span className="tw-group/media tw-relative tw-inline-block tw-max-w-full tw-align-top">
        <button
          ref={triggerRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(true);
          }}
          aria-label={t(locale, "drop.media.openPreview")}
          className="tw-block tw-max-w-full tw-cursor-zoom-in tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- validated local blob; never send decrypted media to an optimizer. */}
          <img
            ref={imageRef}
            src={url}
            alt={t(locale, "e2ee.message.attachment.imageAlt", { name })}
            width={attachment.width}
            height={attachment.height}
            className="tw-h-auto tw-max-h-80 tw-w-auto tw-max-w-full tw-rounded-lg tw-bg-iron-900 tw-object-contain"
          />
        </button>
        <InlineMediaActions
          variant="image"
          onOpen={openMedia}
          openLabel={media.openLabel}
          onDownload={media.downloadMedia}
          isDownloading={media.isDownloading}
          onFullscreen={fullscreen}
          fullscreenTargetAvailable={!isCapacitor}
          visibility="desktop-hover"
        />
      </span>
      {expanded && (
        <ImageMediaModal
          src={url}
          imageRef={modalImageRef}
          onClose={close}
          onOpen={openMedia}
          openLabel={media.openLabel}
          onDownload={media.downloadMedia}
          isDownloading={media.isDownloading}
          onFullscreen={fullscreen}
          fullscreenTargetAvailable={!isCapacitor}
        />
      )}
    </LocalImagePreviewContext.Provider>
  );
}
