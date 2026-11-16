import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiScreenshotSlot } from "@/lib/ai-page/screenshots";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A screenshot of the app in a quiet frame, at its own aspect ratio, with
 * a one-line caption saying what moment it shows. A slot with no file yet
 * shows a neutral placeholder of the same size.
 */
export default function AiScreenshot({
  slot,
  alt,
  caption,
  narrow = false,
  priority = false,
}: {
  readonly slot: AiScreenshotSlot;
  /** What the screenshot shows, for screen readers. */
  readonly alt: string;
  /** The moment it shows, in a line under it. */
  readonly caption: string;
  /** At most 560 px wide, for a dialog rather than a whole page. */
  readonly narrow?: boolean | undefined;
  readonly priority?: boolean | undefined;
}) {
  return (
    <figure
      className={`tw-m-0 tw-flex tw-flex-col tw-gap-2.5 ${narrow ? "tw-max-w-[560px]" : ""}`}
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
        {slot.src ? (
          <Image
            src={slot.src}
            alt={alt}
            width={slot.width}
            height={slot.height}
            priority={priority}
            sizes={narrow ? "560px" : "(min-width: 896px) 832px, 100vw"}
            className="tw-block tw-h-auto tw-w-full"
          />
        ) : (
          <div
            role="img"
            aria-label={alt}
            style={{ aspectRatio: `${slot.width} / ${slot.height}` }}
            className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.02)_0_12px,transparent_12px_24px)] tw-text-iron-500"
          >
            <PhotoIcon aria-hidden="true" className="tw-size-8" />
            <span className="tw-text-sm">
              {t(LOCALE, "ai.screenshot.placeholder")}
            </span>
          </div>
        )}
      </div>
      <figcaption className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
