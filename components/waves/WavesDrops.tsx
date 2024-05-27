import WavesDropsMetadata from "./WavesDropsMetadata";
import WavesDropsTypes from "./WavesDropsTypes";

export default function WavesDrops() {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-6 tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
        <WavesDropsTypes />
        <WavesDropsMetadata />
      </div>
    </div>
  );
}
