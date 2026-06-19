export type CmsArtGridMode = "editorial" | "dense" | "contact_sheet" | "clean";

export function getCmsArtGalleryGridClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "editorial":
      return "tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2";
    case "dense":
      return "tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-5";
    case "contact_sheet":
      return "tw-grid tw-grid-cols-3 tw-gap-2 sm:tw-grid-cols-4 lg:tw-grid-cols-6";
    case "clean":
      return "tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3";
  }
}

export function getCmsArtGalleryCardClassName(
  mode: CmsArtGridMode,
  index: number
): string {
  if (mode === "editorial" && index === 0) {
    return "tw-bg-iron-950 md:tw-col-span-2";
  }

  return "tw-bg-iron-950";
}

export function getCmsArtGalleryFrameClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "editorial":
      return "tw-min-h-[18rem]";
    case "dense":
    case "contact_sheet":
      return "tw-aspect-square";
    case "clean":
      return "tw-min-h-[16rem]";
  }
}

export function getCmsArtGalleryImageClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "dense":
    case "contact_sheet":
      return "tw-object-cover";
    case "editorial":
    case "clean":
      return "tw-object-contain";
  }
}

export function getCmsArtGalleryCaptionClassName(mode: CmsArtGridMode): string {
  if (mode === "contact_sheet") {
    return "tw-sr-only";
  }

  return "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-leading-6";
}
