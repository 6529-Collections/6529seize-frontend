import { NextgenCollectionView } from "@/types/enums";

export function getNextgenTokenViewSegment(
  view: NextgenCollectionView
): string {
  if (view === NextgenCollectionView.ABOUT) return "";
  if (view === NextgenCollectionView.LISTINGS_AND_OFFERS)
    return "listings-and-offers";
  return view.toLowerCase().replaceAll(" ", "-");
}

export function getNextgenTokenView(segment: string): NextgenCollectionView {
  const normalized = segment.toLowerCase();
  return (
    [
      NextgenCollectionView.PROVENANCE,
      NextgenCollectionView.DISPLAY_CENTER,
      NextgenCollectionView.RARITY,
      NextgenCollectionView.LISTINGS_AND_OFFERS,
    ].find(
      (view) =>
        getNextgenTokenViewSegment(view) === normalized ||
        view.toLowerCase() === normalized
    ) ?? NextgenCollectionView.ABOUT
  );
}
