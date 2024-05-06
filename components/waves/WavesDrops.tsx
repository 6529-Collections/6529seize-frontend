import WavesDropsScope from "./WavesDropsScope";
import WavesDropsApplicationsPerParticipant from "./WavesDropsApplicationsPerParticipant";
import WavesDropsMetadata from "./WavesDropsMetadata";
import WavesDropsSteps from "./WavesDropsSteps";

export default function WavesDrops() {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-16">
      <WavesDropsSteps />
      <div className="tw-max-w-xl tw-mx-auto tw-w-full">
        <WavesDropsScope />
        {/*  <WavesDropsApplicationsPerParticipant /> */}
        {/*   <WavesDropsMetadata />  */}
      </div>
    </div>
  );
}
