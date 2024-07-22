import { IFeedItemWaveCreated } from "../../../../../types/feed.types";

export default function FeedItemWaveCreated({
  item,
}: {
  readonly item: IFeedItemWaveCreated;
}) {
  return <div>Wave created - {item.serial_no}</div>;
}
