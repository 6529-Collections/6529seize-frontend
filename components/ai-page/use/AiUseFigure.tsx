import Image from "next/image";

import {
  AI_USE_IMAGES,
  type AiUseImageKey,
} from "@/lib/ai-page/content/useImages";

const FRAME =
  "tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950";

/**
 * A picture from the walk-through, in the cards' 1 px border and radius. A
 * page fills the column; a dialog shows at its real size, centred; a phone
 * screen sits in a row of them (see AiUsePhoneRow).
 */
export default function AiUseFigure({
  image,
  alt,
}: {
  readonly image: AiUseImageKey;
  readonly alt: string;
}) {
  const picture = AI_USE_IMAGES[image];
  if (picture.kind === "page") {
    return (
      <div className={FRAME}>
        <Image
          src={picture.src}
          alt={alt}
          width={picture.width}
          height={picture.height}
          sizes="(min-width: 1152px) 820px, (min-width: 1024px) 70vw, 100vw"
          className="tw-block tw-h-auto tw-w-full"
        />
      </div>
    );
  }
  return (
    <div
      className={`${FRAME} tw-mx-auto tw-w-full`}
      style={{ maxWidth: picture.cssWidth }}
    >
      <Image
        src={picture.src}
        alt={alt}
        width={picture.width}
        height={picture.height}
        sizes={`${picture.cssWidth}px`}
        className="tw-block tw-h-auto tw-w-full"
      />
    </div>
  );
}

/** Phone-width screens side by side: two on a phone, three from 640 px. */
export function AiUsePhoneRow({
  images,
}: {
  readonly images: readonly {
    readonly image: AiUseImageKey;
    readonly alt: string;
  }[];
}) {
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0 sm:tw-grid-cols-3 sm:tw-gap-4">
      {images.map(({ image, alt }) => {
        const picture = AI_USE_IMAGES[image];
        return (
          <li key={image} className={FRAME}>
            <Image
              src={picture.src}
              alt={alt}
              width={picture.width}
              height={picture.height}
              sizes="(min-width: 640px) 260px, 45vw"
              className="tw-block tw-h-auto tw-w-full"
            />
          </li>
        );
      })}
    </ul>
  );
}
