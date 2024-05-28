import WavesDropsMetadata from "./WavesDropsMetadata";
import WavesDropsTypes from "./WavesDropsTypes";

export default function WavesDrops() {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        <WavesDropsTypes />
        <WavesDropsMetadata />
      </div>
    </div>
  );
}
