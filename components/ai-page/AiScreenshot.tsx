import Image from "next/image";

import type { AiScreenshotSlot } from "@/lib/ai-page/screenshots";

/**
 * A screenshot of the app in a quiet frame, at its own aspect ratio, with
 * a one-line caption saying what moment it shows. A slot with no file yet
 * renders nothing: the pages never show a stand-in for the app.
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
  // Until the app's own screenshot exists, the page shows nothing here.
  if (!slot.src) {
    return null;
  }
  return (
    <figure
      className={`tw-m-0 tw-flex tw-flex-col tw-gap-2.5 ${narrow ? "tw-max-w-[560px]" : ""}`}
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
        <Image
          src={slot.src}
          alt={alt}
          width={slot.width}
          height={slot.height}
          priority={priority}
          sizes={narrow ? "560px" : "(min-width: 896px) 832px, 100vw"}
          className="tw-block tw-h-auto tw-w-full"
        />
      </div>
      <figcaption className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
