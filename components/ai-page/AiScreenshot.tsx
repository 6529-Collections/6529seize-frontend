import type { CSSProperties } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";
import type { AiScreenshotSlot } from "@/lib/ai-page/screenshots";
import AiZoomPicture, { type AiZoomText } from "./AiZoomPicture";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A screenshot of the app with a one-line caption saying what moment it
 * shows. Where the slot has a phone-width capture, a phone shows that one
 * instead. `framed` draws it in a window of its own, with a shadow, so it
 * reads as a picture of the app and not as part of the page.
 */
export default function AiScreenshot({
  slot,
  alt,
  phoneAlt,
  caption,
  framed = false,
}: {
  readonly slot: AiScreenshotSlot;
  /** What the screenshot shows, for screen readers. */
  readonly alt: string;
  /** What the phone-width capture shows, when the slot has one. */
  readonly phoneAlt?: string | undefined;
  /** The moment it shows, in a line under it. */
  readonly caption: string;
  readonly framed?: boolean | undefined;
}) {
  const text: AiZoomText = {
    open: t(LOCALE, "ai.use.zoom"),
    close: t(LOCALE, "ai.use.zoomClose"),
  };
  const picture = slot.phone ? (
    <>
      <div className="max-sm:tw-hidden">
        <AiZoomPicture image={slot.image} alt={alt} text={text} bare={framed} />
      </div>
      <div className="sm:tw-hidden">
        <AiZoomPicture
          image={slot.phone}
          alt={phoneAlt ?? alt}
          text={text}
          bare={framed}
        />
      </div>
    </>
  ) : (
    <AiZoomPicture image={slot.image} alt={alt} text={text} bare={framed} />
  );
  const shown = AI_USE_IMAGES[slot.image];
  const width = Math.round((shown.crop?.width ?? shown.width) / shown.scale);
  return (
    <figure className="tw-m-0 tw-flex tw-flex-col tw-gap-3">
      {framed ? (
        <div
          className="tw-mx-auto tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-[0_32px_80px_-28px_rgba(0,0,0,0.95)] sm:tw-max-w-[var(--frame)]"
          style={{ "--frame": `${width}px` } as CSSProperties}
        >
          <div
            aria-hidden="true"
            className="tw-flex tw-h-8 tw-items-center tw-gap-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-px-3"
          >
            <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
            <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
            <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
            <span className="tw-flex-1 tw-pr-10 tw-text-center tw-text-xs tw-font-medium tw-text-iron-500">
              {t(LOCALE, "ai.download.windowTitle")}
            </span>
          </div>
          {picture}
        </div>
      ) : (
        picture
      )}
      <figcaption className="tw-text-center tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
