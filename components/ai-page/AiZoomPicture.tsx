"use client";

import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRef } from "react";

import type { AiUseImageKey } from "@/lib/ai-page/content/useImages";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";

const FRAME =
  "tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950";

export type AiZoomText = {
  /** "See the whole picture", for the button around the picture. */
  readonly open: string;
  readonly close: string;
};

/**
 * A picture of the app: the part its step is about, at its real size or
 * the column's width, whichever is less, in the cards' border and radius.
 * A click opens the whole capture in a dialog.
 */
export default function AiZoomPicture({
  image,
  alt,
  text,
  priority = false,
  fill = false,
}: {
  readonly image: AiUseImageKey;
  readonly alt: string;
  readonly text: AiZoomText;
  readonly priority?: boolean | undefined;
  /** Fill the column whatever the picture's real size, as in a row. */
  readonly fill?: boolean | undefined;
}) {
  const picture = AI_USE_IMAGES[image];
  const dialog = useRef<HTMLDialogElement>(null);
  const crop = picture.crop ?? {
    x: 0,
    y: 0,
    width: picture.width,
    height: picture.height,
  };
  // The CSS width the shown part has at its real size.
  const realWidth = Math.round(crop.width / picture.scale);
  // How much wider than the frame the whole capture is drawn.
  const zoom = picture.width / crop.width;
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${text.open}: ${alt}`}
        className={`${FRAME} tw-group tw-relative tw-mx-auto tw-block tw-w-full tw-cursor-zoom-in tw-p-0 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400`}
        style={fill ? undefined : { maxWidth: realWidth }}
      >
        <span
          className="tw-relative tw-block tw-overflow-hidden"
          style={{ aspectRatio: `${crop.width} / ${crop.height}` }}
        >
          <Image
            src={picture.src}
            alt={alt}
            width={picture.width}
            height={picture.height}
            priority={priority}
            sizes={`(min-width: 1152px) ${Math.round(Math.min(realWidth, 820) * zoom)}px, ${Math.round(100 * zoom)}vw`}
            className="tw-absolute tw-max-w-none"
            style={{
              width: `${100 * zoom}%`,
              height: "auto",
              left: `${(-100 * crop.x) / crop.width}%`,
              top: `${(-100 * crop.y) / crop.height}%`,
            }}
          />
        </span>
        <span
          aria-hidden="true"
          className="tw-absolute tw-right-2 tw-top-2 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-black/60 tw-text-iron-100 tw-opacity-0 tw-transition group-hover:tw-opacity-100 group-focus-visible:tw-opacity-100"
        >
          <ArrowsPointingOutIcon className="tw-size-4" />
        </span>
      </button>
      <dialog
        ref={dialog}
        aria-label={alt}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className="tw-m-auto tw-max-h-[95vh] tw-max-w-[96vw] tw-overflow-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 backdrop:tw-bg-black/80"
      >
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-justify-end tw-bg-iron-950/80 tw-p-2 tw-backdrop-blur">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-9"
          >
            <XMarkIcon aria-hidden="true" className="tw-size-4" />
            {text.close}
          </button>
        </div>
        <Image
          src={picture.src}
          alt=""
          width={picture.width}
          height={picture.height}
          sizes={`${Math.round(picture.width / picture.scale)}px`}
          loading="lazy"
          className="tw-block tw-h-auto tw-max-w-full"
          style={{ width: Math.round(picture.width / picture.scale) }}
        />
      </dialog>
    </>
  );
}
