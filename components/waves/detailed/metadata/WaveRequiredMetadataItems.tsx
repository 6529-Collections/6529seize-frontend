import { Wave } from "../../../../generated/models/Wave";
import { WaveMetadataType } from "../../../../generated/models/WaveMetadataType";
import WaveRequiredMetadataItem from "./WaveRequiredMetadataItem";

export default function WaveRequiredMetadatItems({
  wave,
}: {
  readonly wave: Wave;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {wave.participation.required_metadata.map((metadata) => (
        <WaveRequiredMetadataItem
          key={metadata.name}
          metadata={metadata}
          wave={wave}
        />
      ))}
    </div>
  );
}
