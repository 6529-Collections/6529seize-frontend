import { Wave } from "../../../../generated/models/Wave";
import WaveRequiredMetadataItem from "./WaveRequiredMetadataItem";

export default function WaveRequiredMetadatItems({
  wave,
}: {
  readonly wave: Wave;
}) {
  return (
    <div className="tw-flex tw-flex-col">
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