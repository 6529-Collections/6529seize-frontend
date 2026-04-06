import { publicEnv } from "@/config/env";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getWaveRoute } from "@/helpers/navigation.helpers";

const isMemesSubmissionCopyLinkDrop = ({
  drop,
  isMemesWave,
}: {
  drop: ApiDrop;
  isMemesWave: (waveId: string | undefined | null) => boolean;
}): boolean =>
  isMemesWave(drop.wave.id) && drop.drop_type === ApiDropType.Participatory;

export const getCopiedDropLink = ({
  drop,
  isDirectMessage,
  isMemesWave,
}: {
  drop: ApiDrop;
  isDirectMessage: boolean;
  isMemesWave: (waveId: string | undefined | null) => boolean;
}): string => {
  if (isMemesSubmissionCopyLinkDrop({ drop, isMemesWave })) {
    return `${publicEnv.BASE_ENDPOINT}${getWaveRoute({
      waveId: drop.wave.id,
      extraParams: { drop: drop.id },
      isDirectMessage: false,
      isApp: false,
    })}`;
  }

  return `${publicEnv.BASE_ENDPOINT}${getWaveRoute({
    waveId: drop.wave.id,
    serialNo: drop.serial_no,
    isDirectMessage,
    isApp: false,
  })}`;
};
