"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { EX_ELEVATION } from "../tokens";

/**
 * A card (EXPLAINED.md §4.2, §6.5): a portrait at the art's own ratio
 * (542:801) with the art inside, its alt text and a caption with its
 * number, name, season and licence. When the scaled art cannot load, the
 * original is tried; when neither can, an empty dashed frame with its
 * number. The art is the only colour in the art.
 */
const ART_RATIO = "542 / 801";

export default function ArtCard({
  src,
  alt,
  number,
  caption,
  sizes = "(max-width: 768px) 96px, 150px",
  priority = false,
  fallbackSrc = null,
}: {
  /** The art; null draws the frame. */
  readonly src: string | null;
  /** The original image, tried when the scaled one fails to load. */
  readonly fallbackSrc?: string | null;
  readonly alt: string;
  /** "#562": shown in the frame when there is no art. */
  readonly number: string;
  /** Name, edition and licence, under the card. */
  readonly caption?: ReactNode;
  readonly sizes?: string;
  readonly priority?: boolean;
}) {
  // 0: the scaled art; 1: its original; 2: neither loads, so the frame.
  const [attempt, setAttempt] = useState(0);
  const candidates = [src, fallbackSrc];
  const art = attempt < 2 ? (candidates[attempt] ?? null) : null;
  return (
    <figure className="tw-m-0" data-artcard={art ? "art" : "frame"}>
      {art ? (
        <div
          className={`tw-relative tw-overflow-hidden tw-rounded-md tw-bg-iron-900 ${EX_ELEVATION.art}`}
          style={{ aspectRatio: ART_RATIO }}
        >
          <Image
            src={art}
            alt={alt}
            fill
            sizes={sizes}
            className="tw-object-cover"
            priority={priority}
            unoptimized
            onError={() =>
              setAttempt((value) => (value === 0 && fallbackSrc ? 1 : 2))
            }
          />
        </div>
      ) : (
        <div
          className="tw-grid tw-place-items-center tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-bg-black/30"
          style={{ aspectRatio: ART_RATIO }}
          role="img"
          aria-label={alt}
        >
          <span
            className="tw-text-[22px] tw-font-semibold tw-text-iron-400"
            aria-hidden="true"
          >
            {number}
          </span>
        </div>
      )}
      {caption !== undefined && (
        <figcaption className="tw-mt-2.5 tw-text-sm tw-leading-5 tw-text-iron-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
