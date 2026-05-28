import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropLocation } from "../drop.types";
import { getRankHoverBorderClass } from "../dropRankStyles";

interface ParticipationDropContainerProps {
  readonly drop: ExtendedDrop;
  readonly isActiveDrop: boolean;
  readonly location: DropLocation;
  readonly children: React.ReactNode;
  readonly useRankStyles?: boolean | undefined;
  readonly floatingActions?: React.ReactNode | undefined;
}

const ACTIVE_DROP_STYLES =
  "tw-border tw-border-[#3CCB7F]/45 tw-shadow-[0_0_0_1px_rgba(60,203,127,0.14)]";

const getDropStyles = ({
  isActiveDrop,
  rank,
  isDrop,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
}): string => {
  if (!isDrop) {
    return "";
  }

  if (isActiveDrop) {
    return ACTIVE_DROP_STYLES;
  }

  if (rank === null) {
    return "tw-border tw-border-iron-800 desktop-hover:hover:tw-border-iron-600";
  }

  switch (rank) {
    case 1:
      return `tw-border tw-border-iron-800 ${getRankHoverBorderClass(1)}`;
    case 2:
      return `tw-border tw-border-iron-800 ${getRankHoverBorderClass(2)}`;
    case 3:
      return `tw-border tw-border-iron-800 ${getRankHoverBorderClass(3)}`;
  }

  return "tw-border tw-border-iron-800 desktop-hover:hover:tw-border-iron-700";
};

const getBackgroundClass = ({
  isActiveDrop,
}: {
  isActiveDrop: boolean;
}): string => {
  if (isActiveDrop) {
    return "tw-bg-[#3CCB7F]/10";
  }

  return "tw-bg-iron-950";
};

export default function ParticipationDropContainer({
  drop,
  isActiveDrop,
  location,
  children,
  useRankStyles = true,
  floatingActions,
}: ParticipationDropContainerProps) {
  const isDrop = drop.drop_type === ApiDropType.Participatory;
  const dropStyles = getDropStyles({
    isActiveDrop,
    rank: useRankStyles ? drop.rank : null,
    isDrop,
  });
  const backgroundClass = getBackgroundClass({ isActiveDrop });

  return (
    <div
      className={`${location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""} tw-w-full`}
    >
      <div className="tw-group tw-relative tw-w-full">
        {floatingActions}
        <div
          className={`tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-xl ${backgroundClass} ${dropStyles} tw-border-solid tw-transition-[box-shadow,background-color,border-color] tw-duration-200 tw-ease-out`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
