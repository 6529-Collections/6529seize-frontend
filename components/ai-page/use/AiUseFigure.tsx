import type { AiUseImageKey } from "@/lib/ai-page/content/useImages";
import AiZoomPicture, { type AiZoomText } from "../AiZoomPicture";

/** A picture from the walk-through: its step's part, and the whole on a click. */
export default function AiUseFigure({
  image,
  alt,
  phoneAlt,
  text,
}: {
  readonly image: AiUseImageKey;
  readonly alt: string;
  readonly phoneAlt?: string | undefined;
  readonly text: AiZoomText;
}) {
  return (
    <AiZoomPicture image={image} alt={alt} phoneAlt={phoneAlt} text={text} />
  );
}

/**
 * Phone-width screens: two side by side from 640 px, at their real size;
 * on a phone, a row that scrolls sideways, one screen at a time.
 */
export function AiUsePhoneRow({
  images,
  text,
}: {
  readonly images: readonly {
    readonly image: AiUseImageKey;
    readonly alt: string;
  }[];
  readonly text: AiZoomText;
}) {
  return (
    <ul className="tw-m-0 -tw-mx-4 tw-flex tw-snap-x tw-snap-mandatory tw-list-none tw-gap-3 tw-overflow-x-auto tw-px-4 tw-pb-2 sm:tw-mx-0 sm:tw-grid sm:tw-grid-cols-2 sm:tw-gap-4 sm:tw-overflow-visible sm:tw-px-0 sm:tw-pb-0">
      {images.map(({ image, alt }) => (
        <li
          key={image}
          className="tw-w-[78vw] tw-max-w-[390px] tw-flex-none tw-snap-center sm:tw-w-auto"
        >
          <AiZoomPicture image={image} alt={alt} text={text} fill />
        </li>
      ))}
    </ul>
  );
}
