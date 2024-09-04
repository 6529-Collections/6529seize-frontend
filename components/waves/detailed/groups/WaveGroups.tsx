import { Wave } from "../../../../generated/models/Wave";
import WaveGroup, { WaveGroupType } from "../specs/groups/group/WaveGroup";

export default function WaveGroups({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div >
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
                Groups
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              <WaveGroup
                scope={wave.visibility.scope}
                type={WaveGroupType.VIEW}
                isEligible={true}
                wave={wave}
              />
              <WaveGroup
                scope={wave.participation.scope}
                type={WaveGroupType.DROP}
                isEligible={wave.participation.authenticated_user_eligible}
                wave={wave}
              />
              <WaveGroup
                scope={wave.voting.scope}
                type={WaveGroupType.VOTE}
                isEligible={wave.voting.authenticated_user_eligible}
                wave={wave}
              />
              <WaveGroup
                scope={wave.wave.admin_group}
                type={WaveGroupType.ADMIN}
                isEligible={wave.wave.authenticated_user_eligible_for_admin}
                wave={wave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
