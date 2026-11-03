import { GroupDescriptionType } from "@/entities/IGroup";
import type { GroupCardConfigProps } from "./GroupCardConfigs";

export default function GroupCardConfig({
  config,
  quiet = false,
}: {
  readonly config: GroupCardConfigProps;
  readonly quiet?: boolean | undefined;
}) {
  const configLabel: Record<GroupDescriptionType, string> = {
    [GroupDescriptionType.TDH]: "Tdh",
    [GroupDescriptionType.REP]: "Rep",
    [GroupDescriptionType.NIC]: "NIC",
    [GroupDescriptionType.LEVEL]: "Level",
    [GroupDescriptionType.OWNS_NFTS]: "Owns NFTs",
    [GroupDescriptionType.WALLETS]: "Manual list",
    [GroupDescriptionType.XTDH_GRANT]: "Grant",
  };
  const activeValueClasses = quiet
    ? "tw-font-medium tw-text-iron-200"
    : "tw-font-semibold tw-text-iron-50";
  const valueClasses = config.muted ? "tw-text-iron-500" : activeValueClasses;

  return (
    <div
      className={`tw-inline-flex tw-flex-shrink-0 tw-cursor-default tw-items-center tw-gap-x-1 tw-text-xs ${quiet ? "tw-max-w-full tw-rounded-md tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-900/60 tw-px-2.5 tw-py-1 tw-font-normal tw-text-iron-300" : "tw-whitespace-nowrap tw-font-medium tw-text-iron-200 sm:tw-text-sm"}`}
      title={config.tooltip}
    >
      <span className="tw-text-iron-400">
        {config.label ?? configLabel[config.key]}:
      </span>
      <span
        className={`${quiet ? "tw-min-w-0 tw-break-words" : "tw-whitespace-nowrap"} ${valueClasses}`}
      >
        {config.value}
      </span>
    </div>
  );
}
