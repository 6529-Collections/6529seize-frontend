import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumProgramMedia } from "@/lib/museum/types";
import { MuseumManagedImage } from "./MuseumManagedImage";

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
  const sourceUrl = smallest?.url ?? media.sourceUrl;
  const sourceWidth = smallest?.width ?? media.sourceWidth ?? undefined;
  const sourceHeight = smallest?.height ?? media.sourceHeight ?? undefined;
  const srcSet =
    variants.length === 0
      ? undefined
      : variants
          .map((variant) => `${variant.url} ${variant.width}w`)
          .join(", ");

  return (
    <MuseumManagedImage
      src={sourceUrl}
      {...(srcSet === undefined ? {} : { srcSet, sizes })}
      {...(sourceWidth === undefined ? {} : { width: sourceWidth })}
      {...(sourceHeight === undefined ? {} : { height: sourceHeight })}
      alt={media.altText}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
      retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
      {...(className === undefined ? {} : { className })}
    />
  );
}
