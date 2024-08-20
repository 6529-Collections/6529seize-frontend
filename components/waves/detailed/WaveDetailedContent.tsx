import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import { Wave } from "../../../generated/models/Wave";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveDescriptionDrop from "./drops/WaveDescriptionDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveSingleDrop from "./drops/WaveSingleDrop";

export default function WaveDetailedContent({
  activeDropId,
  wave,
  availableRateResponse,
  onBackToList,
}: {
  readonly activeDropId: string | null;
  readonly wave: Wave;
  readonly availableRateResponse: ProfileAvailableDropRateResponse | undefined;
  readonly onBackToList: () => void;
}) {
  if (activeDropId) {
    return (
      <WaveSingleDrop
        dropId={activeDropId}
        availableCredit={
          availableRateResponse?.available_credit_for_rating ?? null
        }
        onBackToList={onBackToList}
      />
    );
  }

  return (
    <>
      <WaveCreateDrop wave={wave} />
      <WaveDescriptionDrop
        wave={wave}
        availableCredit={
          availableRateResponse?.available_credit_for_rating ?? null
        }
      />
      <WaveDrops
        wave={wave}
        availableCredit={
          availableRateResponse?.available_credit_for_rating ?? null
        }
      />
    </>
  );
}
