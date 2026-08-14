export function museumResearchMediaAspectRatio(
  width: number | null,
  height: number | null
): number | undefined {
  if (width === null || height === null || width <= 0 || height <= 0) {
    return undefined;
  }
  return width / height;
}
