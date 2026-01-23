import { getNextMintStart } from "@/components/meme-calendar/meme-calendar.helpers";
import ClockIcon from "@/components/utils/icons/ClockIcon";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

type StatusType = "error" | "sold_out" | "finalized";

interface StatusConfig {
  icon: ReactNode;
  iconBg: string;
  iconRing: string;
  topLeftText: string;
  blackDivText: string;
}

const STATUS_CONFIGS: Record<StatusType, StatusConfig> = {
  error: {
    icon: <ExclamationTriangleIcon className="tw-size-5 tw-text-[#C9A879]" />,
    iconBg: "tw-bg-[#C9A879]/10",
    iconRing: "tw-ring-[#C9A879]/20",
    topLeftText: "Error",
    blackDivText: "Error fetching mint information. Please try again later.",
  },
  sold_out: {
    icon: (
      <CheckCircleIcon className="tw-size-[30px] tw-flex-shrink-0 tw-text-emerald-300/80" />
    ),
    iconBg: "tw-bg-iron-900/60",
    iconRing: "tw-ring-white/10",
    topLeftText: "Mint Complete",
    blackDivText: "All editions have been minted!",
  },
  finalized: {
    icon: <ClockIcon className="tw-size-7 tw-text-iron-300" />,
    iconBg: "tw-bg-white/5",
    iconRing: "tw-ring-white/10",
    topLeftText: "Mint Complete",
    blackDivText: "Minting for this drop has ended.",
  },
};

interface NowMintingCountdownStatusProps {
  readonly type: StatusType;
  readonly hideNextDrop?: boolean;
}

export default function NowMintingCountdownStatus({
  type,
  hideNextDrop,
}: NowMintingCountdownStatusProps) {
  const config = STATUS_CONFIGS[type];
  const nextMintDate = getNextMintStart();
  const formattedDate = nextMintDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
        <span className="tw-py-0.5 tw-text-xs tw-font-semibold tw-text-iron-300">
          {config.topLeftText}
        </span>
      </div>
      <div className="tw-flex tw-h-14 tw-items-center tw-justify-center tw-gap-3 tw-rounded-md tw-border tw-border-white/5 tw-bg-black/80 tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
        <div
          className={`tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-ring-1 ${config.iconBg} ${config.iconRing}`}
        >
          {config.icon}
        </div>
        <span className="tw-text-sm tw-font-medium tw-text-iron-100">
          {config.blackDivText}
        </span>
      </div>
      {type !== "error" && !hideNextDrop && (
        <div className="tw-mt-3 tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950">
          Next drop {formattedDate}
        </div>
      )}
    </div>
  );
}
