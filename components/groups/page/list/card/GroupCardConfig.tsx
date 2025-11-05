import { GroupDescriptionType } from "@/entities/IGroup";
import { GroupCardConfigProps } from "./GroupCardConfigs";

export default function GroupCardConfig({
  config,
}: {
  readonly config: GroupCardConfigProps;
}) {
  const configLabel: Record<GroupDescriptionType, string> = {
    [GroupDescriptionType.TDH]: "Tdh",
    [GroupDescriptionType.REP]: "Rep",
    [GroupDescriptionType.NIC]: "NIC",
    [GroupDescriptionType.LEVEL]: "Level",
    [GroupDescriptionType.OWNS_NFTS]: "Owns NFTs",
    [GroupDescriptionType.WALLETS]: "Identities",
  };

  return (
    <div className="tw-inline-flex tw-cursor-default tw-items-center tw-gap-x-1 tw-text-xs tw-font-medium tw-text-iron-200 sm:tw-text-sm">
      <span className="tw-text-iron-400">{configLabel[config.key]}:</span>
      <span className="tw-font-semibold tw-text-iron-50 tw-whitespace-nowrap">{config.value}</span>
    </div>
  );
}
