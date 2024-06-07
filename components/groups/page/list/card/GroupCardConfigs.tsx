import { GroupDescriptionType } from "../../../../../entities/IGroup";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import { GroupFilterDirection } from "../../../../../generated/models/GroupFilterDirection";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import GroupCardConfig from "./GroupCardConfig";

export interface GroupCardConfigProps {
  readonly key: GroupDescriptionType;
  readonly value: string;
}

export default function GroupCardConfigs({
  group,
}: {
  readonly group: GroupFull;
}) {
  const directionLabels: Record<GroupFilterDirection, string> = {
    [GroupFilterDirection.Received]: "from",
    [GroupFilterDirection.Sent]: "to",
  };

  const getMinMaxValue = ({
    min,
    max,
  }: {
    readonly min: number | null;
    readonly max: number | null;
  }): string | null => {
    if (min === null && max === null) {
      return null;
    }
    if (min === null) {
      return `<= ${max}`;
    }
    if (max === null) {
      return `>= ${min}`;
    }
    return `${min} - ${max}`;
  };

  const getIdentityValue = ({
    identity,
    direction,
  }: {
    readonly identity: string | null;
    readonly direction: GroupFilterDirection | null;
  }): string | null => {
    if (!identity) {
      return null;
    }
    return `${
      direction ? directionLabels[direction] : ""
    } identity: ${identity}`;
  };

  const getTdhConfig = (
    tdh: GroupDescription["tdh"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: tdh.min, max: tdh.max });
    if (!value) {
      return null;
    }
    return {
      key: GroupDescriptionType.TDH,
      value,
    };
  };

  const getRepConfig = (
    rep: GroupDescription["rep"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: rep.min, max: rep.max });
    const category = rep.category?.length ? `category: ${rep.category}` : null;
    const identity = getIdentityValue({
      identity: rep.user_identity,
      direction: rep.direction,
    });
    const parts = [value, category, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }
    return {
      key: GroupDescriptionType.REP,
      value: parts.join(", "),
    };
  };

  const getCicConfig = (
    cic: GroupDescription["cic"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: cic.min, max: cic.max });
    const identity = getIdentityValue({
      identity: cic.user_identity,
      direction: cic.direction,
    });
    const parts = [value, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }

    return {
      key: GroupDescriptionType.CIC,
      value: parts.join(", "),
    };
  };

  const getLevelConfig = (
    level: GroupDescription["level"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: level.min, max: level.max });
    if (!value) {
      return null;
    }
    return {
      key: GroupDescriptionType.LEVEL,
      value,
    };
  };

  const getWalletsConfig = (
    wallet_group_wallets_count: GroupDescription["wallet_group_wallets_count"]
  ): GroupCardConfigProps | null => {
    if (!wallet_group_wallets_count) {
      return null;
    }
    return {
      key: GroupDescriptionType.WALLETS,
      value: `${wallet_group_wallets_count}`,
    };
  };

  const getConfigs = (): GroupCardConfigProps[] => {
    const configs: GroupCardConfigProps[] = [];
    const { tdh, rep, cic, level, wallet_group_wallets_count } = group.group;
    const tdhConfig = getTdhConfig(tdh);
    const repConfig = getRepConfig(rep);
    const cicConfig = getCicConfig(cic);
    const levelConfig = getLevelConfig(level);
    const walletsConfig = getWalletsConfig(wallet_group_wallets_count);
    if (tdhConfig) {
      configs.push(tdhConfig);
    }
    if (repConfig) {
      configs.push(repConfig);
    }
    if (cicConfig) {
      configs.push(cicConfig);
    }
    if (levelConfig) {
      configs.push(levelConfig);
    }
    if (walletsConfig) {
      configs.push(walletsConfig);
    }

    return configs;
  };

  const configs = getConfigs();

  return (
    <div className="tw-mt-2 tw-relative">
      <div className="tw-overflow-x-hidden">
        <div className="tw-flex tw-items-center tw-gap-x-3 tw-overflow-x-auto horizontal-menu-hide-scrollbar">
          {configs.map((config) => (
            <GroupCardConfig key={config.key} config={config} />
          ))}
        </div>
      </div>
      <button className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-top-0 tw-z-10 tw-p-0 tw-h-8 tw-w-8 tw-right-0 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-rounded-md tw-border-none">
        <svg
          className="tw-h-5 tw-w-5 tw-text-iron-200 group-hover:tw-text-iron-400 -tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
