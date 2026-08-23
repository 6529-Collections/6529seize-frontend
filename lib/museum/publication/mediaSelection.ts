import type { MuseumMedia } from "./types";

/** Selects an explicitly typed still for image presentation; live media is never decoded as an image. */
export function selectMuseumStillMedia(
  media: readonly MuseumMedia[]
): MuseumMedia | undefined {
  return media.find((item) => item.kind === "still");
}

export function museumMediaResponsiveImage(media: MuseumMedia): {
  readonly src: string;
  readonly srcSet?: string;
} {
  const variants = [...(media.variants ?? [])].sort(
    (left, right) => left.width - right.width
  );
  const smallest = variants[0];
  return {
    src: smallest?.url ?? media.url,
    ...(variants.length === 0
      ? {}
      : {
          srcSet: variants
            .map((variant) => `${variant.url} ${String(variant.width)}w`)
            .join(", "),
        }),
  };
}
