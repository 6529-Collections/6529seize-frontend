import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiScreenshotSlot } from "@/lib/ai-page/screenshots";
import AiZoomPicture, { type AiZoomText } from "./AiZoomPicture";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A screenshot of the app with a one-line caption saying what moment it
 * shows. Where the slot has a phone-width capture, a phone shows that one
 * instead.
 */
export default function AiScreenshot({
  slot,
  alt,
  phoneAlt,
  caption,
}: {
  readonly slot: AiScreenshotSlot;
  /** What the screenshot shows, for screen readers. */
  readonly alt: string;
  /** What the phone-width capture shows, when the slot has one. */
  readonly phoneAlt?: string | undefined;
  /** The moment it shows, in a line under it. */
  readonly caption: string;
}) {
  const text: AiZoomText = {
    open: t(LOCALE, "ai.use.zoom"),
    close: t(LOCALE, "ai.use.zoomClose"),
  };
  return (
    <figure className="tw-m-0 tw-flex tw-flex-col tw-gap-2.5">
      {slot.phone ? (
        <>
          <div className="max-sm:tw-hidden">
            <AiZoomPicture image={slot.image} alt={alt} text={text} />
          </div>
          <div className="sm:tw-hidden">
            <AiZoomPicture
              image={slot.phone}
              alt={phoneAlt ?? alt}
              text={text}
            />
          </div>
        </>
      ) : (
        <AiZoomPicture image={slot.image} alt={alt} text={text} />
      )}
      <figcaption className="tw-text-center tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
