import type { ReactNode } from "react";

interface NowMintingStatsItemProps {
  readonly label: ReactNode;
  readonly value?: string | undefined;
  readonly status?: "active" | "upcoming" | "ended" | undefined;
  readonly isLoading?: boolean;
}

export default function NowMintingStatsItem({
  label,
  value,
  status,
  isLoading,
}: NowMintingStatsItemProps) {
  const getValueColor = () => {
    if (status === "active") return "tw-text-emerald-400";
    if (status === "ended") return "tw-text-iron-400";
    return "tw-text-white";
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-font-medium tw-text-iron-500">
        {label}
      </span>
      {isLoading ? (
        <span className="tw-h-6 tw-w-20 tw-animate-pulse tw-rounded tw-bg-iron-800" />
      ) : (
        <span
          className={`tw-whitespace-nowrap tw-font-mono tw-text-sm tw-font-medium md:tw-text-base ${getValueColor()}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
