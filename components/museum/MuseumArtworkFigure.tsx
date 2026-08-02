import Image from "next/image";
import Link from "next/link";
import type { CaseyArtwork } from "@/lib/museum/casey";

export function MuseumArtworkFigure({
  artwork,
  eager = false,
  href,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  readonly artwork: CaseyArtwork;
  readonly eager?: boolean;
  readonly href?: string;
  readonly sizes?: string;
}) {
  const image = (
    <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
      <Image
        src={artwork.imageUrl}
        alt={artwork.visualDescription}
        fill
        priority={eager}
        sizes={sizes}
        className="tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
        unoptimized
      />
    </div>
  );

  return (
    <figure className="tw-m-0 tw-min-w-0">
      {href ? (
        <Link
          href={href}
          className="tw-group tw-block tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black"
        >
          {image}
          <figcaption className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
            <span className="tw-min-w-0">
              <span className="tw-block tw-truncate tw-text-base tw-font-semibold tw-text-iron-50">
                {artwork.title}
              </span>
              <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                {artwork.project}, {artwork.year}
              </span>
            </span>
            <span className="group-hover:tw-text-primary-200 tw-shrink-0 tw-text-sm tw-font-medium tw-text-primary-300">
              View work
            </span>
          </figcaption>
        </Link>
      ) : (
        <>
          {image}
          <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {artwork.creditLine}{" "}
            {artwork.rightsUrl ? (
              <a
                href={artwork.rightsUrl}
                target="_blank"
                rel="license noopener noreferrer"
                className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {artwork.rightsLabel}
              </a>
            ) : (
              artwork.rightsLabel
            )}
          </figcaption>
        </>
      )}
    </figure>
  );
}
