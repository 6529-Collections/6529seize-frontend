import Image from "next/image";

/**
 * A screenshot of the product with its caption, at its own aspect ratio.
 * `alt` says what the screenshot shows; the caption says why it matters.
 */
export default function ReleaseFigure({
  src,
  width,
  height,
  alt,
  caption,
  maxWidth,
}: {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly caption: string;
  /** For a dialog or small window: the widest it is shown, in CSS pixels. */
  readonly maxWidth?: number | undefined;
}) {
  return (
    <figure
      className="tw-mx-0 tw-mb-8 tw-mt-2"
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black">
        <Image
          src={src}
          width={width}
          height={height}
          alt={alt}
          sizes={maxWidth ? `${maxWidth}px` : "(min-width: 768px) 720px, 100vw"}
          className="tw-block tw-h-auto tw-w-full"
        />
      </div>
      <figcaption className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
