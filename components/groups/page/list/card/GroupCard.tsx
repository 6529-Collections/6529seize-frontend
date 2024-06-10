import { useState } from "react";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import { getRandomColorWithSeed } from "../../../../../helpers/Helpers";
import GroupCardView from "./GroupCardView";
import GroupCardRepAll from "./rep-all/GroupCardRepAll";
import GroupCardCICAll from "./cic-all/GroupCardCICAll";

export enum GroupCardState {
  IDLE = "IDLE",
  REP = "REP",
  CIC = "CIC",
}

export default function GroupCard({ group }: { readonly group: GroupFull }) {
  const [state, setState] = useState<GroupCardState>(GroupCardState.IDLE);

  const banner1 =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle);
  const banner2 =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle);

  const onActionCancel = () => setState(GroupCardState.IDLE);

  const components: Record<GroupCardState, JSX.Element> = {
    [GroupCardState.IDLE]: <GroupCardView group={group} setState={setState} />,
    [GroupCardState.REP]: (
      <GroupCardRepAll group={group} onCancel={onActionCancel} />
    ),
    [GroupCardState.CIC]: (
      <GroupCardCICAll group={group} onCancel={onActionCancel} />
    ),
  };
  return (
    <div className="tw-col-span-1">
      <div
        className="tw-relative tw-w-full tw-h-12 tw-rounded-t-2xl"
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
        }}
      >
        <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-[1.5px] tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
      </div>
      <div className="-tw-mt-1 tw-h-[196.5px] tw-bg-iron-900 tw-flex tw-flex-col tw-rounded-b-2xl tw-relative tw-border-[1.5px] tw-border-solid tw-border-t-0 tw-border-iron-700">
        {components[state]}
      </div>
    </div>
  );
}
