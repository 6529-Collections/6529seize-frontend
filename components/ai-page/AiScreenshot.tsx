import Image from "next/image";

import type { AiScreenshotSlot } from "@/lib/ai-page/screenshots";

/**
 * A screenshot of the app with the cards' 1 px border and radius, at its
 * own aspect ratio, with a one-line caption saying what moment it shows.
 * A slot with no file yet renders nothing: the pages never show a
 * stand-in for the app.
 */
export default function AiScreenshot({
  slot,
  alt,
  caption,
  realSize = false,
  priority = false,
}: {
  readonly slot: AiScreenshotSlot;
  /** What the screenshot shows, for screen readers. */
  readonly alt: string;
  /** The moment it shows, in a line under it. */
  readonly caption: string;
  /**
   * Show it at the size it has on screen (half the 2x file), centred, as
   * for a dialog; otherwise it fills the column.
   */
  readonly realSize?: boolean | undefined;
  readonly priority?: boolean | undefined;
}) {
  // Until the app's own screenshot exists, the page shows nothing here.
  if (!slot.src) {
    return null;
  }
  const shownWidth = Math.round(slot.width / 2);
  return (
    <figure
      className={`tw-m-0 tw-flex tw-flex-col tw-gap-2.5 ${realSize ? "tw-mx-auto tw-w-full" : ""}`}
      style={realSize ? { maxWidth: shownWidth } : undefined}
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950">
        <Image
          src={slot.src}
          alt={alt}
          width={slot.width}
          height={slot.height}
          priority={priority}
          sizes={
            realSize ? `${shownWidth}px` : "(min-width: 896px) 832px, 100vw"
          }
          className="tw-block tw-h-auto tw-w-full"
        />
      </div>
      <figcaption className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
