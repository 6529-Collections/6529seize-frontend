interface NowMintingDetailsAccordionProps {
  readonly collection: string;
  readonly season: number;
  readonly memeName: string;
  readonly artist: string;
}

export default function NowMintingDetailsAccordion({
  collection,
  season,
  memeName,
  artist,
}: NowMintingDetailsAccordionProps) {
  return (
    <details className="tw-group">
      <summary className="tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-py-2 tw-text-sm tw-text-iron-300">
        <span>Details</span>
        <span className="tw-transition-transform group-open:tw-rotate-180">
          ▼
        </span>
      </summary>
      <div className="tw-space-y-1 tw-py-2 tw-text-sm tw-text-iron-400">
        <div>Collection: {collection}</div>
        <div>Season: {season}</div>
        <div>Meme: {memeName}</div>
        <div>Artist: {artist}</div>
      </div>
    </details>
  );
}
