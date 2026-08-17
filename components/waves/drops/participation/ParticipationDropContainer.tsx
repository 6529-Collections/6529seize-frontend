import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  CHAT_PROPOSAL_CARD_SURFACE_CLASS,
  PROPOSAL_CARD_SURFACE_CLASS,
  type DropContentPresentation,
} from "../dropContentPresentation";
import { DropLocation } from "../drop.types";
import { getRankHoverBorderClass } from "../dropRankStyles";

interface ParticipationDropContainerProps {
  readonly drop: ExtendedDrop;
  readonly isActiveDrop: boolean;
  readonly location: DropLocation;
  readonly children: React.ReactNode;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly alignCardWithContent?: boolean | undefined;
  readonly leadingContent?: React.ReactNode | undefined;
  readonly useRankStyles?: boolean | undefined;
  readonly floatingActions?: React.ReactNode | undefined;
}

const ACTIVE_DROP_STYLES =
  "tw-border tw-border-[#3CCB7F]/45 tw-shadow-[0_0_0_1px_rgba(60,203,127,0.14)]";

const getDropStyles = ({
  isActiveDrop,
  rank,
  isDrop,
  isChatProposal,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
  isChatProposal: boolean;
}): string => {
  if (!isDrop) {
    return "";
  }

  if (isActiveDrop) {
    return ACTIVE_DROP_STYLES;
  }

  if (isChatProposal) {
    return CHAT_PROPOSAL_CARD_SURFACE_CLASS;
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
  contentPresentation,
  isChatProposal,
}: {
  isActiveDrop: boolean;
  contentPresentation: DropContentPresentation;
  isChatProposal: boolean;
}): string => {
  if (isActiveDrop) {
    return "tw-bg-[#3CCB7F]/10";
  }

  if (isChatProposal) {
    return "";
  }

  if (contentPresentation === "proposalCard") {
    return PROPOSAL_CARD_SURFACE_CLASS;
  }

  return "tw-bg-iron-950";
};

export default function ParticipationDropContainer({
  drop,
  isActiveDrop,
  location,
  children,
  contentPresentation = "default",
  alignCardWithContent = false,
  leadingContent,
  useRankStyles = true,
  floatingActions,
}: ParticipationDropContainerProps) {
  const isDrop = drop.drop_type === ApiDropType.Participatory;
  const isChatProposal =
    contentPresentation === "proposalCard" && alignCardWithContent;
  const dropStyles = getDropStyles({
    isActiveDrop,
    rank: useRankStyles ? drop.rank : null,
    isDrop,
    isChatProposal,
  });
  const backgroundClass = getBackgroundClass({
    isActiveDrop,
    contentPresentation,
    isChatProposal,
  });
  const cardWidthClass = alignCardWithContent
    ? "tw-w-full sm:tw-ml-[3.25rem] sm:tw-w-[calc(100%-3.25rem)]"
    : "tw-w-full";

  return (
    <div
      className={`${location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""} ${
        location === DropLocation.PROFILE ? "tw-mb-3" : ""
      } tw-w-full`}
    >
      <div className="tw-group tw-relative tw-w-full">
        {floatingActions}
        {leadingContent}
        <div
          className={`tw-flex ${cardWidthClass} tw-flex-col tw-overflow-hidden tw-rounded-xl ${backgroundClass} ${dropStyles} tw-border-solid tw-transition-[box-shadow,background-color,border-color] ${isChatProposal ? "tw-duration-300" : "tw-duration-200"} tw-ease-out`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
