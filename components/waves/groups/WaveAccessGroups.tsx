import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveGroup from "@/components/waves/specs/groups/group/WaveGroup";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";

interface WaveAccessGroupsProps {
  readonly wave: ApiWave;
  readonly includeCompetition?: boolean;
}

export default function WaveAccessGroups({
  wave,
  includeCompetition = true,
}: WaveAccessGroupsProps) {
  return (
    <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
      <WaveGroup
        scope={wave.visibility.scope}
        type={WaveGroupType.VIEW}
        wave={wave}
      />
      {includeCompetition && wave.wave.type !== ApiWaveType.Chat && (
        <>
          <WaveGroup
            scope={wave.participation.scope}
            type={WaveGroupType.DROP}
            wave={wave}
          />
          <WaveGroup
            scope={wave.voting.scope}
            type={WaveGroupType.VOTE}
            wave={wave}
          />
        </>
      )}
      <WaveGroup
        scope={wave.chat.scope}
        type={WaveGroupType.CHAT}
        wave={wave}
      />
      <WaveGroup
        scope={wave.wave.admin_group}
        type={WaveGroupType.ADMIN}
        wave={wave}
      />
    </div>
  );
}
