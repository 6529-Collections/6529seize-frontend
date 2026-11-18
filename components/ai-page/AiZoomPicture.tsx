"use client";

import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRef, type CSSProperties } from "react";

import {
  AI_USE_IMAGES,
  type AiCrop,
  type AiUseImage,
  type AiUseImageKey,
} from "@/lib/ai-page/content/useImages";

/** A 1 px border and a slight shadow, so a picture never reads as page. */
const FRAME =
  "tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-[0_18px_44px_-20px_rgba(0,0,0,0.9)]";

export type AiZoomText = {
  /** "See the whole picture", for the button around the picture. */
  readonly open: string;
  readonly close: string;
  /** The window's title in the frame: "6529 AI". */
  readonly title: string;
  /** "Pinch to zoom in.", in the zoom on a phone. */
  readonly hint: string;
};

/** The frame's title bar: a window's three dots, its title, and the zoom. */
function TitleBar({ title }: { readonly title: string }) {
  return (
    <span
      aria-hidden="true"
      className="tw-grid tw-h-8 tw-grid-cols-[1fr_auto_1fr] tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-px-3"
    >
      <span className="tw-flex tw-gap-1.5">
        <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
        <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
        <span className="tw-size-2.5 tw-rounded-full tw-bg-iron-700" />
      </span>
      <span className="tw-text-xs tw-font-medium tw-text-iron-500">
        {title}
      </span>
      <span className="tw-flex tw-justify-end">
        <span className="tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-400 tw-transition group-hover:tw-bg-white/10 group-hover:tw-text-iron-50 group-focus-visible:tw-text-iron-50">
          <ArrowsPointingOutIcon className="tw-size-4" />
        </span>
      </span>
    </span>
  );
}

/** The shown part of a capture, cropped with CSS from the whole file. */
function Cropped({
  picture,
  crop,
  alt,
  fade,
  sizes,
}: {
  readonly picture: AiUseImage;
  readonly crop: AiCrop;
  readonly alt: string;
  readonly fade: boolean;
  readonly sizes: string;
}) {
  // How much wider than the frame the whole capture is drawn.
  const zoom = picture.width / crop.width;
  return (
    <span
      className="tw-relative tw-block tw-overflow-hidden"
      style={{
        aspectRatio: `${crop.width} / ${crop.height}`,
        ...(fade
          ? {
              maskImage:
                "linear-gradient(to right, black 82%, transparent 100%)",
            }
          : {}),
      }}
    >
      <Image
        src={picture.src}
        alt={alt}
        width={picture.width}
        height={picture.height}
        sizes={sizes}
        className="tw-absolute tw-max-w-none"
        style={{
          width: `${100 * zoom}%`,
          height: "auto",
          left: `${(-100 * crop.x) / crop.width}%`,
          top: `${(-100 * crop.y) / crop.height}%`,
        }}
      />
    </span>
  );
}

function Variant({
  picture,
  crop,
  alt,
  text,
  fade,
  fill,
}: {
  readonly picture: AiUseImage;
  readonly crop: AiCrop;
  readonly alt: string;
  readonly text: AiZoomText;
  readonly fade: boolean;
  readonly fill: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The CSS width the shown part has at its real size, and the frame's
  // with its two 1 px borders.
  const realWidth = Math.round(crop.width / picture.scale);
  const frameStyle: CSSProperties | undefined = fill
    ? undefined
    : { maxWidth: realWidth + 2 };
  const zoom = picture.width / crop.width;
  const sizes = `(min-width: 1152px) ${Math.round(Math.min(realWidth, 820) * zoom)}px, ${Math.round(100 * zoom)}vw`;
  if (picture.frame) {
    // A dialog of the system's own, or a picture the app made: it has a
    // frame of its own, or needs none, and shows whole, so no zoom.
    return (
      <span
        className={`tw-mx-auto tw-block tw-w-full ${picture.frame === "dialog" ? FRAME : "tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10"}`}
        style={frameStyle}
      >
        <Cropped
          picture={picture}
          crop={crop}
          alt={alt}
          fade={fade}
          sizes={sizes}
        />
      </span>
    );
  }
  // The whole capture, fitted to the screen: no wider than its real size,
  // the screen, or the height the screen leaves it.
  const fullWidth = Math.round(picture.width / picture.scale);
  const fitted = `min(${fullWidth}px, calc(96vw - 2px), calc((96dvh - 3.5rem) * ${(picture.width / picture.height).toFixed(4)}))`;
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${text.open}: ${alt}`}
        className={`${FRAME} tw-group tw-mx-auto tw-block tw-w-full tw-cursor-zoom-in tw-p-0 tw-text-left focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400`}
        style={frameStyle}
      >
        <TitleBar title={text.title} />
        <Cropped
          picture={picture}
          crop={crop}
          alt={alt}
          fade={fade}
          sizes={sizes}
        />
      </button>
      <dialog
        ref={dialog}
        aria-label={alt}
        // A click outside it closes it, where the browser supports that;
        // Close and Escape close it everywhere.
        closedby="any"
        className="tw-m-auto tw-max-h-[96dvh] tw-max-w-[96vw] tw-overflow-auto tw-overscroll-contain tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 backdrop:tw-bg-black/85"
      >
        <div className="tw-flex tw-h-14 tw-items-center tw-justify-between tw-gap-3 tw-px-3">
          <span className="tw-text-[13px] tw-text-iron-400 sm:tw-hidden">
            {text.hint}
          </span>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="tw-ml-auto tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-9"
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
          sizes={`${fullWidth}px`}
          loading="lazy"
          className="tw-block tw-h-auto tw-max-w-none"
          style={{ width: fitted }}
        />
      </dialog>
    </>
  );
}

function wholeCrop(picture: AiUseImage): AiCrop {
  return (
    picture.crop ?? { x: 0, y: 0, width: picture.width, height: picture.height }
  );
}

/**
 * A picture of the app in a window frame: the part its step is about, at
 * its real size or the column's width, whichever is less. A phone shows a
 * narrower part that cuts no line of text, or the app's own phone-width
 * capture, or nothing where neither reads. A click opens the whole
 * capture fitted to the screen, and a touch screen zooms it in with a
 * pinch.
 */
export default function AiZoomPicture({
  image,
  alt,
  phoneAlt,
  text,
  fill = false,
}: {
  readonly image: AiUseImageKey;
  readonly alt: string;
  /** What the phone's picture shows, where it shows something else. */
  readonly phoneAlt?: string | undefined;
  readonly text: AiZoomText;
  /** Fill the column whatever the picture's real size, as in a row. */
  readonly fill?: boolean | undefined;
}) {
  const picture: AiUseImage = AI_USE_IMAGES[image];
  const desktop = (
    <Variant
      picture={picture}
      crop={wholeCrop(picture)}
      alt={alt}
      text={text}
      fade={false}
      fill={fill}
    />
  );
  const phone = picture.phone;
  if (!phone) {
    return desktop;
  }
  if ("hidden" in phone) {
    return <div className="max-sm:tw-hidden">{desktop}</div>;
  }
  const phonePicture: AiUseImage =
    "image" in phone ? AI_USE_IMAGES[phone.image as AiUseImageKey] : picture;
  const phoneCrop = "crop" in phone ? phone.crop : wholeCrop(phonePicture);
  return (
    <>
      <div className="max-sm:tw-hidden">{desktop}</div>
      <div className="sm:tw-hidden">
        <Variant
          picture={phonePicture}
          crop={phoneCrop}
          alt={phoneAlt ?? alt}
          text={text}
          fade={"fade" in phone && phone.fade}
          fill
        />
      </div>
    </>
  );
}
