import { GroupDescriptionType } from "../../../../../entities/IGroup";
import { GroupCardConfigProps } from "./GroupCardConfigs";

export default function GroupCardConfig({
  config,
}: {
  readonly config: GroupCardConfigProps;
}) {
  const configLabel: Record<GroupDescriptionType, string> = {
    [GroupDescriptionType.TDH]: "Tdh",
    [GroupDescriptionType.REP]: "Rep",
    [GroupDescriptionType.CIC]: "CIC",
    [GroupDescriptionType.LEVEL]: "Level",
    [GroupDescriptionType.OWNS_NFTS]: "Owns NFTs",
    [GroupDescriptionType.WALLETS]: "Identities",
  };

  return (
    <div className="tw-whitespace-nowrap tw-cursor-default tw-inline-flex tw-items-center tw-gap-x-1 tw-justify-between tw-shadow-sm tw-rounded-lg tw-px-2 tw-py-1.5 tw-text-sm tw-font-normal tw-text-iron-300 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-iron-700">
      <span>{configLabel[config.key]}:</span>
      <span className="tw-font-semibold">{config.value}</span>
    </div>
  );
}
