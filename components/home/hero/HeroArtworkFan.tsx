"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import styles from "./HeroArtworkFan.module.css";

interface Artwork {
  readonly number: number;
  readonly name: string;
  readonly image: string;
}

// Fixed OG collection selection, in fan-slot order, with card #1 at the front.
// These local still images are independent of current and upcoming mints.
const HERO_ARTWORKS: readonly Artwork[] = [
  { number: 5, name: "rekt6529", image: "/home/hero/5.webp" },
  {
    number: 4,
    name: "NakamotoFreedom",
    image: "/home/hero/4.webp",
  },
  { number: 3, name: "UncleSeize", image: "/home/hero/3.webp" },
  {
    number: 2,
    name: "SeizeJPGs",
    image: "/home/hero/2.webp",
  },
  {
    number: 1,
    name: "6529Seizing",
    image: "/home/hero/1.webp",
  },
];

function ArtworkImage({
  artwork,
  front,
}: {
  readonly artwork: Artwork;
  readonly front: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const imageProps = {
    fill: true,
    loading: front ? ("eager" as const) : ("lazy" as const),
    className: "tw-object-contain",
  };
  return (
    <Image
      alt=""
      {...imageProps}
      src={artwork.image}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

export default function HeroArtworkFan() {
  // Decorative repeats of collection artwork; discovery links remain in the sections below.
  return (
    <div
      aria-hidden="true"
      data-home-artwork-fan
      className={clsx(
        styles["fan"],
        "tw-relative tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[580px]"
      )}
    >
      {HERO_ARTWORKS.map((artwork, index) => (
        <figure
          key={artwork.number}
          data-slot={index}
          className={clsx(
            styles["card"],
            "tw-absolute tw-m-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1.5 tw-pb-0 tw-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          )}
        >
          <div className="tw-relative tw-aspect-[4/5] tw-overflow-hidden tw-rounded-md tw-bg-black">
            <ArtworkImage
              key={artwork.image}
              artwork={artwork}
              front={index === 4}
            />
          </div>
          <figcaption className="tw-flex tw-h-8 tw-items-center tw-justify-between tw-gap-2 tw-text-[8px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-300">
            <span className="tw-truncate">{artwork.name}</span>
            <span className="tw-shrink-0">#{artwork.number}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
