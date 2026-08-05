/* eslint-disable @next/next/no-img-element -- Museum media is already width-bounded, content-addressed, and format-optimized at the governed CDN URLs. */
import type { MuseumProgramMedia } from "@/lib/museum/types";

export function MuseumProgramImage({
  media,
  sizes,
  eager = false,
  className,
}: {
  readonly media: MuseumProgramMedia;
  readonly sizes: string;
  readonly eager?: boolean;
  readonly className?: string | undefined;
}) {
  const variants = [...media.variants].sort(
    (left, right) => left.width - right.width
  );
  const smallest = variants.at(0);
  const largest = variants.at(-1);
  const sourceUrl = smallest?.url ?? media.sourceUrl;
  const sourceWidth = largest?.width ?? media.sourceWidth ?? undefined;
  const sourceHeight = largest?.height ?? media.sourceHeight ?? undefined;
  const srcSet =
    variants.length === 0
      ? undefined
      : variants
          .map((variant) => `${variant.url} ${variant.width}w`)
          .join(", ");

  return (
    <img
      src={sourceUrl}
      srcSet={srcSet}
      sizes={srcSet === undefined ? undefined : sizes}
      width={sourceWidth}
      height={sourceHeight}
      alt={media.altText}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
